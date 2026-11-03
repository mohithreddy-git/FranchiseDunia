import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://franchisedunia.in';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001/api';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/franchises`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/business-for-sale`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const [franchisesRes, eventsRes, businessesRes] = await Promise.allSettled([
      fetch(`${backendUrl}/v1/franchises?limit=50`, { next: { revalidate: 3600 } }),
      fetch(`${backendUrl}/v1/events?limit=50`, { next: { revalidate: 3600 } }),
      fetch(`${backendUrl}/v1/business-for-sale?limit=50`, { next: { revalidate: 3600 } }),
    ]);

    if (franchisesRes.status === 'fulfilled' && franchisesRes.value.ok) {
      const data = await franchisesRes.value.json();
      const items = data?.data?.franchises || [];
      dynamicRoutes.push(
        ...items.map((f: any) => ({
          url: `${baseUrl}/franchises/${f.slug}`,
          lastModified: new Date(f.updatedAt || f.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
      );
    }

    if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
      const data = await eventsRes.value.json();
      const items = data?.data?.events || [];
      dynamicRoutes.push(
        ...items.map((e: any) => ({
          url: `${baseUrl}/events/${e.slug}`,
          lastModified: new Date(e.updatedAt || e.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      );
    }

    if (businessesRes.status === 'fulfilled' && businessesRes.value.ok) {
      const data = await businessesRes.value.json();
      const items = data?.data?.businesses || [];
      dynamicRoutes.push(
        ...items.map((b: any) => ({
          url: `${baseUrl}/business-for-sale/${b._id}`,
          lastModified: new Date(b.updatedAt || b.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      );
    }
  } catch (err) {
    console.warn('Sitemap dynamic routes fetch fallback active:', err);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
