import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import AppError from '../../Error/AppError';
import config from '../../config';
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

// ─── SSL Commerce controllers ────────────────────────────────────────────────

const createSSLCSession = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.createSSLCSession(req.user.id, req.body.orderId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SSL Commerce session initiated',
    data: result,
  });
});

/**
 * SSLC callbacks receive application/x-www-form-urlencoded POSTs from SSLC servers.
 * After processing we redirect the USER'S BROWSER to the React client.
 */
const sslcSuccess = async (req: Request, res: Response) => {
  try {
    const order = await PaymentServices.handleSSLCSuccess(req.body);
    const orderId = order._id.toString();
    res.redirect(`${config.client_url}/checkout/success?orderId=${orderId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Payment verification failed';
    res.redirect(`${config.client_url}/checkout/cancel?error=${encodeURIComponent(msg)}`);
  }
};

const sslcFail = async (req: Request, res: Response) => {
  try {
    await PaymentServices.handleSSLCFail(req.body);
  } catch {
    // best effort — still redirect
  }
  const tranId: string = req.body?.tran_id ?? '';
  const orderId = tranId.split('-')[0]; // extract orderId from "orderId-timestamp"
  res.redirect(`${config.client_url}/checkout/cancel?orderId=${orderId}`);
};

const sslcCancel = async (req: Request, res: Response) => {
  try {
    await PaymentServices.handleSSLCCancel(req.body);
  } catch {
    // best effort — still redirect
  }
  const tranId: string = req.body?.tran_id ?? '';
  const orderId = tranId.split('-')[0];
  res.redirect(`${config.client_url}/checkout/cancel?orderId=${orderId}`);
};

/** IPN: server-to-server notification — return 200, no redirect */
const sslcIPN = async (req: Request, res: Response) => {
  try {
    const status: string = req.body?.status ?? '';
    if (status === 'VALID' || status === 'VALIDATED') {
      await PaymentServices.handleSSLCSuccess(req.body);
    } else if (status === 'FAILED') {
      await PaymentServices.handleSSLCFail(req.body);
    }
    res.status(200).json({ received: true });
  } catch {
    res.status(200).json({ received: true }); // always 200 to SSLC
  }
};

export const PaymentControllers = {
  createCheckoutSession,
  stripeWebhook,
  createSSLCSession,
  sslcSuccess,
  sslcFail,
  sslcCancel,
  sslcIPN,
};
