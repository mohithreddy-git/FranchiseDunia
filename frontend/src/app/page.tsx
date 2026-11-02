'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { INDUSTRIES, TOP_CITIES } from '@/lib/utils';
import FranchiseCard from '@/components/shared/FranchiseCard';
import { FranchiseCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AnimatedGridBackground from '@/components/animations/AnimatedGridBackground';
import BorderGlowCard from '@/components/animations/BorderGlowCard';
import HoverLift from '@/components/animations/HoverLift';
import {
  Search,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Building,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  MapPin,
  FileCheck2,
  Users2,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Hero Quick Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  // Fetch Featured Franchises with React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['featured-franchises'],
    queryFn: () => api.franchises.list({ isFeatured: true, limit: 6 }),
  });

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedIndustry !== 'All') params.append('industry', selectedIndustry);
    if (selectedCity !== 'All') params.append('city', selectedCity);
    router.push(`/franchises?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedGridBackground />

      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Trust Banner Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium select-none shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>India’s Leading Business Opportunity & Franchise Network</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-display text-foreground leading-[1.1]">
            Own a Proven Business.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
              Accelerate Wealth.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Discover verified franchise brands, explore unit economics in INR, compare store
            models, and connect directly with brand founders for multi-unit territory expansion.
          </p>

          {/* Metric Stat Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-muted">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/[0.04] border border-white/[0.08]">
              <span className="text-emerald-400 font-bold">25+</span> Verified Brands
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/[0.04] border border-white/[0.08]">
              <span className="text-emerald-400 font-bold">₹120 Cr+</span> Capital Targetted
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/[0.04] border border-white/[0.08]">
              <span className="text-emerald-400 font-bold">50+</span> Indian Hub Cities
            </span>
          </div>

          {/* Interactive Match Search Box */}
          <div className="pt-6 max-w-4xl mx-auto">
            <form
              onSubmit={handleHeroSearch}
              className="p-3 sm:p-4 rounded-card bg-surface/90 border border-white/[0.12] shadow-2xl backdrop-blur-xl grid grid-cols-1 sm:grid-cols-12 gap-3"
            >
              {/* Keyword / Brand Input */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Brand, category (e.g. Chai Point, Clinic)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-subtle text-foreground text-sm rounded-item border border-white/[0.08] pl-10 pr-3 py-3 placeholder:text-muted/60 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Industry Select */}
              <div className="sm:col-span-3">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full bg-surface-subtle text-foreground text-sm rounded-item border border-white/[0.08] px-3 py-3 focus:outline-none focus:border-primary"
                >
                  <option value="All">All Industries</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Select */}
              <div className="sm:col-span-2">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-surface-subtle text-foreground text-sm rounded-item border border-white/[0.08] px-3 py-3 focus:outline-none focus:border-primary"
                >
                  <option value="All">All Cities</option>
                  {TOP_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit CTA Button */}
              <div className="sm:col-span-2">
                <Button type="submit" variant="primary" size="lg" className="w-full h-full py-3 text-sm">
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Industry Taxonomies Quick-Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          <Link href="/franchises">
            <span className="shrink-0 px-4 py-2 rounded-pill bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-foreground transition-colors cursor-pointer border border-white/[0.08]">
              All Sectors
            </span>
          </Link>
          {INDUSTRIES.map((industry) => (
            <Link
              key={industry}
              href={`/franchises?industry=${encodeURIComponent(industry)}`}
            >
              <span className="shrink-0 px-4 py-2 rounded-pill bg-surface border border-white/[0.08] hover:border-emerald-500/40 hover:text-emerald-400 text-xs font-medium text-muted transition-all cursor-pointer block">
                {industry}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Franchises Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Opportunities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              Featured High-Growth Franchises
            </h2>
            <p className="text-sm text-muted mt-1">
              Handpicked brands with proven unit economics, turnkey supply chains, and rapid payback.
            </p>
          </div>

          <Link href="/franchises">
            <Button variant="secondary" size="sm" className="text-xs">
              <span>View All 25+ Opportunities</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Grid Display */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <FranchiseCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-card bg-surface p-12 text-center border border-white/[0.08]">
            <p className="text-sm text-red-400">Unable to load featured franchises.</p>
            <Link href="/franchises">
              <Button variant="outline" size="sm" className="mt-4">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        ) : data?.franchises && data.franchises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.franchises.map((franchise) => (
              <FranchiseCard key={franchise._id} franchise={franchise} />
            ))}
          </div>
        ) : (
          <div className="rounded-card bg-surface p-12 text-center border border-white/[0.08]">
            <p className="text-sm text-muted">No featured brands found.</p>
          </div>
        )}
      </section>

      {/* 4. Why FranchiseDunia Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="emerald" size="sm" className="mb-2">Institutional Rigor</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            The Trust Engine for Indian Franchising
          </h2>
          <p className="text-sm text-muted mt-1">
            We bridge the gap between ambitious franchise brands and qualified capital partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HoverLift>
            <BorderGlowCard className="h-full space-y-3">
              <div className="w-10 h-10 rounded-item bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground font-display">
                Audited Unit Economics
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Every listing undergoes verification for capital outlays, royalty rates, floor area
                feasibility, and historical break-even timelines.
              </p>
            </BorderGlowCard>
          </HoverLift>

          <HoverLift>
            <BorderGlowCard className="h-full space-y-3" glowColor="amber">
              <div className="w-10 h-10 rounded-item bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground font-display">
                Digital NDA & Privacy
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Confidential business-for-sale metrics, P&L statements, and proprietary supply chain
                disclosures are protected via enforceable digital NDAs.
              </p>
            </BorderGlowCard>
          </HoverLift>

          <HoverLift>
            <BorderGlowCard className="h-full space-y-3">
              <div className="w-10 h-10 rounded-item bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground font-display">
                Direct Decision-Maker Access
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                No middleman brokers. Qualified investor inquiries route directly to brand heads of
                expansion and master franchisees for rapid turnaround.
              </p>
            </BorderGlowCard>
          </HoverLift>
        </div>
      </section>

      {/* 5. Brand Owner Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-card bg-gradient-to-br from-surface to-surface-card border border-emerald-500/20 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              For Brand Owners & Franchisors
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Ready to expand into 100+ cities across India?
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              List your brand on FranchiseDunia to access pre-screened investors with ready capital,
              commercial real estate owners, and qualified multi-unit operators.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link href="/auth/register">
                <Button variant="primary" size="lg">
                  List Your Franchise Brand
                </Button>
              </Link>
              <Link href="/franchises">
                <Button variant="secondary" size="lg">
                  Explore Current Listings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
