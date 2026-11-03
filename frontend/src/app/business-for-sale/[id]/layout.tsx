import { Metadata } from 'next';

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001/api';
  try {
    const res = await fetch(`${backendUrl}/v1/business-for-sale/${params.id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const business = data?.data?.business;
      if (business) {
        return {
          title: `${business.title} | Business-for-Sale | FranchiseDunia`,
          description: business.summary?.slice(0, 160) || `Acquisition opportunity in ${business.industry}`,
          openGraph: {
            title: `${business.title} - ${business.industry}`,
            description: business.summary?.slice(0, 160),
          },
        };
      }
    }
  } catch (err) {
    // Fallback
  }

  return {
    title: `Business Opportunity #${params.id.slice(-6)} | FranchiseDunia`,
    description: `Verified confidential business acquisition opportunity on FranchiseDunia with server-side NDA protection.`,
  };
}

export default function BusinessDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
