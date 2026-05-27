import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'cashier' | 'manager' | 'admin';
  store?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['cashier', 'manager', 'admin'], default: 'cashier' },
    store: { type: Schema.Types.ObjectId, ref: 'Store' }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function (this: IUser) {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password || '', salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password || '');
};

export default mongoose.model<IUser>('User', UserSchema);
