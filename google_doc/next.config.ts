import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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