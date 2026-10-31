/** @type {import('next').NextConfig} */
const apiTarget = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@subflow/shared'],
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${apiTarget}/health`,
      },
    ];
  },
};

export default nextConfig;
