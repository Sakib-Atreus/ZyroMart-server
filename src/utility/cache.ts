import crypto from 'crypto';
import { isCacheEnabled, redis } from '../config/redis';

/**
 * Hash an arbitrary object into a stable short string.
 * Used as a cache-key suffix for list endpoints with variable query params.
 */
export const hashParams = (obj: Record<string, unknown>): string => {
  const sorted = Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = obj[k];
      return acc;
    }, {});
  return crypto.createHash('md5').update(JSON.stringify(sorted)).digest('hex').slice(0, 16);
};

export const cache = {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!isCacheEnabled() || !redis) return null;
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!isCacheEnabled() || !redis) return;
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // swallow — cache failures must never break requests
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!isCacheEnabled() || !redis || keys.length === 0) return;
    try {
      await redis.del(...keys);
    } catch {
      // swallow
    }
  },

  /**
   * Delete keys matching a glob pattern using SCAN (production-safe, O(N) but non-blocking).
   * Example: await cache.delPattern('products:*')
   */
  async delPattern(pattern: string): Promise<void> {
    if (!isCacheEnabled() || !redis) return;
    try {
      const stream = redis.scanStream({ match: pattern, count: 100 });
      const found: string[] = [];
      await new Promise<void>((resolve) => {
        stream.on('data', (batch: string[]) => {
          if (batch.length) found.push(...batch);
        });
        stream.on('end', () => resolve());
        stream.on('error', () => resolve());
      });
      if (found.length) await redis.del(...found);
    } catch {
      // swallow
    }
  },
};
