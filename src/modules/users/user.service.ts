import { Types } from 'mongoose';
import AppError from '../../Error/AppError';
import QueryBuilder from '../../utility/QueryBuilder';
import { OrderModel } from '../orders/order.model';
import { WishlistModel } from '../wishlists/wishlist.model';
import { CartModel } from '../carts/cart.model';
import User from './user.model';

type UpdatableUserFields = {
  name?: string;
  phone?: string;
  address?: string;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new AppError(404, 'User not found');
  return user;
};

const updateMe = async (userId: string, payload: UpdatableUserFields) => {
  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  if (!user || user.isDeleted) throw new AppError(404, 'User not found');
  return user;
};

// Admin: paginated/searchable user list for admin tools (selectors, user mgmt)
const adminList = async (query: Record<string, unknown>) => {
  const builder = new QueryBuilder(
    User.find({ isDeleted: { $ne: true } }),
    query,
  )
    .search(['name', 'email', 'phone'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    builder.modelQuery.select('-password').lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

const getDashboard = async (userId: string) => {
  const [orderStats, recentOrders, wishlistCount, cartCount, totalSpend] = await Promise.all([
    OrderModel.aggregate([
      { $match: { user: new Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    OrderModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber total status paymentStatus placedAt currency')
      .lean(),
    WishlistModel.findOne({ user: userId }).then(w => w?.products?.length ?? 0),
    CartModel.findOne({ user: userId }).then(c => c?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0),
    OrderModel.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          paymentStatus: 'paid',
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const statusMap = orderStats.reduce<Record<string, number>>((acc, r) => {
    acc[r._id] = r.count;
    return acc;
  }, {});

  return {
    orders: {
      byStatus: statusMap,
      total: orderStats.reduce((n, r) => n + r.count, 0),
      recent: recentOrders,
    },
    wishlistCount,
    cartItemCount: cartCount,
    totalSpend: totalSpend[0]?.total ?? 0,
  };
};

export const UserServices = {
  getMe,
  updateMe,
  adminList,
  getDashboard,
};
