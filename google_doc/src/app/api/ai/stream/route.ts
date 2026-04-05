import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError } from '@/utils/error-handler';
import { logger } from '@/utils/logger';
import { recordLatency, incrementThroughput } from '@/utils/metrics';
import { streamCompletion, MODELS, OpenRouterError } from '@/lib/openrouter';
import type { ChatMessage } from '@/lib/openrouter';



export async function POST(req: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) return apiError(401, 'Unauthorized');

  let body: { prompt?: string; context?: string; model?: string };
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  const { prompt, context, model } = body;
  if (!prompt?.trim()) return apiError(400, 'prompt is required');

  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful writing assistant embedded in a document editor. Be concise, clear, and match the tone of the existing document.' },
    ...(context ? [{ role: 'user' as const, content: `Document context:\n${context}` }] : []),
    { role: 'user', content: prompt },
  ];

  const resolvedModel = model === 'smart' ? MODELS.smart : (model ?? MODELS.default);

  let upstream: Response;
  try {
    upstream = await streamCompletion({ model: resolvedModel, messages });
  } catch (err) {
    if (err instanceof OpenRouterError) {
      logger.error({ status: err.statusCode, body: err.body, userId, model: resolvedModel }, 'OpenRouter stream error');
      if (err.statusCode === 429) return apiError(429, 'AI rate limit reached. Please try again shortly.');
      return apiError(502, 'AI service unavailable');
    }
    logger.error({ err, userId }, 'unexpected stream error');
    return apiError(500, 'Unexpected error');
  }

  await recordLatency('ai.stream.ttfb', Date.now() - start);
  await incrementThroughput('ai.stream');
  logger.info({ userId, model: resolvedModel, latency: Date.now() - start }, 'AI stream started');

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
