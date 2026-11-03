import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://franchisedunia.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/franchises',
          '/franchises/*',
          '/events',
          '/events/*',
          '/business-for-sale',
          '/business-for-sale/*',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/leads',
          '/leads/*',
          '/inquiries',
          '/inquiries/*',
          '/auth/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
