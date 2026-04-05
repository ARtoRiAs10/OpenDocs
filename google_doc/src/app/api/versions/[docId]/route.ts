import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError } from '@/utils/error-handler';
import { logger } from '@/utils/logger';
import { withCache } from '@/utils/redis';
import { parseLimit } from '@/utils/pagination';
import { recordLatency, incrementThroughput } from '@/utils/metrics';

export async function GET(req: NextRequest, { params }: { params: { docId: string } }) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) return apiError(401, 'Unauthorized');
  const { docId } = params;
  const limit = parseLimit(req.nextUrl.searchParams);

  try {
    const cacheKey = `versions:${docId}:${limit}`;
    // TODO: replace with real Convex query via convex HTTP client
    const versions = await withCache(cacheKey, 30, async () => []);
    logger.info({ userId, docId, latency: Date.now() - start }, 'versions listed');
    await recordLatency('versions.list', Date.now() - start);
    await incrementThroughput('versions.list');
    return NextResponse.json({ items: versions, hasMore: false, nextCursor: null });
  } catch (err) {
    logger.error({ err, userId, docId }, 'failed to list versions');
    return apiError(500, 'Failed to fetch version history');
  }
}

export async function POST(req: NextRequest, { params }: { params: { docId: string } }) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) return apiError(401, 'Unauthorized');
  const { docId } = params;

  let body: { label?: string };
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  try {
    // TODO: replace with createSnapshot(convex, docId, ydoc, userId, body.label)
    const id = `version_${Date.now()}`;
    logger.info({ userId, docId, label: body.label, latency: Date.now() - start }, 'version created');
    await recordLatency('versions.create', Date.now() - start);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    logger.error({ err, userId, docId }, 'failed to create version');
    return apiError(500, 'Failed to create version');
  }
}
