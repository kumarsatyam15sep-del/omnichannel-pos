import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  store: mongoose.Types.ObjectId;
  cashier: mongoose.Types.ObjectId;
  items: mongoose.Types.ObjectId[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'credit' | 'digital_wallet';
  status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    cashier: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit', 'digital_wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
