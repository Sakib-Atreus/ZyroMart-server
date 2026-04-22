import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine(v => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const createQuestionSchema = z.object({
  body: z.object({
    product: objectId,
    question: z.string().min(3).max(2000),
  }),
});

export const answerQuestionSchema = z.object({
  body: z.object({
    answer: z.string().min(1).max(2000),
  }),
  params: z.object({ id: objectId }),
});

export const questionIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export const questionByProductParamsSchema = z.object({
  params: z.object({ productId: objectId }),
});
