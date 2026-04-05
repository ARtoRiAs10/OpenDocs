import { NextResponse } from 'next/server';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
};

export function apiError(status: number, detail?: string) {
  return NextResponse.json(
    { error: STATUS_MESSAGES[status] ?? 'Error', detail: detail ?? null, status },
    { status },
  );
}

/** Wraps any async route handler — uncaught exceptions return a proper 500. */
export function withErrorHandler(handler: (req: Request, ctx: unknown) => Promise<Response>) {
  return async (req: Request, ctx: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      console.error('[unhandled API error]', err);
      return apiError(500, 'An unexpected error occurred');
    }
  };
}
