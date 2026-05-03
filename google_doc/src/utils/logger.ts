import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// ✅ No transport, no worker thread, safe in Next.js
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
  base: { service: 'opendocs' },
  // Pretty-print in dev using built-in formatters — no pino-pretty needed
  ...(isDevelopment
    ? {
        formatters: {
          level: (label: string) => ({ level: label.toUpperCase() }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
    : {}),
});