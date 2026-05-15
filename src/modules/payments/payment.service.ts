import mongoose from 'mongoose';
import Stripe from 'stripe';
import SSLCommerzPayment, { SSLCCallbackPayload } from 'sslcommerz-lts';
import AppError from '../../Error/AppError';
import config from '../../config';
import { stripe } from '../../config/stripe';
import { OrderModel } from '../orders/order.model';
import { ProductModel } from '../products/product.model';
import { VariantModel } from '../variants/variant.model';
import UserModel from '../users/user.model';

const CURRENCIES_NOT_SUPPORTED_BY_STRIPE_BY_DEFAULT = new Set(['BDT']);

const toStripeAmount = (amount: number, currency: string): number => {
  // Stripe uses minor units. BDT/USD are 2-decimal; JPY is 0-decimal etc.
  const zeroDecimal = new Set(['JPY', 'KRW', 'VND']);
  return zeroDecimal.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
};

const createCheckoutSession = async (userId: string, orderId: string) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.user.toString() !== userId) throw new AppError(403, 'Forbidden');
  if (order.paymentStatus === 'paid') throw new AppError(400, 'Order already paid');
  if (order.status === 'cancelled') throw new AppError(400, 'Order is cancelled');
  if (order.paymentMethod !== 'stripe') {
    throw new AppError(400, 'Order was not placed with Stripe');
  }

  // Fallback: Stripe doesn't support BDT natively. Charge in USD with a fixed rate
  // or let env override. Safer than silently failing.
  const stripeCurrency = CURRENCIES_NOT_SUPPORTED_BY_STRIPE_BY_DEFAULT.has(order.currency)
    ? 'usd'
    : order.currency.toLowerCase();
  const bdtToUsdRate = 0.0085;
  const convert = (amt: number) =>
    stripeCurrency === 'usd' && order.currency === 'BDT' ? amt * bdtToUsdRate : amt;

  const line_items = order.items.map(item => ({
    quantity: item.quantity,
    price_data: {
      currency: stripeCurrency,
      unit_amount: toStripeAmount(convert(item.unitPrice), stripeCurrency),
      product_data: {
        name: item.productSnapshot.name,
        description: `${item.variantSnapshot.sku} — ${Object.values(item.variantSnapshot.options).join(' / ')}`,
        images: [item.productSnapshot.thumbnail],
        metadata: {
          productId: item.product.toString(),
          variantId: item.variant.toString(),
          sku: item.variantSnapshot.sku,
        },
      },
    },
  }));

  // Add shipping + tax as separate line items
  if (order.shippingFee > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: stripeCurrency,
        unit_amount: toStripeAmount(convert(order.shippingFee), stripeCurrency),
        product_data: {
          name: 'Shipping',
          description: 'Shipping fee',
          images: [],
          metadata: { productId: 'shipping', variantId: 'shipping', sku: 'SHIPPING' },
        },
      },
    });
  }
  if (order.tax > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: stripeCurrency,
        unit_amount: toStripeAmount(convert(order.tax), stripeCurrency),
        product_data: {
          name: 'Tax',
          description: 'Tax',
          images: [],
          metadata: { productId: 'tax', variantId: 'tax', sku: 'TAX' },
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items,
    success_url: `${config.client_url}/checkout/success?orderId=${order._id}`,
    cancel_url: `${config.client_url}/checkout/cancel?orderId=${order._id}`,
    metadata: {
      orderId: order._id.toString(),
      userId: order.user.toString(),
      orderNumber: order.orderNumber,
    },
    client_reference_id: order._id.toString(),
  });

  order.stripe = { ...(order.stripe ?? {}), sessionId: session.id };
  await order.save();

  return { url: session.url, sessionId: session.id };
};

/**
 * Webhook handler — idempotent.
 * On success: commits stock reservation into actual stock decrement and marks order paid.
 * On failure: releases reservation and marks paymentStatus='failed'.
 */
const handleStripeEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await onCheckoutCompleted(session);
      break;
    }
    case 'checkout.session.expired':
    case 'payment_intent.payment_failed': {
      const orderId =
        (event.data.object as Stripe.Checkout.Session).metadata?.orderId ??
        ((event.data.object as Stripe.PaymentIntent).metadata?.orderId as string | undefined);
      if (orderId) await onPaymentFailed(orderId);
      break;
    }
    default:
      break;
  }
};

const onCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    const order = await OrderModel.findById(orderId).session(mongoSession);
    if (!order) {
      await mongoSession.abortTransaction();
      return;
    }
    if (order.paymentStatus === 'paid') {
      await mongoSession.abortTransaction();
      return;
    }

    for (const item of order.items) {
      await VariantModel.updateOne(
        { _id: item.variant },
        { $inc: { stock: -item.quantity, reservedStock: -item.quantity } },
        { session: mongoSession },
      );
      await ProductModel.updateOne(
        { _id: item.product },
        { $inc: { totalSold: item.quantity } },
        { session: mongoSession },
      );
    }

    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.stripe = {
      ...(order.stripe ?? {}),
      sessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
    };
    order.statusHistory.push({ status: 'paid', at: new Date() });
    await order.save({ session: mongoSession });

    await mongoSession.commitTransaction();
  } catch (err) {
    await mongoSession.abortTransaction();
    throw err;
  } finally {
    mongoSession.endSession();
  }
};

const onPaymentFailed = async (orderId: string) => {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    const order = await OrderModel.findById(orderId).session(mongoSession);
    if (!order || order.paymentStatus !== 'unpaid') {
      await mongoSession.abortTransaction();
      return;
    }
    for (const item of order.items) {
      await VariantModel.updateOne(
        { _id: item.variant },
        { $inc: { reservedStock: -item.quantity } },
        { session: mongoSession },
      );
    }
    order.paymentStatus = 'failed';
    order.statusHistory.push({ status: 'cancelled', at: new Date(), note: 'Payment failed' });
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save({ session: mongoSession });
    await mongoSession.commitTransaction();
  } catch (err) {
    await mongoSession.abortTransaction();
    throw err;
  } finally {
    mongoSession.endSession();
  }
};

const constructEvent = (rawBody: Buffer, signature: string): Stripe.Event => {
  if (!config.stripe_webhook_secret) {
    throw new AppError(500, 'STRIPE_WEBHOOK_SECRET not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe_webhook_secret);
};

// ─── SSL Commerce ────────────────────────────────────────────────────────────

const getSslcInstance = () =>
  new SSLCommerzPayment(
    config.sslc_store_id,
    config.sslc_store_password,
    config.sslc_is_live,
  );

const createSSLCSession = async (userId: string, orderId: string) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.user.toString() !== userId) throw new AppError(403, 'Forbidden');
  if (order.paymentStatus === 'paid') throw new AppError(400, 'Order already paid');
  if (order.status === 'cancelled') throw new AppError(400, 'Order is cancelled');
  if (order.paymentMethod !== 'sslcommerz') {
    throw new AppError(400, 'Order was not placed with SSL Commerce');
  }

  const user = await UserModel.findById(userId).select('name email phone');
  if (!user) throw new AppError(404, 'User not found');

  // Unique tran_id: orderId + timestamp to allow retries on the same order
  const tranId = `${orderId}-${Date.now()}`;

  const addr = order.shippingAddress;
  const base = config.server_url;

  const sslcz = getSslcInstance();
  const apiResponse = await sslcz.init({
    total_amount: order.total,
    currency: order.currency || 'BDT',
    tran_id: tranId,
    success_url: `${base}/api/v1/payments/sslc/success`,
    fail_url: `${base}/api/v1/payments/sslc/fail`,
    cancel_url: `${base}/api/v1/payments/sslc/cancel`,
    ipn_url: `${base}/api/v1/payments/sslc/ipn`,
    shipping_method: 'Courier',
    product_name: `ZyroMart Order #${order.orderNumber}`,
    product_category: 'General',
    product_profile: 'general',
    cus_name: addr.fullName,
    cus_email: user.email,
    cus_add1: addr.line1,
    cus_city: addr.city,
    cus_country: addr.country || 'Bangladesh',
    cus_phone: addr.phone,
    ship_name: addr.fullName,
    ship_add1: addr.line1,
    ship_city: addr.city,
    ship_postcode: addr.postalCode || '1000',
    ship_country: addr.country || 'Bangladesh',
  });

  if (!apiResponse?.GatewayPageURL) {
    throw new AppError(
      502,
      `SSL Commerce error: ${apiResponse?.failedreason ?? 'Could not get gateway URL'}`,
    );
  }

  // Store the tranId so we can look up the order in callbacks
  order.sslcommerz = { tranId };
  await order.save();

  return { url: apiResponse.GatewayPageURL, tranId };
};

const handleSSLCSuccess = async (payload: SSLCCallbackPayload) => {
  const { tran_id, val_id, status } = payload;
  if (!tran_id || !val_id) throw new AppError(400, 'Missing tran_id or val_id');

  // Find order by stored tranId
  const order = await OrderModel.findOne({ 'sslcommerz.tranId': tran_id });
  if (!order) throw new AppError(404, 'Order not found for this transaction');

  if (order.paymentStatus === 'paid') return order; // idempotent

  // Validate with SSL Commerce API
  const sslcz = getSslcInstance();
  const validation = await sslcz.validate({ val_id });

  if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
    throw new AppError(400, `SSL Commerce validation failed: ${validation.status}`);
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    const locked = await OrderModel.findById(order._id).session(mongoSession);
    if (!locked || locked.paymentStatus === 'paid') {
      await mongoSession.abortTransaction();
      return order;
    }

    for (const item of locked.items) {
      await VariantModel.updateOne(
        { _id: item.variant },
        { $inc: { stock: -item.quantity, reservedStock: -item.quantity } },
        { session: mongoSession },
      );
      await ProductModel.updateOne(
        { _id: item.product },
        { $inc: { totalSold: item.quantity } },
        { session: mongoSession },
      );
    }

    locked.status = 'paid';
    locked.paymentStatus = 'paid';
    locked.paidAt = new Date();
    locked.sslcommerz = {
      tranId: tran_id,
      valId: val_id,
      bankTranId: String(payload.bank_tran_id ?? ''),
    };
    locked.statusHistory.push({ status: 'paid', at: new Date() });
    await locked.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    return locked;
  } catch (err) {
    await mongoSession.abortTransaction();
    throw err;
  } finally {
    mongoSession.endSession();
  }
};

const handleSSLCFail = async (payload: SSLCCallbackPayload) => {
  const { tran_id } = payload;
  if (!tran_id) return;

  const order = await OrderModel.findOne({ 'sslcommerz.tranId': tran_id });
  if (!order || order.paymentStatus !== 'unpaid') return;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    const locked = await OrderModel.findById(order._id).session(mongoSession);
    if (!locked || locked.paymentStatus !== 'unpaid') {
      await mongoSession.abortTransaction();
      return;
    }
    for (const item of locked.items) {
      await VariantModel.updateOne(
        { _id: item.variant },
        { $inc: { reservedStock: -item.quantity } },
        { session: mongoSession },
      );
    }
    locked.paymentStatus = 'failed';
    locked.status = 'cancelled';
    locked.cancelledAt = new Date();
    locked.statusHistory.push({ status: 'cancelled', at: new Date(), note: 'SSL Commerce payment failed' });
    await locked.save({ session: mongoSession });
    await mongoSession.commitTransaction();
  } catch (err) {
    await mongoSession.abortTransaction();
    throw err;
  } finally {
    mongoSession.endSession();
  }
};

const handleSSLCCancel = async (payload: SSLCCallbackPayload) => {
  // Cancel just marks order as failed without releasing stock yet —
  // user may retry. For simplicity, same treatment as fail.
  await handleSSLCFail(payload);
};

export const PaymentServices = {
  createCheckoutSession,
  handleStripeEvent,
  constructEvent,
  createSSLCSession,
  handleSSLCSuccess,
  handleSSLCFail,
  handleSSLCCancel,
};
