import { Schema, model } from 'mongoose';
import { IAttributeDef, ICategory } from './category.interface';

const AttributeDefSchema = new Schema<IAttributeDef>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    group: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'enum', 'multiselect'],
      required: true,
    },
    unit: { type: String },
    options: { type: [String], default: undefined },
    required: { type: Boolean, default: false },
    isVariantOption: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
  },
  { _id: false },
);

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    icon: { type: String },
    attributeSchema: { type: [AttributeDefSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true, versionKey: false },
);

CategorySchema.index({ parent: 1, isActive: 1 });

export const CategoryModel = model<ICategory>('Category', CategorySchema);
