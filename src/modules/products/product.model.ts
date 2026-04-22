import { Schema, model } from 'mongoose';
import { IProduct, IVariantOptionDeclaration } from './product.interface';

const VariantOptionDeclarationSchema = new Schema<IVariantOptionDeclaration>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    values: { type: [String], required: true, default: [] },
  },
  { _id: false },
);

const ProductSchema = new Schema<IProduct>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    brand: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String },

    images: { type: [String], required: true, default: [] },
    thumbnail: { type: String, required: true },

    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, required: true, default: 'BDT', uppercase: true },

    hasVariants: { type: Boolean, default: false },
    variantOptions: { type: [VariantOptionDeclarationSchema], default: [] },

    attributes: { type: Map, of: Schema.Types.Mixed, default: {} },

    tags: { type: [String], default: [] },
    warranty: { type: String },

    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String },

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    questionCount: { type: Number, default: 0, min: 0 },
    totalSold: { type: Number, default: 0, min: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
);

ProductSchema.index({ vendor: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ status: 1, createdAt: -1 });

// Single text index (Mongo allows only one per collection).
// Weights bias matches on `name` above description. If this collection already
// has an older `name_text_description_text_tags_text` index on a running DB,
// drop it once before deploy:  db.products.dropIndex('name_text_description_text_tags_text')
ProductSchema.index(
  { name: 'text', brand: 'text', tags: 'text', description: 'text' },
  {
    name: 'product_text_search',
    weights: { name: 10, brand: 5, tags: 3, description: 1 },
  },
);

export const ProductModel = model<IProduct>('Product', ProductSchema);
