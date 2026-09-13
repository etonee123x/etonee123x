import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/uploads/', '/covers/', '/content/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
