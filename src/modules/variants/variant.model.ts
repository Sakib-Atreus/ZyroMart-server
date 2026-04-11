import mongoose, { Schema, Document } from 'mongoose';
import { Variant } from './variant.interface';

const variantSchema: Schema = new Schema<Variant>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantOptions: {
    type: Map,
    of: String,
    required: true,
  },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  inStock: { type: Boolean, required: true },
  sku: { type: String, required: true },
});

export const VariantModel = mongoose.model<Variant & Document>('Variant', variantSchema);
