import AppError from '../../Error/AppError';
import { ProductModel } from '../products/product.model';
import { WishlistModel } from './wishlist.model';

/**
 * Wishlists use `$addToSet` so duplicate-adds are silently idempotent.
 * The document is created lazily on first add.
 */
const getMyWishlist = async (userId: string) => {
  const wishlist = await WishlistModel.findOne({ user: userId })
    .populate({
      path: 'products',
      select: 'name slug brand thumbnail basePrice compareAtPrice currency status isDeleted averageRating reviewCount',
    })
    .lean();
  if (!wishlist) return { products: [], count: 0 };

  // Filter out archived/deleted products so the page doesn't render ghosts
  const validProducts = (wishlist.products || []).filter((p: any) => {
    return p && !p.isDeleted && p.status === 'approved';
  });

  return { products: validProducts, count: validProducts.length };
};

const addItem = async (userId: string, productId: string) => {
  const product = await ProductModel.findById(productId).lean();
  if (!product || product.isDeleted || product.status !== 'approved') {
    throw new AppError(404, 'Product not available');
  }
  await WishlistModel.updateOne(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true },
  );
  return getMyWishlist(userId);
};

const removeItem = async (userId: string, productId: string) => {
  await WishlistModel.updateOne(
    { user: userId },
    { $pull: { products: productId } },
  );
  return getMyWishlist(userId);
};

const clearWishlist = async (userId: string) => {
  await WishlistModel.updateOne(
    { user: userId },
    { $set: { products: [] } },
    { upsert: true },
  );
  return { products: [], count: 0 };
};

export const WishlistServices = {
  getMyWishlist,
  addItem,
  removeItem,
  clearWishlist,
};
