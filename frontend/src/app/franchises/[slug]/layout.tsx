import { Metadata } from 'next';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001/api';
  try {
    const res = await fetch(`${backendUrl}/v1/franchises/${params.slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const franchise = data?.data?.franchise;
      if (franchise) {
        return {
          title: `${franchise.name} Franchise Opportunity | FranchiseDunia`,
          description: franchise.tagline || franchise.description?.slice(0, 160) || `Explore franchise opportunity with ${franchise.name}`,
          openGraph: {
            title: `${franchise.name} Franchise | Investment & Unit Economics`,
            description: franchise.tagline || franchise.description?.slice(0, 160),
            images: franchise.bannerUrl ? [franchise.bannerUrl] : [],
          },
        };
      }
    }
  } catch (err) {
    // Fallback to slug-derived metadata
  }

  const formattedName = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${formattedName} Franchise | FranchiseDunia`,
    description: `Explore the ${formattedName} franchise opportunity, required capital outlay, and unit economics on FranchiseDunia.`,
  };
}

export default function FranchiseDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
