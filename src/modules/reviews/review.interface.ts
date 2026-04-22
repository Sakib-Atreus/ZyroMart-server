import { Types } from 'mongoose';

export interface IReview {
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number; // 1..5
  comment: string;
  verifiedPurchase: boolean;
}
