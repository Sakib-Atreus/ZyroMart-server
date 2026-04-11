import { z } from 'zod';

// Variant Options validation
export const variantOptionsValidationSchema = z.object({
  color: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  capacity: z.string().optional(),
  connectivity: z.string().optional(),
});

// Variant validation schema (for creating a variant)
export const variantValidationSchema = z.object({
  productId: z.string().min(24, 'Product ID must be a valid MongoDB ObjectId'),
  options: variantOptionsValidationSchema,
  price: z.number().min(0, 'Price must be a positive number'),
  quantity: z.number().min(0, 'Quantity must be a positive number'),
  inStock: z.boolean(),
  sku: z.string().min(1, 'SKU is required'),
});

// Partial variant validation schema (for updating a variant)
export const partialVariantValidationSchema = z.object({
  options: variantOptionsValidationSchema.optional(),
  price: z.number().min(0, 'Price must be a positive number').optional(),
  quantity: z.number().min(0, 'Quantity must be a positive number').optional(),
  inStock: z.boolean().optional(),
  sku: z.string().min(1, 'SKU is required').optional(),
});

