/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone' is for self-hosted Docker only.
  // Vercel manages its own output pipeline — do not set it here.
};

module.exports = nextConfig;
