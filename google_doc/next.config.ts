import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'obscure-space-disco-r96jrjxg4j725gxg-3000.app.github.dev',
        // Keep existing ones
        'cuddly-invention-v64xqgx4xxwcp6j9-3000.app.github.dev',
        'localhost:3000',
        'https://google-docs-clone-five-gamma.vercel.app',
      ],
    },
  },
  webpack: (config, { isServer }) => {
    // ✅ Existing: single yjs instance
    if (!isServer) {
      config.resolve.alias['yjs'] = path.resolve(__dirname, 'node_modules/yjs');
    }

    // ✅ NEW: prevent Next.js bundling pino's worker thread files
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      'pino-pretty',
      'thread-stream',
    ];

    return config;
  },
};

export default nextConfig;