import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const createReviewSchema = z.object({
  body: z.object({
    product: objectId,
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3).max(2000),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(3).max(2000).optional(),
  }),
  params: z.object({ id: objectId }),
});

export const reviewIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export const reviewByProductParamsSchema = z.object({
  params: z.object({ productId: objectId }),
});
