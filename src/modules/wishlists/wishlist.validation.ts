import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const addWishlistItemSchema = z.object({
  body: z.object({
    product: objectId,
  }),
});

export const wishlistItemParamsSchema = z.object({
  params: z.object({ productId: objectId }),
});
