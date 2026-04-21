import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import AppError from '../../Error/AppError';
import { PaymentServices } from './payment.service';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.createCheckoutSession(req.user.id, req.body.orderId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checkout session created',
    data: result,
  });
});

/**
 * Stripe webhook. Requires raw body (not parsed JSON) to verify the signature.
 * Route-level `express.raw({ type: 'application/json' })` is applied in app.ts
 * BEFORE the global express.json middleware.
 */
const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    throw new AppError(400, 'Missing Stripe signature');
  }

  let event;
  try {
    event = PaymentServices.constructEvent(req.body as Buffer, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return res.status(400).json({ success: false, message: `Webhook Error: ${message}` });
  }

  try {
    await PaymentServices.handleStripeEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler failed';
    res.status(500).json({ success: false, message });
  }
};

export const PaymentControllers = {
  createCheckoutSession,
  stripeWebhook,
};
