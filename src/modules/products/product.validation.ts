import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const variantOptionDeclaration = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

const productBodySchema = z
  .object({
    category: objectId,
    name: z.string().min(2).max(200),
    brand: z.string().min(1).max(60),
    description: z.string().min(10),
    shortDescription: z.string().max(300).optional(),
    images: z.array(z.string().url()).min(1).max(15),
    thumbnail: z.string().url(),
    basePrice: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    hasVariants: z.boolean().default(false),
    variantOptions: z.array(variantOptionDeclaration).default([]),
    attributes: z.record(z.any()).default({}),
    tags: z.array(z.string()).max(30).default([]),
    warranty: z.string().max(200).optional(),
  })
  .refine(v => !v.hasVariants || v.variantOptions.length > 0, {
    message: 'variantOptions is required when hasVariants is true',
    path: ['variantOptions'],
  })
  .refine(
    v => v.compareAtPrice === undefined || v.compareAtPrice >= v.basePrice,
    { message: 'compareAtPrice must be >= basePrice', path: ['compareAtPrice'] },
  );

export const createProductSchema = z.object({ body: productBodySchema });

export const updateProductSchema = z.object({
  body: z
    .object({
      category: objectId.optional(),
      name: z.string().min(2).max(200).optional(),
      brand: z.string().min(1).max(60).optional(),
      description: z.string().min(10).optional(),
      shortDescription: z.string().max(300).optional(),
      images: z.array(z.string().url()).min(1).max(15).optional(),
      thumbnail: z.string().url().optional(),
      basePrice: z.number().positive().optional(),
      compareAtPrice: z.number().positive().optional(),
      currency: z.string().length(3).optional(),
      hasVariants: z.boolean().optional(),
      variantOptions: z.array(variantOptionDeclaration).optional(),
      attributes: z.record(z.any()).optional(),
      tags: z.array(z.string()).max(30).optional(),
      warranty: z.string().max(200).optional(),
    }),
  params: z.object({ id: objectId }),
});

export const changeProductStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'archived']),
    rejectionReason: z.string().optional(),
  }),
  params: z.object({ id: objectId }),
});

export const productIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});
