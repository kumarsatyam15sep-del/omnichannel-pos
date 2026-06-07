import { Request, Response } from 'express';
import { z } from 'zod';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import redis from '../config/redis';

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be non-negative')
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  variants: z.array(variantSchema).default([]),
  store: z.string().optional()
});

const updateProductSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  variants: z.array(variantSchema).optional(),
  store: z.string().optional()
});

// Helper to invalidate all product keys in Redis cache
const clearProductCache = async (): Promise<void> => {
  try {
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Failed to clear product cache:', (error as Error).message);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Manager, Admin)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const result = createProductSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
    return;
  }

  const { name, category, description, variants, store } = result.data;

  const product = await Product.create({
    name,
    category,
    description,
    variants,
    store,
    isActive: true
  });

  // Automatically seed matching inventory items if variants and store are provided
  if (store && variants && variants.length > 0) {
    const inventoryItems = variants.map((v) => ({
      product: product._id,
      store,
      sku: v.sku,
      quantity: v.stock || 0,
      reorderPoint: 10,
      lastUpdated: new Date()
    }));
    await Inventory.insertMany(inventoryItems);
  }

  await clearProductCache();

  res.status(201).json(product);
};

// @desc    Get paginated products list with search and category filters
// @route   GET /api/products
// @access  Private (All roles)
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const { search, category, cursor, limit } = req.query;

  // Build cache key based on query parameters
  const cacheKey = `products:search=${search || ''}&category=${category || ''}&cursor=${cursor || ''}&limit=${limit || 20}`;

  try {
    const cachedResponse = await redis.get(cacheKey);
    if (cachedResponse) {
      res.json(JSON.parse(cachedResponse));
      return;
    }
  } catch (error) {
    console.error('Redis read error:', (error as Error).message);
  }

  const limitNum = parseInt(limit as string) || 20;
  const filter: any = { isActive: true };

  if (category) {
    filter.category = category as string;
  }

  if (search) {
    filter.$text = { $search: search as string };
  }

  if (cursor) {
    filter._id = { $gt: cursor as string };
  }

  // Retrieve limitNum + 1 products to check for next page
  const products = await Product.find(filter)
    .sort({ _id: 1 })
    .limit(limitNum + 1);

  let nextCursor: string | null = null;
  if (products.length > limitNum) {
    products.pop(); // Remove extra element
    nextCursor = products[products.length - 1]._id.toString();
  }

  const responseBody = {
    products,
    nextCursor
  };

  try {
    // Cache the response with 5 min (300s) TTL
    await redis.setex(cacheKey, 300, JSON.stringify(responseBody));
  } catch (error) {
    console.error('Redis write error:', (error as Error).message);
  }

  res.json(responseBody);
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Private (All roles)
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json(product);
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Private (Manager, Admin)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const result = updateProductSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
    return;
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    result.data,
    { new: true }
  );

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  await clearProductCache();

  res.json(product);
};

// @desc    Soft delete a product by setting isActive to false
// @route   DELETE /api/products/:id
// @access  Private (Admin)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { isActive: false },
    { new: true }
  );

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  await clearProductCache();

  res.json({ message: 'Product deactivated successfully' });
};
