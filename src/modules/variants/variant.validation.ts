import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const variantBody = z.object({
  product: objectId,
  sku: z.string().min(3).max(60),
  options: z.record(z.string()).refine(o => Object.keys(o).length > 0, {
    message: 'At least one option is required',
  }),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional().default(true),
  weight: z.number().positive().optional(),
  dimensions: z
    .object({ l: z.number().positive(), w: z.number().positive(), h: z.number().positive() })
    .optional(),
});

export const createVariantSchema = z.object({ body: variantBody });

export const bulkVariantsSchema = z.object({
  body: z.object({
    product: objectId,
    defaults: z.object({
      price: z.number().positive(),
      compareAtPrice: z.number().positive().optional(),
      stock: z.number().int().nonnegative().default(0),
    }),
    overrides: z
      .array(
        z.object({
          options: z.record(z.string()),
          price: z.number().positive().optional(),
          compareAtPrice: z.number().positive().optional(),
          stock: z.number().int().nonnegative().optional(),
          sku: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  }),
});

export const updateVariantSchema = z.object({
  body: variantBody.partial().omit({ product: true }),
  params: z.object({ id: objectId }),
});

export const variantIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export const variantByProductParamsSchema = z.object({
  params: z.object({ productId: objectId }),
});
