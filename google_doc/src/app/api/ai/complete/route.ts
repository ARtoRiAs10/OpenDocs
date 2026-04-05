import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError } from '@/utils/error-handler';
import { logger } from '@/utils/logger';
import { recordLatency, incrementThroughput } from '@/utils/metrics';
import { complete, MODELS, OpenRouterError } from '@/lib/openrouter';
import type { ChatMessage } from '@/lib/openrouter';

const TASK_PROMPTS: Record<string, string> = {
  summarise: 'Summarise the following document excerpt in 2-3 sentences. Be concise.',
  title: 'Generate 3 short descriptive title suggestions. Return a JSON array of strings only.',
  grammar: 'Fix grammar and spelling errors. Return only the corrected text.',
  rewrite: 'Rewrite to be clearer and more professional. Return only the rewritten text.',
};

export async function POST(req: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) return apiError(401, 'Unauthorized');

  let body: { task?: string; content?: string; model?: string };
  try { body = await req.json(); } catch { return apiError(400, 'Invalid JSON body'); }

  const { task = 'summarise', content, model } = body;
  if (!content?.trim()) return apiError(400, 'content is required');
  if (!(task in TASK_PROMPTS)) return apiError(400, `task must be one of: ${Object.keys(TASK_PROMPTS).join(', ')}`);

  const messages: ChatMessage[] = [
    { role: 'system', content: TASK_PROMPTS[task] },
    { role: 'user', content },
  ];
  const resolvedModel = model === 'smart' ? MODELS.smart : MODELS.default;

  try {
    const result = await complete({ model: resolvedModel, messages, max_tokens: 512 });
    const latency = Date.now() - start;
    await recordLatency(`ai.complete.${task}`, latency);
    await incrementThroughput('ai.complete');
    console.log("Values:", { userId, task, model: resolvedModel });
    logger.info({ userId, task, model: resolvedModel, latency }, 'AI completion done');
    return NextResponse.json({ result, task });
  } catch (err) {
    if (err instanceof OpenRouterError) {
      logger.error({ status: err.statusCode, body: err.body, userId, task }, 'OpenRouter complete error');
      if (err.statusCode === 429) return apiError(429, 'AI rate limit reached.');
      return apiError(502, 'AI service unavailable');
    }
    logger.error({ err, userId, task }, 'unexpected complete error');
    return apiError(500, 'AI completion failed');
  }
}
