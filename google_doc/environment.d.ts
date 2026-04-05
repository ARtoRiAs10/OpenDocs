declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_BASE_URL: string;
    CONVEX_DEPLOYMENT: string;
    NEXT_PUBLIC_CONVEX_URL: string;
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    NEXT_PUBLIC_LIVEBLOCKS_API_KEY: string;
    LIVEBLOCKS_SECRET_KEY: string;
    REDIS_URL: string;
    OPENROUTER_API_KEY: string;
    LOG_LEVEL?: string;
    PINECONE_API_KEY?: string;
    PINECONE_INDEX?: string;
    PINECONE_ENVIRONMENT?: string;
    SENTRY_DSN?: string;
  }
}
