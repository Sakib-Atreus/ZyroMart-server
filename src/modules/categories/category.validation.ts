import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const attributeDefSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, 'key must be snake_case (lowercase, digits, underscores)'),
  label: z.string().min(1),
  group: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'enum', 'multiselect']),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional().default(false),
  isVariantOption: z.boolean().optional().default(false),
  filterable: z.boolean().optional().default(false),
  searchable: z.boolean().optional().default(false),
}).refine(
  v => !['enum', 'multiselect'].includes(v.type) || (v.options && v.options.length > 0),
  { message: 'options[] is required when type is enum/multiselect', path: ['options'] },
);

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    parent: objectId.optional().nullable(),
    icon: z.string().url().optional(),
    attributeSchema: z.array(attributeDefSchema).default([]),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCategorySchema = z.object({
  body: createCategorySchema.shape.body.partial(),
  params: z.object({ id: objectId }),
});

export const categoryParamsSchema = z.object({
  params: z.object({ id: objectId }),
});
