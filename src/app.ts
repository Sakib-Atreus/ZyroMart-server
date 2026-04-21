import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import { routes } from './routes';
import globalErrorHandler from './middleware/globalErrorHandler';
import notFound from './middleware/notFoundRoute';
import { PaymentControllers } from './modules/payments/payment.controller';

const app: Application = express();

app.use(cors());

// Stripe webhook MUST receive the raw body (for signature verification).
// Mount it BEFORE express.json() so the body stays unparsed.
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentControllers.stripeWebhook,
);

// Global JSON parser for all other routes
app.use(express.json());

app.use('/api/v1', routes);

app.get('/', (_req: Request, res: Response) => {
  res.send('Welcome to ZyroMart E-commerce API');
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
