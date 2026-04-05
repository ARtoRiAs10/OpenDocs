// src/lib/openrouter.ts
// Central OpenRouter client — all AI calls go through here.
// OpenRouter is OpenAI-API-compatible: same shape, different base URL & key.
// Docs: https://openrouter.ai/docs

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

function getHeaders() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'http://localhost:3000',
    'X-Title': 'OpenDocs',
  };
}

// ── Model registry ────────────────────────────────────────────────────────────
// Change a model in one place → every feature picks it up automatically.
export const MODELS = {
  default: 'stepfun/step-3.5-flash:free',       // fast & cheap
  smart: 'stepfun/step-3.5-flash:free',     // heavy tasks
  embedding: 'stepfun/step-3.5-flash:free',
} as const;

export type ModelKey = keyof typeof MODELS;

// ── Types (OpenAI-compatible) ─────────────────────────────────────────────────
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

// ── Streaming completion ──────────────────────────────────────────────────────
/** Returns the raw streaming Response — pipe directly to the client. */
export async function streamCompletion(options: CompletionOptions): Promise<Response> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: options.model ?? MODELS.default,
      stream: true,
      max_tokens: options.max_tokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      messages: options.messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new OpenRouterError(res.status, text);
  }
  return res;
}

// ── Non-streaming completion ──────────────────────────────────────────────────
/** Await the full response — use for short tasks. */
export async function complete(options: CompletionOptions): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: options.model ?? MODELS.default,
      stream: false,
      max_tokens: options.max_tokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      messages: options.messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new OpenRouterError(res.status, text);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? '';
}

// ── Embeddings ────────────────────────────────────────────────────────────────
/** Embed an array of strings; returns vectors in the same order as input. */
export async function embed(input: string[]): Promise<number[][]> {
  if (!input.length) return [];
  const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model: MODELS.embedding, input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new OpenRouterError(res.status, text);
  }
  const data = await res.json();
  const sorted = (data.data as { index: number; embedding: number[] }[]).sort(
    (a, b) => a.index - b.index,
  );
  return sorted.map((d) => d.embedding);
}

// ── Error class ───────────────────────────────────────────────────────────────
export class OpenRouterError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string,
  ) {
    super(`OpenRouter error ${statusCode}: ${body}`);
    this.name = 'OpenRouterError';
  }
}
