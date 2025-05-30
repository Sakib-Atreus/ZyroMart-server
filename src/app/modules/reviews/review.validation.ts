import { z } from "zod";

// Zod schema for the Review interface
const reviewValidationSchema = z.object({
    productId: z
    .string()
    .nonempty("Product ID is required!"),
    userId: z
    .string()
    .nonempty("User ID is required!"),
    rating: z
        .number()
        .min(1, "Rating must be at least 1")
        .max(5, "Rating must not exceed 5"),
    comment: z.string().nonempty("Comment is required!"),
    createdAt: z.date().default(() => new Date()), // current date
});

// making the entire review schema optional
const partialReviewValidationSchema = reviewValidationSchema.partial();

// export validation schema
export { reviewValidationSchema, partialReviewValidationSchema };
