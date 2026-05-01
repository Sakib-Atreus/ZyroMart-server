import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    body: z.string().min(1).max(2000),
  }),
});

export const conversationParamsSchema = z.object({
  params: z.object({
    conversationId: z.string().length(24, 'Invalid conversation id'),
  }),
});
