import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output: 'standalone' is for self-hosted Docker only.
  // Vercel manages its own output pipeline — do not set it here.
};

export default nextConfig;
