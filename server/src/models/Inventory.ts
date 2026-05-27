import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  product: mongoose.Types.ObjectId;
  store: mongoose.Types.ObjectId;
  sku: string;
  quantity: number;
  reorderPoint: number;
  lastUpdated?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema: Schema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    reorderPoint: { type: Number, default: 10 },
    lastUpdated: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Compound unique index on (product + store + sku)
InventorySchema.index({ product: 1, store: 1, sku: 1 }, { unique: true });

export default mongoose.model<IInventory>('Inventory', InventorySchema);
