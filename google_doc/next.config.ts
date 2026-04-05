import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // 1. Disable ESLint validation during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2. Disable TypeScript type checking during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'cuddly-invention-v64xqgx4xxwcp6j9-3000.app.github.dev',
        'localhost:3000'
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Webpack: Ensure that all imports of 'yjs' resolve to the same instance
      config.resolve.alias['yjs'] = path.resolve(__dirname, 'node_modules/yjs');
    }
    return config;
  },
};

export default nextConfig;
