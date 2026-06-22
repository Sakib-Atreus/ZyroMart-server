import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  db_url: process.env.DB_URL,
  admin_user: process.env.ADMIN_EMAIL,
  admin_pass: process.env.ADMIN_PASSWORD,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  client_url: process.env.CLIENT_URL || 'http://localhost:5173',
  server_url: process.env.SERVER_URL || 'http://localhost:5000',
  default_currency: process.env.DEFAULT_CURRENCY || 'BDT',
  redis_url: process.env.REDIS_URL, // optional; if unset, caching is disabled
  sslc_store_id: process.env.SSLC_STORE_ID || 'testbox',
  sslc_store_password: process.env.SSLC_STORE_PASSWORD || 'qwerty',
  sslc_is_live: process.env.SSLC_IS_LIVE === 'true',
  smtp_user: process.env.EMAIL_USER,
  smtp_pass: process.env.EMAIL_PASS,
  smtp_from: process.env.SMTP_FROM,
};
