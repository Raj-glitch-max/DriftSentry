import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Required for Docker production builds
  eslint: {
    // Warning: This allows production builds with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds with TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
