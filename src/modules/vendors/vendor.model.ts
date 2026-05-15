import { Schema, model } from 'mongoose';
import { IVendor } from './vendor.interface';

const AddressSchema = new Schema(
  {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String },
  },
  { _id: false },
);

const ContactSchema = new Schema(
  {
    email: { type: String, required: true },
    phone: { type: String },
  },
  { _id: false },
);

const VendorSchema = new Schema<IVendor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      unique: true,
      index: true,
    },
    shopName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String },
    logo: { type: String },
    banner: { type: String },
    address: { type: AddressSchema, required: true },
    contact: { type: ContactSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String },
    commissionRate: { type: Number, default: 0.08, min: 0, max: 1 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0, min: 0 },
    stripeAccountId: { type: String },
  },
  { timestamps: true, versionKey: false },
);

export const VendorModel = model<IVendor>('Vendor', VendorSchema);
