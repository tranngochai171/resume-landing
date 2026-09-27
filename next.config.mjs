/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
    // Vercel sets VERCEL=1 at build time; Vercel Analytics / Speed Insights only exist there.
    NEXT_PUBLIC_VERCEL_ANALYTICS: process.env.VERCEL === '1' ? '1' : '',
  },
};

export default nextConfig;
