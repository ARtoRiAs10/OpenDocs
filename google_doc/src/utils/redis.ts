import { createClient } from 'redis';

export const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
export const redisSub = redis.duplicate();

redis.on('error', (err) => console.error('[Redis] client error', err));

let connected = false;
export async function connectRedis() {
  if (connected) return;
  await redis.connect();
  await redisSub.connect();
  connected = true;
}

if (process.env.NODE_ENV !== 'test') {
  connectRedis().catch(console.error);
}

/** Cache-aside: check Redis first, fetch on miss, write back with TTL. */
export async function withCache<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key).catch(() => null);
  if (cached) return JSON.parse(cached) as T;
  const value = await fetchFn();
  await redis.setEx(key, ttlSeconds, JSON.stringify(value)).catch(() => {});
  return value;
}

export async function invalidateCache(key: string) {
  await redis.del(key).catch(() => {});
}

/** Redis Pub/Sub for cross-instance WebSocket events */
export async function publishEvent(channel: string, payload: object) {
  await redis.publish(channel, JSON.stringify(payload)).catch(() => {});
}

export async function subscribeToChannel(channel: string, handler: (payload: object) => void) {
  await redisSub.subscribe(channel, (msg) => {
    try { handler(JSON.parse(msg)); } catch { /* malformed */ }
  });
}
