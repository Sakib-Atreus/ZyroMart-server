import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const addCartItemSchema = z.object({
  body: z.object({
    product: objectId,
    variant: objectId,
    quantity: z.number().int().positive().max(99),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive().max(99),
  }),
  params: z.object({ variantId: objectId }),
});

export const cartItemParamsSchema = z.object({
  params: z.object({ variantId: objectId }),
});
