import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    orderId: objectId,
  }),
});
