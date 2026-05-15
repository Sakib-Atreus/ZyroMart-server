import Redis from 'ioredis';
import config from './index';

/**
 * Redis singleton.
 * If REDIS_URL is not set or the connection fails, this stays null and the
 * cache helper no-ops gracefully — the app keeps running without caching.
 */
let client: Redis | null = null;
let errorLogged = false;

if (config.redis_url) {
  client = new Redis(config.redis_url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 5) return null; // stop retrying after 5 attempts
      return Math.min(times * 300, 2000);
    },
  });

  client.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('[redis] connected');
    errorLogged = false;
  });

  client.on('error', (err) => {
    if (!errorLogged) {
      // eslint-disable-next-line no-console
      console.warn('[redis] connection error — caching disabled until recovered:', err.message);
      errorLogged = true;
    }
  });

  client.on('end', () => {
    // eslint-disable-next-line no-console
    console.warn('[redis] connection closed');
  });
}

export const redis = client;
export const isCacheEnabled = () => !!client && client.status === 'ready';
