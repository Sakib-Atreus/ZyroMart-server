import { Schema, model } from 'mongoose';
import { IQuestion, IQuestionAnswer } from './question.interface';

const AnswerSchema = new Schema<IQuestionAnswer>(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    by: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const QuestionSchema = new Schema<IQuestion>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    question: { type: String, required: true, trim: true, maxlength: 2000 },
    answer: { type: AnswerSchema },
  },
  { timestamps: true, versionKey: false },
);

QuestionSchema.index({ product: 1, createdAt: -1 });

export const QuestionModel = model<IQuestion>('Question', QuestionSchema);
