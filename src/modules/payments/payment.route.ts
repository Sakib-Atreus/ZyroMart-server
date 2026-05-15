import cors from 'cors';
import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { PaymentControllers } from './payment.controller';
import { createCheckoutSessionSchema } from './payment.validation';

// SSLC POSTs to these URLs from their own servers (Origin: sandbox.sslcommerz.com).
// They are NOT browser API calls — they are payment gateway callbacks — so we
// bypass the global CORS policy and allow any origin only on these four routes.
const sslcCors = cors({ origin: '*' });

const router = express.Router();

// ─── Stripe ──────────────────────────────────────────────────────────────────
router.post(
  '/checkout-session',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(createCheckoutSessionSchema),
  PaymentControllers.createCheckoutSession,
);
// NOTE: Stripe webhook is mounted at the app level (app.ts) with raw body
// middleware BEFORE global express.json. Do NOT add it here.

// ─── SSL Commerce ─────────────────────────────────────────────────────────────
router.post(
  '/sslc/initiate',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(createCheckoutSessionSchema), // same shape: { orderId }
  PaymentControllers.createSSLCSession,
);

// Callbacks from SSLC — public routes (no auth), wide-open CORS
router.post('/sslc/success', sslcCors, PaymentControllers.sslcSuccess);
router.post('/sslc/fail', sslcCors, PaymentControllers.sslcFail);
router.post('/sslc/cancel', sslcCors, PaymentControllers.sslcCancel);
router.post('/sslc/ipn', sslcCors, PaymentControllers.sslcIPN);

export const PaymentRoute = router;
