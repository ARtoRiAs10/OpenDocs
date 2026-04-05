import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError } from '@/utils/error-handler';
import { logger } from '@/utils/logger';
import { recordLatency } from '@/utils/metrics';
import { embedOne } from '@/services/embedding.service';

export async function GET(req: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) return apiError(401, 'Unauthorized');

  const q = req.nextUrl.searchParams.get('q');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '10'), 50);
  if (!q?.trim()) return apiError(400, 'q (search query) is required');

  try {
    const _queryVector = await embedOne(q);
    // TODO: query your vector DB with _queryVector
    const results: { docId: string; title: string; score: number; excerpt: string }[] = [];
    logger.info({ userId, q, limit, latency: Date.now() - start }, 'semantic search complete');
    await recordLatency('search', Date.now() - start);
    return NextResponse.json({ results });
  } catch (err) {
    logger.error({ err, userId, q }, 'search failed');
    return apiError(500, 'Search failed');
  }
}
