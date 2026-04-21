import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { PaymentControllers } from './payment.controller';
import { createCheckoutSessionSchema } from './payment.validation';

const router = express.Router();

router.post(
  '/checkout-session',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(createCheckoutSessionSchema),
  PaymentControllers.createCheckoutSession,
);

// NOTE: webhook endpoint is mounted at the app level (app.ts) with raw body
// middleware, BEFORE global express.json. Do NOT add the webhook route here.

export const PaymentRoute = router;
