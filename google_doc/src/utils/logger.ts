import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'opendocs' },
  // 1. Disable asynchronous hooks that require workers
  async: false, 
  // 2. Avoid 'transport' which spawns a separate thread
  // Only use pino-pretty if you are NOT in a restricted worker environment
  ...(isDevelopment && typeof window === 'undefined'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { 
            colorize: true, 
            ignore: 'pid,hostname',
            // This forces pino-pretty to stay more stable in some environments
            sync: true 
          },
        },
      }
    : {}),
});