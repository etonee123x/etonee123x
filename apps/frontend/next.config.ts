import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  logging: {
    browserToTerminal: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Keep proxy and action limits above the 200 MiB file allowance for multipart overhead.
    proxyClientMaxBodySize: '220mb',
    serverActions: {
      // TODO: Replace buffered Server Action uploads with streaming or direct-to-storage uploads.
      bodySizeLimit: '220mb',
    },
  },
  rewrites() {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${process.env.SERVER_ORIGIN}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${process.env.SERVER_ORIGIN}/uploads/:path*`,
      },
      {
        source: '/covers/:path*',
        destination: `${process.env.SERVER_ORIGIN}/covers/:path*`,
      },
      {
        source: '/content/:path*',
        destination: `${process.env.SERVER_ORIGIN}/content/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
