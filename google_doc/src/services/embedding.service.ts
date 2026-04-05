import { logger } from '@/utils/logger';
import { embed, OpenRouterError } from '@/lib/openrouter';

const BATCH_SIZE = 100;
const MAX_PARALLEL = 3;

/**
 * Batch-embed texts via OpenRouter → openai/text-embedding-3-small.
 * Splits into BATCH_SIZE chunks, runs MAX_PARALLEL concurrently.
 * Returns vectors in the same order as input.
 */
export async function batchEmbed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    chunks.push(texts.slice(i, i + BATCH_SIZE));
  }

  const allResults: number[][] = new Array(texts.length);

  for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
    const window = chunks.slice(i, i + MAX_PARALLEL);
    const settled = await Promise.allSettled(
      window.map((batch, j) => embed(batch).then((vecs) => ({ vecs, chunkIdx: i + j }))),
    );

    for (const result of settled) {
      if (result.status === 'rejected') {
        const err = result.reason;
        logger.error(
          { err: err instanceof OpenRouterError ? { status: err.statusCode, body: err.body } : err },
          'embedding batch failed',
        );
        throw err;
      }
      const { vecs, chunkIdx } = result.value;
      const offset = chunkIdx * BATCH_SIZE;
      vecs.forEach((vec, k) => { allResults[offset + k] = vec; });
      logger.info({ chunkIdx, batchSize: window[chunkIdx - i].length, total: texts.length }, 'embedding batch complete');
    }
  }

  return allResults;
}

export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await batchEmbed([text]);
  return vec;
}
