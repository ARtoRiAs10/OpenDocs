import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError } from '@/utils/error-handler';
import { logger } from '@/utils/logger';
import { recordLatency, incrementThroughput } from '@/utils/metrics';
import { batchEmbed } from '@/services/embedding.service';
import { OpenRouterError } from '@/lib/openrouter';

const MAX_TEXTS = 500;

export async function POST(req: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) return apiError(401, 'Unauthorized');

  let body: { texts?: unknown };
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  const { texts } = body;
  if (!Array.isArray(texts) || texts.length === 0) return apiError(400, 'texts must be a non-empty array of strings');
  if (texts.some((t) => typeof t !== 'string')) return apiError(400, 'All items in texts must be strings');
  if (texts.length > MAX_TEXTS) return apiError(400, `texts array exceeds maximum of ${MAX_TEXTS} items`);

  try {
    const embeddings = await batchEmbed(texts as string[]);
    const latency = Date.now() - start;
    await recordLatency('ai.embed', latency);
    await incrementThroughput('ai.embed');
    logger.info({ userId, count: texts.length, latency }, 'embeddings generated');
    return NextResponse.json({ embeddings, count: embeddings.length });
  } catch (err) {
    if (err instanceof OpenRouterError) {
      logger.error({ status: err.statusCode, body: err.body, userId }, 'OpenRouter embed error');
      if (err.statusCode === 429) return apiError(429, 'AI rate limit reached.');
      return apiError(502, 'Embedding service unavailable');
    }
    logger.error({ err, userId }, 'unexpected embed error');
    return apiError(500, 'Failed to generate embeddings');
  }
}
