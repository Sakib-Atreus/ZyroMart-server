import { Types } from 'mongoose';
import AppError from '../../Error/AppError';
import QueryBuilder from '../../utility/QueryBuilder';
import { OrderModel } from '../orders/order.model';
import { ProductModel } from '../products/product.model';
import { ReviewModel } from './review.model';

/**
 * Recompute denormalized rating aggregates on the Product document.
 * Called after any create/update/delete of a Review.
 */
const syncProductAggregates = async (productId: Types.ObjectId | string) => {
  const agg = await ReviewModel.aggregate([
    { $match: { product: new Types.ObjectId(String(productId)) } },
    {
      $group: {
        _id: '$product',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  const { avg = 0, count = 0 } = agg[0] ?? {};
  await ProductModel.findByIdAndUpdate(productId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
};

/**
 * Check whether this user has at least one paid order containing this product.
 * Used to flag verifiedPurchase on the review.
 */
const hasUserPurchased = async (userId: string, productId: string) => {
  const order = await OrderModel.findOne({
    user: userId,
    'items.product': productId,
    paymentStatus: 'paid',
  }).select('_id').lean();
  return !!order;
};

const createReview = async (
  userId: string,
  input: { product: string; rating: number; comment: string },
) => {
  const product = await ProductModel.findById(input.product).select('status isDeleted').lean();
  if (!product || product.isDeleted || product.status !== 'approved') {
    throw new AppError(404, 'Product not available for review');
  }

  const existing = await ReviewModel.findOne({ product: input.product, user: userId });
  if (existing) throw new AppError(409, 'You already reviewed this product');

  const verifiedPurchase = await hasUserPurchased(userId, input.product);

  const review = await ReviewModel.create({
    product: input.product,
    user: userId,
    rating: input.rating,
    comment: input.comment,
    verifiedPurchase,
  });
  await syncProductAggregates(input.product);
  return review;
};

const updateReview = async (
  userId: string,
  reviewId: string,
  input: { rating?: number; comment?: string },
  isAdmin = false,
) => {
  const review = await ReviewModel.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');
  if (!isAdmin && review.user.toString() !== userId) {
    throw new AppError(403, 'You can only edit your own review');
  }
  if (input.rating !== undefined) review.rating = input.rating;
  if (input.comment !== undefined) review.comment = input.comment;
  await review.save();
  await syncProductAggregates(review.product);
  return review;
};

const deleteReview = async (userId: string, reviewId: string, isAdmin = false) => {
  const review = await ReviewModel.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');
  if (!isAdmin && review.user.toString() !== userId) {
    throw new AppError(403, 'You can only delete your own review');
  }
  const productId = review.product;
  await review.deleteOne();
  await syncProductAggregates(productId);
  return { _id: reviewId };
};

const listByProduct = async (productId: string, query: Record<string, unknown>) => {
  const builder = new QueryBuilder(
    ReviewModel.find({ product: productId }).populate('user', 'name'),
    query,
  )
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    builder.modelQuery.lean(),
    builder.countTotal(),
  ]);

  // Summary: avg + per-star histogram (useful for the details page rating bar)
  const agg = await ReviewModel.aggregate([
    { $match: { product: new Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]);
  const histogram: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let total = 0;
  let ratingSum = 0;
  for (const row of agg) {
    histogram[String(row._id)] = row.count;
    total += row.count;
    ratingSum += row._id * row.count;
  }
  const average = total === 0 ? 0 : Math.round((ratingSum / total) * 10) / 10;

  return { data, meta, summary: { average, total, histogram } };
};

const getMyReviewForProduct = async (userId: string, productId: string) => {
  return ReviewModel.findOne({ product: productId, user: userId }).lean();
};

export const ReviewServices = {
  createReview,
  updateReview,
  deleteReview,
  listByProduct,
  getMyReviewForProduct,
  syncProductAggregates,
};
