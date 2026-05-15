import { Schema, model } from 'mongoose';
import { IVariant } from './variant.interface';

const DimensionsSchema = new Schema(
  {
    l: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true },
  },
  { _id: false },
);

const VariantSchema = new Schema<IVariant>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true },
    options: { type: Map, of: String, required: true },
    optionsHash: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    reservedStock: { type: Number, required: true, default: 0, min: 0 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    weight: { type: Number, min: 0 },
    dimensions: { type: DimensionsSchema },
  },
  { timestamps: true, versionKey: false },
);

VariantSchema.index({ product: 1, optionsHash: 1 }, { unique: true });
VariantSchema.index({ product: 1, isActive: 1 });

export const VariantModel = model<IVariant>('Variant', VariantSchema);
