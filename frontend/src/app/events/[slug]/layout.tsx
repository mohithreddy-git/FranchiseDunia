import { Metadata } from 'next';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001/api';
  try {
    const res = await fetch(`${backendUrl}/v1/events/${params.slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const event = data?.data?.event;
      if (event) {
        return {
          title: `${event.title} | FranchiseDunia Events Hub`,
          description: event.description?.slice(0, 160) || `Register for ${event.title} in ${event.city}`,
          openGraph: {
            title: `${event.title} - ${event.city}`,
            description: event.description?.slice(0, 160),
            images: event.bannerUrl ? [event.bannerUrl] : [],
          },
        };
      }
    }
  } catch (err) {
    // Fallback
  }

  const formattedName = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${formattedName} | FranchiseDunia Events`,
    description: `Register for ${formattedName} and network with top franchise brands and investors.`,
  };
}

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
