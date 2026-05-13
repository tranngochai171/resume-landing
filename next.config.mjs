/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
};

export default nextConfig;
