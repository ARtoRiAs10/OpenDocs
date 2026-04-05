import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError } from '@/utils/error-handler';
import { getP95Latency, getThroughput } from '@/utils/metrics';

const ROUTES = ['ai.stream.ttfb', 'ai.embed', 'ai.complete.summarise', 'versions.list', 'versions.create', 'search'];

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return apiError(401, 'Unauthorized');

  const [latencies, throughputs] = await Promise.all([
    Promise.all(ROUTES.map(async (r) => ({ route: r, p95_ms: await getP95Latency(r) }))),
    Promise.all(ROUTES.map(async (r) => ({ route: r, rps: await getThroughput(r) }))),
  ]);

  return NextResponse.json({
    latency: Object.fromEntries(latencies.map((l) => [l.route, l.p95_ms])),
    throughput: Object.fromEntries(throughputs.map((t) => [t.route, t.rps])),
    targets: { p95_latency_ms: 200, cache_hit_rate_pct: 70, max_users: 10000 },
  });
}
