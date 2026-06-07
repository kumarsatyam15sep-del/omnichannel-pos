import { Request, Response } from 'express';
import { z } from 'zod';
import Inventory from '../models/Inventory';

const updateStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be a non-negative integer'),
  reorderPoint: z.number().int().min(0, 'Reorder point must be a non-negative integer')
});

// @desc    Get all inventory records
// @route   GET /api/inventory
// @access  Private (All roles)
export const getInventory = async (req: Request, res: Response): Promise<void> => {
  const { store } = req.query;
  const filter: any = {};

  if (store) {
    filter.store = store as string;
  }

  const inventoryRecords = await Inventory.find(filter)
    .populate('product', 'name category');

  res.json(inventoryRecords);
};

// @desc    Update quantity and reorderPoint for a specific inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Manager, Admin)
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  const result = updateStockSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
    return;
  }

  const { quantity, reorderPoint } = result.data;

  const inventory = await Inventory.findByIdAndUpdate(
    req.params.id,
    {
      quantity,
      reorderPoint,
      lastUpdated: new Date()
    },
    { new: true }
  ).populate('product', 'name category');

  if (!inventory) {
    res.status(404).json({ message: 'Inventory record not found' });
    return;
  }

  res.json(inventory);
};

// @desc    Get inventory items below or equal to their reorder point
// @route   GET /api/inventory/low-stock
// @access  Private (Manager, Admin)
export const getLowStock = async (req: Request, res: Response): Promise<void> => {
  const lowStockItems = await Inventory.find({
    $expr: { $lte: ['$quantity', '$reorderPoint'] }
  })
    .populate('product', 'name category')
    .populate('store', 'name');

  res.json(lowStockItems);
};
