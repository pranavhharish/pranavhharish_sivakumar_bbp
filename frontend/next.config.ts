import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Rewrites for API routes to handle backend in development
  async rewrites() {
    // In production (Vercel), routes are handled by vercel.json
    // In development, proxy to local backend
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default config;
