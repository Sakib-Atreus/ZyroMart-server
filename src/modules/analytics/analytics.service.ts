import { Types } from 'mongoose';
import { CategoryModel } from '../categories/category.model';
import { OrderModel } from '../orders/order.model';
import { ProductModel } from '../products/product.model';
import User from '../users/user.model';
import { VendorModel } from '../vendors/vendor.model';

/**
 * Platform-wide admin dashboard metrics. A single call returns everything
 * the overview page needs, in one round-trip.
 */
const getPlatformOverview = async () => {
  const [
    userCounts,
    vendorCounts,
    productCounts,
    orderCounts,
    categoryTotal,
    revenueAgg,
    topVendors,
    topProducts,
    recentOrders,
  ] = await Promise.all([
    User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    VendorModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ProductModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    CategoryModel.countDocuments({ isActive: true }),
    OrderModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, paidOrders: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.vendor',
          totalRevenue: { $sum: '$items.subtotal' },
          totalItems: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalRevenue: 1,
          totalItems: 1,
          orderCount: 1,
          shopName: '$vendor.shopName',
          slug: '$vendor.slug',
        },
      },
    ]),
    ProductModel.find({ status: 'approved', isDeleted: false })
      .sort({ totalSold: -1 })
      .limit(5)
      .select('name slug thumbnail brand basePrice totalSold averageRating reviewCount')
      .lean(),
    OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber user total status paymentStatus placedAt currency')
      .lean(),
  ]);

  const toMap = (rows: { _id: string; count: number }[]) =>
    rows.reduce<Record<string, number>>(
      (acc, r) => {
        acc[r._id] = r.count;
        return acc;
      },
      {},
    );

  return {
    users: {
      byRole: toMap(userCounts),
      total: userCounts.reduce((n, r) => n + r.count, 0),
    },
    vendors: {
      byStatus: toMap(vendorCounts),
      total: vendorCounts.reduce((n, r) => n + r.count, 0),
    },
    products: {
      byStatus: toMap(productCounts),
      total: productCounts.reduce((n, r) => n + r.count, 0),
    },
    orders: {
      byStatus: toMap(orderCounts),
      total: orderCounts.reduce((n, r) => n + r.count, 0),
    },
    categories: { total: categoryTotal },
    revenue: {
      total: revenueAgg[0]?.revenue ?? 0,
      paidOrders: revenueAgg[0]?.paidOrders ?? 0,
      currency: 'BDT',
    },
    topVendors,
    topProducts,
    recentOrders,
  };
};

/**
 * Vendor-scoped analytics — restricted to the caller's own vendor profile.
 */
const getVendorOverview = async (vendorId: string) => {
  const vendorObjId = new Types.ObjectId(vendorId);
  const [ownProducts, ownOrders, revenueAgg, topProducts] = await Promise.all([
    ProductModel.aggregate([
      { $match: { vendor: vendorObjId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: { 'items.vendor': vendorObjId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorObjId } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$items.subtotal' },
          sold: { $sum: '$items.quantity' },
        },
      },
    ]),
    ProductModel.find({ vendor: vendorObjId, isDeleted: false })
      .sort({ totalSold: -1 })
      .limit(5)
      .select('name slug thumbnail totalSold averageRating reviewCount status')
      .lean(),
  ]);

  const toMap = (rows: { _id: string; count: number }[]) =>
    rows.reduce<Record<string, number>>(
      (acc, r) => {
        acc[r._id] = r.count;
        return acc;
      },
      {},
    );

  return {
    products: { byStatus: toMap(ownProducts) },
    orders: { byStatus: toMap(ownOrders) },
    revenue: {
      total: revenueAgg[0]?.revenue ?? 0,
      unitsSold: revenueAgg[0]?.sold ?? 0,
      currency: 'BDT',
    },
    topProducts,
  };
};

export const AnalyticsServices = { getPlatformOverview, getVendorOverview };
