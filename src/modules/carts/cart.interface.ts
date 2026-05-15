import { Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
}
