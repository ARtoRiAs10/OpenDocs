import { redis } from './redis';

const SAMPLE_WINDOW = 1000;
const BUCKET_TTL = 120;

export async function recordLatency(route: string, ms: number) {
  const key = `metrics:latency:${route}`;
  await redis.lPush(key, ms.toString()).catch(() => {});
  await redis.lTrim(key, 0, SAMPLE_WINDOW - 1).catch(() => {});
  await redis.expire(key, 86400).catch(() => {});
}

export async function incrementThroughput(route: string) {
  const bucket = Math.floor(Date.now() / 1000);
  const key = `metrics:rps:${route}:${bucket}`;
  await redis.incr(key).catch(() => {});
  await redis.expire(key, BUCKET_TTL).catch(() => {});
}

export async function getP95Latency(route: string): Promise<number | null> {
  const samples = await redis.lRange(`metrics:latency:${route}`, 0, -1).catch(() => [] as string[]);
  if (!samples.length) return null;
  const sorted = samples.map(Number).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)];
}

export async function getThroughput(route: string): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  let total = 0;
  const buckets = await Promise.all(
    Array.from({ length: 60 }, (_, i) => redis.get(`metrics:rps:${route}:${now - i}`).catch(() => null)),
  );
  buckets.forEach((v) => { if (v) total += parseInt(v, 10); });
  return Math.round(total / 60);
}

export async function withMetrics<T>(route: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    await recordLatency(route, Date.now() - start);
    await incrementThroughput(route);
    return result;
  } catch (err) {
    await recordLatency(route, Date.now() - start);
    throw err;
  }
}
