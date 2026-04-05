import { Redis } from '@upstash/redis';

/**
 * 1. Initialize the Upstash client.
 * In Vercel, ensure you have set:
 * UPSTASH_REDIS_REST_URL
 * UPSTASH_REDIS_REST_TOKEN
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * 2. connectRedis() is now a "noop" (no-operation).
 * Upstash uses HTTP, so there is no persistent connection to "start".
 * We keep this function so your main app files don't throw errors.
 */
export async function connectRedis() {
  // Simply return resolved promise to keep existing logic happy
  return Promise.resolve();
}

/** * 3. Cache-aside logic.
 * Optimized for Upstash which handles JSON automatically.
 */
export async function withCache<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached) {
      // Upstash SDK often returns the parsed object automatically
      return (typeof cached === 'string' ? JSON.parse(cached) : cached) as T;
    }
  } catch (err) {
    console.error('[Redis] Cache read error:', err);
  }

  const value = await fetchFn();

  try {
    // Upstash uses a configuration object for TTL (ex: seconds)
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    console.error('[Redis] Cache write error:', err);
  }
  
  return value;
}

/** 4. Standard Invalidation */
export async function invalidateCache(key: string) {
  await redis.del(key).catch(() => {});
}

/** * 5. Publish Event.
 * This works perfectly on Upstash/Vercel to send a message OUT.
 */
export async function publishEvent(channel: string, payload: object) {
  try {
    await redis.publish(channel, JSON.stringify(payload));
  } catch (err) {
    console.error('[Redis] Publish error:', err);
  }
}

/** * 6. THE "LAST PART": Subscribe to Channel.
 * CRITICAL: Upstash (HTTP) does not support long-lived subscriptions.
 * To prevent your build/app from crashing, we use a warning log.
 */
export async function subscribeToChannel(channel: string, handler: (payload: object) => void) {
  // If this is called in a Vercel Serverless Function, it will fail silently.
  // Real-time listeners must be moved to the Frontend using a service like Pusher.
  console.warn(`[Redis] Subscribed to ${channel} ignored: HTTP Redis does not support persistent subscribers.`);
}