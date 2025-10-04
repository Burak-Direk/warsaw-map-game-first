// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    // ✅ Skip ESLint during `next build` on Vercel
    ignoreDuringBuilds: true,
  },
  // keep type checking ON so we only skip lint, not TS checks
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
