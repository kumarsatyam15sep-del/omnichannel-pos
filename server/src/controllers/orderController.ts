import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Inventory from '../models/Inventory';
import Product from '../models/Product';
import { calculateTotal } from '../utils/calculateTotal';

const orderItemInputSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'UnitPrice must be non-negative'),
  discount: z.number().min(0).max(100).default(0)
});

const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  paymentMethod: z.enum(['cash', 'credit', 'digital_wallet']),
  storeId: z.string().min(1, 'Store ID is required'),
  taxRate: z.number().min(0).optional()
});

// @desc    Create a new order with atomic stock updates using a MongoDB transaction
// @route   POST /api/orders
// @access  Private (All roles)
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
    return;
  }

  const { items, paymentMethod, storeId, taxRate } = result.data;

  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  // Step 1 - Start a MongoDB session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderItemIds: mongoose.Types.ObjectId[] = [];

    // Step 2 & 3 - Loop through items, check stock, and decrement atomically
    for (const item of items) {
      const { product: productId, sku, quantity, unitPrice, discount } = item;

      // Find the inventory item for this SKU and store
      const inventory = await Inventory.findOne({
        store: storeId,
        sku: sku
      }).session(session);

      // Check inventory has enough stock for that SKU
      if (!inventory || inventory.quantity < quantity) {
        // If not enough stock abort the transaction and return 400
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: `Insufficient stock for SKU: ${sku}` });
        return;
      }

      // Decrement inventory quantity for each item atomically
      inventory.quantity -= quantity;
      inventory.lastUpdated = new Date();
      await inventory.save({ session });

      // Retrieve product name to create OrderItem document
      const product = await Product.findById(productId).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: `Product not found: ${productId}` });
        return;
      }

      // Step 4 - Create OrderItem documents for each line item
      const itemTotal = unitPrice * quantity * (1 - discount / 100);
      const roundedItemTotal = Math.round(itemTotal * 100) / 100;

      const orderItem = new OrderItem({
        product: productId,
        sku,
        name: product.name,
        quantity,
        unitPrice,
        discount,
        total: roundedItemTotal
      });

      await orderItem.save({ session });
      orderItemIds.push(orderItem._id as mongoose.Types.ObjectId);
    }

    // Step 5 - Calculate subtotal, tax and total using calculateTotal utility
    const taxRateVal = taxRate !== undefined ? taxRate : 0.18;
    const totals = calculateTotal(
      items.map(item => ({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discount: item.discount
      })),
      taxRateVal
    );

    // Calculate sum of undiscounted items to determine total order-level discount amount
    const undiscountedSubtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const discountAmount = Math.round((undiscountedSubtotal - totals.subtotal) * 100) / 100;

    // Step 6 - Create the Order document
    const order = new Order({
      store: storeId,
      cashier: req.user._id,
      items: orderItemIds,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: discountAmount,
      total: totals.total,
      paymentMethod,
      status: 'completed'
    });

    await order.save({ session });

    // Step 7 - Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Populate cashier name and items before returning
    const populatedOrder = await Order.findById(order._id)
      .populate('cashier', 'name')
      .populate({
        path: 'items',
        populate: { path: 'product', select: 'name category' }
      });

    res.status(201).json(populatedOrder);
  } catch (error) {
    // Step 8 - If anything fails abort the transaction and throw error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// @desc    Get orders filtered by store query parameter
// @route   GET /api/orders
// @access  Private (All roles)
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  const { store } = req.query;
  const filter: any = {};

  if (store) {
    filter.store = store as string;
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('cashier', 'name')
    .populate({
      path: 'items',
      populate: { path: 'product', select: 'name category' }
    });

  res.json(orders);
};
