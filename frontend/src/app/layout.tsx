import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FranchiseDunia | Discover, Evaluate & Connect with India’s Top Franchise Brands',
  description:
    'A high-trust investment ecosystem connecting franchise brands, aspiring entrepreneurs, high-net-worth investors, and business sellers across India.',
  keywords: [
    'Franchise India',
    'Franchise opportunities',
    'Business for sale',
    'F&B franchise',
    'Retail franchise',
    'Chai Point franchise',
    'Lenskart franchise',
    'Investor network',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300">
        <QueryProvider>
          <div>
            <Navbar />
            <main>{children}</main>
          </div>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
