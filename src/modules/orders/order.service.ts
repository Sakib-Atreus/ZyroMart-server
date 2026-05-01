import mongoose from 'mongoose';
import AppError from '../../Error/AppError';
import config from '../../config';
import QueryBuilder from '../../utility/QueryBuilder';
import { generateOrderNumber } from '../../utility/generateOrderNumber';
import { CartModel } from '../carts/cart.model';
import { ProductModel } from '../products/product.model';
import { VariantModel } from '../variants/variant.model';
import { VendorModel } from '../vendors/vendor.model';
import {
  IAddress,
  IOrder,
  IOrderItem,
  TOrderStatus,
  TPaymentMethod,
} from './order.interface';
import { OrderModel } from './order.model';

/**
 * Naive shipping: flat per-item, per-vendor split.
 * Replace with a pluggable shipping strategy when real carriers are wired up.
 */
const calculateShipping = (_address: IAddress, items: IOrderItem[]): number => {
  const vendors = new Set(items.map(i => i.vendor.toString()));
  return vendors.size * 60;
};

const calculateTax = (subtotal: number): number => Math.round(subtotal * 0.05);

const createOrderFromCart = async (
  userId: string,
  input: {
    shippingAddress: IAddress;
    billingAddress?: IAddress;
    paymentMethod: TPaymentMethod;
  },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const cart = await CartModel.findOne({ user: userId }).session(session);
    if (!cart || cart.items.length === 0) {
      throw new AppError(400, 'Cart is empty');
    }

    // Load all variants and products in parallel
    const [variants, products] = await Promise.all([
      VariantModel.find({ _id: { $in: cart.items.map(i => i.variant) } }).session(session),
      ProductModel.find({ _id: { $in: cart.items.map(i => i.product) } }).session(session),
    ]);
    const variantMap = new Map(variants.map(v => [v._id.toString(), v]));
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const variant = variantMap.get(item.variant.toString());
      const product = productMap.get(item.product.toString());

      if (!variant || !variant.isActive) {
        throw new AppError(400, 'One of your cart items is no longer available');
      }
      if (!product || product.isDeleted || product.status !== 'approved') {
        throw new AppError(400, `Product '${product?.name ?? ''}' is unavailable`);
      }

      // Atomic reservation: only succeeds if (stock - reservedStock) >= quantity
      const reserved = await VariantModel.updateOne(
        {
          _id: variant._id,
          $expr: {
            $gte: [{ $subtract: ['$stock', '$reservedStock'] }, item.quantity],
          },
        },
        { $inc: { reservedStock: item.quantity } },
        { session },
      );
      if (reserved.modifiedCount === 0) {
        throw new AppError(
          409,
          `Insufficient stock for '${product.name}'. Please adjust your cart.`,
        );
      }

      const unitPrice = variant.price;
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;

      orderItems.push({
        product: product._id,
        variant: variant._id,
        vendor: product.vendor,
        productSnapshot: {
          name: product.name,
          brand: product.brand,
          thumbnail: product.thumbnail,
          slug: product.slug,
        },
        variantSnapshot: {
          sku: variant.sku,
          options: Object.fromEntries(variant.options),
        },
        unitPrice,
        quantity: item.quantity,
        subtotal: lineSubtotal,
      });
    }

    const shippingFee = calculateShipping(input.shippingAddress, orderItems);
    const tax = calculateTax(subtotal);
    // Discount must come from a validated coupon — never trust the client value.
    // When coupon support is added, resolve it server-side here.
    const discount = 0;
    const total = Math.max(0, subtotal + shippingFee + tax - discount);

    const [order] = await OrderModel.create(
      [
        {
          orderNumber: generateOrderNumber(),
          user: userId,
          items: orderItems,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress ?? input.shippingAddress,
          subtotal,
          shippingFee,
          tax,
          discount,
          total,
          currency: config.default_currency,
          status: 'pending',
          paymentStatus: 'unpaid',
          paymentMethod: input.paymentMethod,
          statusHistory: [{ status: 'pending', at: new Date() }],
          placedAt: new Date(),
        },
      ],
      { session },
    );

    await CartModel.updateOne({ user: userId }, { $set: { items: [] } }, { session });

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Release reserved stock (not actual stock). Called on cancel or payment failure.
 */
const releaseReservedStock = async (
  orderId: string,
  session?: mongoose.ClientSession,
) => {
  const query = OrderModel.findById(orderId);
  if (session) query.session(session);
  const order = await query;
  if (!order) return;
  for (const item of order.items) {
    await VariantModel.updateOne(
      { _id: item.variant },
      { $inc: { reservedStock: -item.quantity } },
      session ? { session } : {},
    );
  }
};

const getMyOrders = async (userId: string, query: Record<string, unknown>) => {
  const builder = new QueryBuilder(OrderModel.find({ user: userId }), query)
    .filter()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    builder.modelQuery.lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

const getOrderById = async (orderId: string, viewer: { id: string; role: string }) => {
  const order = await OrderModel.findById(orderId).lean();
  if (!order) throw new AppError(404, 'Order not found');

  if (viewer.role === 'admin') return order;

  if (order.user.toString() === viewer.id) return order;

  if (viewer.role === 'vendor') {
    const vendor = await VendorModel.findOne({ user: viewer.id });
    if (!vendor) throw new AppError(403, 'Forbidden');
    const owns = order.items.some(i => i.vendor.toString() === vendor._id.toString());
    if (!owns) throw new AppError(403, 'Forbidden');
    // strip to vendor's items only
    return {
      ...order,
      items: order.items.filter(i => i.vendor.toString() === vendor._id.toString()),
    };
  }

  throw new AppError(403, 'Forbidden');
};

const cancelOrder = async (
  orderId: string,
  actor: { id: string; role: string },
  reason?: string,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const query =
      actor.role === 'admin'
        ? { _id: orderId }
        : { _id: orderId, user: actor.id };
    const order = await OrderModel.findOne(query).session(session);
    if (!order) throw new AppError(404, 'Order not found');
    if (!['pending', 'paid', 'processing'].includes(order.status)) {
      throw new AppError(400, `Cannot cancel order in status '${order.status}'`);
    }

    if (order.paymentStatus === 'unpaid') {
      // release reservation
      for (const item of order.items) {
        await VariantModel.updateOne(
          { _id: item.variant },
          { $inc: { reservedStock: -item.quantity } },
          { session },
        );
      }
    } else {
      // was paid — restore actual stock
      for (const item of order.items) {
        await VariantModel.updateOne(
          { _id: item.variant },
          { $inc: { stock: item.quantity } },
          { session },
        );
      }
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.statusHistory.push({ status: 'cancelled', at: new Date(), note: reason });
    await order.save({ session });

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const updateStatusByVendorOrAdmin = async (
  orderId: string,
  newStatus: Exclude<TOrderStatus, 'pending' | 'paid' | 'refunded'>,
  actor: { id: string; role: string },
  note?: string,
) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  if (actor.role === 'vendor') {
    const vendor = await VendorModel.findOne({ user: actor.id });
    if (!vendor) throw new AppError(403, 'Forbidden');
    const owns = order.items.some(i => i.vendor.toString() === vendor._id.toString());
    if (!owns) throw new AppError(403, 'Forbidden');
  }

  // Valid transitions
  const allowed: Record<string, string[]> = {
    paid: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
  };
  if (!allowed[order.status]?.includes(newStatus)) {
    throw new AppError(400, `Cannot transition ${order.status} -> ${newStatus}`);
  }

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, at: new Date(), note });
  if (newStatus === 'shipped') order.shippedAt = new Date();
  if (newStatus === 'delivered') order.deliveredAt = new Date();
  if (newStatus === 'cancelled') order.cancelledAt = new Date();
  await order.save();
  return order;
};

const getVendorOrders = async (userId: string, query: Record<string, unknown>) => {
  const vendor = await VendorModel.findOne({ user: userId });
  if (!vendor) throw new AppError(403, 'Vendor profile required');

  const builder = new QueryBuilder(
    OrderModel.find({ 'items.vendor': vendor._id }),
    query,
  )
    .filter()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    builder.modelQuery.lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

const getAllOrders = async (query: Record<string, unknown>) => {
  const builder = new QueryBuilder(OrderModel.find(), query)
    .filter()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    builder.modelQuery.lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

export const OrderServices = {
  createOrderFromCart,
  releaseReservedStock,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateStatusByVendorOrAdmin,
  getVendorOrders,
  getAllOrders,
};

export type { IOrder };
