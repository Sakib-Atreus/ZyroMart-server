import { Schema, model } from 'mongoose';
import { IWishlist } from './wishlist.interface';

const WishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      unique: true,
      index: true,
    },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true, versionKey: false },
);

export const WishlistModel = model<IWishlist>('Wishlist', WishlistSchema);
