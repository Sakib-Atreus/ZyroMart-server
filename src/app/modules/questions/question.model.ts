import { Schema, model } from "mongoose";
import { Question } from "./question.interface";

const questionSchema = new Schema<Question>({
  productId: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  question: { 
    type: String, 
    required: true 
  },
  answer: { 
    type: String, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

export const QuestionModel = model<Question>('Question', questionSchema);
