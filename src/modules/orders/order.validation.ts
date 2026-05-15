import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const addressSchema = z.object({
  fullName: z.string().min(2).max(80),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(60),
  country: z.string().min(2).max(60),
  postalCode: z.string().max(20).optional(),
  phone: z.string().min(5).max(20),
});

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    paymentMethod: z.enum(['stripe', 'cod', 'sslcommerz']),
    discount: z.number().nonnegative().optional(),
  }),
});

export const orderIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
    note: z.string().optional(),
  }),
  params: z.object({ id: objectId }),
});

export const cancelOrderSchema = z.object({
  body: z.object({ reason: z.string().max(500).optional() }).optional(),
  params: z.object({ id: objectId }),
});
