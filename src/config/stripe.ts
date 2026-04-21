import Stripe from 'stripe';
import config from './index';

if (!config.stripe_secret_key) {
  // Soft warning at boot — routes that need Stripe will still throw 500 if called.
  // eslint-disable-next-line no-console
  console.warn('[stripe] STRIPE_SECRET_KEY is not set — payment routes will fail.');
}

export const stripe = new Stripe(config.stripe_secret_key ?? 'sk_test_placeholder', {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});
