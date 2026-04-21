import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const applyVendorSchema = z.object({
  body: z.object({
    shopName: z.string().min(2).max(80),
    description: z.string().max(1000).optional(),
    logo: z.string().url().optional(),
    banner: z.string().url().optional(),
    address: z.object({
      line1: z.string().min(2),
      city: z.string().min(2),
      country: z.string().min(2),
      postalCode: z.string().optional(),
    }),
    contact: z.object({
      email: z.string().email(),
      phone: z.string().optional(),
    }),
  }),
});

export const updateVendorSchema = z.object({
  body: z.object({
    shopName: z.string().min(2).max(80).optional(),
    description: z.string().max(1000).optional(),
    logo: z.string().url().optional(),
    banner: z.string().url().optional(),
    address: applyVendorSchema.shape.body.shape.address.partial().optional(),
    contact: applyVendorSchema.shape.body.shape.contact.partial().optional(),
  }),
});

export const changeVendorStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'approved', 'suspended', 'rejected']),
    rejectionReason: z.string().optional(),
    commissionRate: z.number().min(0).max(1).optional(),
  }),
  params: z.object({ id: objectId }),
});
