import mongoose, { Schema, Document } from 'mongoose';

export interface IVariant {
  size?: string;
  color?: string;
  sku: string;
  price: number;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  category: string;
  description?: string;
  variants: IVariant[];
  store?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema({
  size: { type: String },
  color: { type: String },
  sku: { type: String, required: true, unique: true, sparse: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true }
});

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    variants: [VariantSchema],
    store: { type: Schema.Types.ObjectId, ref: 'Store' },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

// Text index on name and category for full-text search
ProductSchema.index({ name: 'text', category: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
