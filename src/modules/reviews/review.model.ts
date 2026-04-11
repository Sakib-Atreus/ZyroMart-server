import { Schema, model } from "mongoose";
import { Review } from "./review.interface";

const reviewSchema = new Schema<Review>({
    productId: { 
        type: String, 
        required: true 
    },
    userId: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    comment: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

// Create and export the Review model
export const ReviewModel = model<Review>('Review', reviewSchema);