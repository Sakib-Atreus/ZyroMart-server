import { z } from "zod";

// Schema for creating a question
const questionValidationSchema = z.object({
  productId: z.string().nonempty("Product ID is required"),
  userId: z.string().nonempty("User ID is required"),
  question: z.string().min(5, "Question must be at least 3 characters long"),
  createdAt: z.date().default(() => new Date()),
});

// Schema for answering a question (only admin)
const answerQuestionValidationSchema = z.object({
  answer: z.string().min(1, "Answer cannot be empty!"),
});

// making the entire product schema optional
const partialQuestionValidationSchema = questionValidationSchema.partial();
const partialAnswerQuestionValidationSchema = answerQuestionValidationSchema.partial();

// export this validation schema for using another file
export { questionValidationSchema, answerQuestionValidationSchema, partialQuestionValidationSchema, partialAnswerQuestionValidationSchema };