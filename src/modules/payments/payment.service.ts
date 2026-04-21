import mongoose from 'mongoose';
import Stripe from 'stripe';
import AppError from '../../Error/AppError';
import config from '../../config';
import { stripe } from '../../config/stripe';
import { OrderModel } from '../orders/order.model';
import { ProductModel } from '../products/product.model';
import { VariantModel } from '../variants/variant.model';

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

export const PaymentServices = {
  createCheckoutSession,
  handleStripeEvent,
  constructEvent,
};
