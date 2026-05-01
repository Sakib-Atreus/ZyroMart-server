import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import globalErrorHandler from './middleware/globalErrorHandler';
import notFound from './middleware/notFoundRoute';
import { PaymentControllers } from './modules/payments/payment.controller';
import config from './config';

const app: Application = express();

app.use(helmet());

const allowedOrigins = config.client_url
  ? [config.client_url]
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

// 100 req / 15 min per IP for auth endpoints only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stripe webhook MUST receive the raw body (for signature verification).
// Mount it BEFORE express.json() so the body stays unparsed.
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentControllers.stripeWebhook,
);

// Global JSON parser for all other routes
app.use(express.json());

app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', routes);

app.get('/', (_req: Request, res: Response) => {
  res.send('Welcome to ZyroMart E-commerce API');
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
