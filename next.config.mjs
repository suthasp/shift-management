/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Only enable static export for build
  ...(isProd ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      exceljs: 'exceljs/dist/exceljs.min.js',
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
