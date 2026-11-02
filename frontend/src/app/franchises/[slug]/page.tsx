'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCompactINR, formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import InquiryModal from '@/components/shared/InquiryModal';
import BorderGlowCard from '@/components/animations/BorderGlowCard';
import HoverLift from '@/components/animations/HoverLift';
import {
  Store,
  MapPin,
  Calendar,
  CheckCircle2,
  Download,
  Share2,
  ArrowLeft,
  Coins,
  Receipt,
  Maximize2,
  Clock,
  TrendingUp,
  Percent,
  Sparkles,
  ShieldAlert,
  Building2,
  Check,
} from 'lucide-react';

export default function FranchiseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isBrochureModalOpen, setIsBrochureModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['franchise', slug],
    queryFn: () => api.franchises.getBySlug(slug),
    enabled: !!slug,
  });

  const franchise = data?.franchise;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 rounded-card w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-card" />
            <Skeleton className="h-48 rounded-card" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !franchise) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Franchise Opportunity Not Found
        </h1>
        <p className="text-xs text-muted">
          The requested franchise profile does not exist or may have been unlisted.
        </p>
        <Link href="/franchises">
          <Button variant="primary" size="sm">
            Return to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/franchises"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors bg-surface px-3 py-1.5 rounded-item border border-white/[0.08]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Opportunity'}</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-card bg-surface border border-white/[0.08] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-card bg-surface-subtle border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
              {franchise.logoUrl ? (
                <Image
                  src={franchise.logoUrl}
                  alt={franchise.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="w-10 h-10 text-primary" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="emerald">{franchise.industry}</Badge>
                {franchise.isVerified && <Badge variant="verified">Verified Brand</Badge>}
                {franchise.isFeatured && <Badge variant="featured">Featured Growth Partner</Badge>}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
                {franchise.name}
              </h1>

              <p className="text-sm text-muted max-w-xl">{franchise.tagline}</p>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-muted font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted/70" />
                  {franchise.headquarters}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted/70" />
                  Est. {franchise.establishedYear}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-muted/70" />
                  {franchise.unitsOperational}+ Units Operational
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTA cluster */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsInquiryModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <span>Connect with Brand</span>
              <Sparkles className="w-4 h-4 ml-1.5" />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBrochureModalOpen(true)}
              className="w-full sm:w-auto text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Download Prospectus</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Story, Support, Economics */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Unit Economics & Capital Grid */}
          <section className="rounded-card bg-surface border border-white/[0.08] p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold font-display text-foreground">
                Unit Economics & Investment Structure
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-item bg-surface-subtle border border-white/[0.06]">
                <div className="text-[10px] font-mono uppercase text-muted mb-1">
                  Total Capital Outlay
                </div>
                <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                  {formatCompactINR(franchise.investmentMin)}
                </div>
                <div className="text-[11px] text-muted">to {formatCompactINR(franchise.investmentMax)}</div>
              </div>

              <div className="p-3.5 rounded-item bg-surface-subtle border border-white/[0.06]">
                <div className="text-[10px] font-mono uppercase text-muted mb-1">
                  Franchise License Fee
                </div>
                <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                  {formatINR(franchise.franchiseFee)}
                </div>
                <div className="text-[11px] text-muted">One-time upfront</div>
              </div>

              <div className="p-3.5 rounded-item bg-surface-subtle border border-white/[0.06]">
                <div className="text-[10px] font-mono uppercase text-muted mb-1">
                  Royalty / Tech Share
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                  {franchise.royaltyPercent ? `${franchise.royaltyPercent}%` : '0%'}
                </div>
                <div className="text-[11px] text-muted">Monthly revenue</div>
              </div>

              <div className="p-3.5 rounded-item bg-surface-subtle border border-white/[0.06]">
                <div className="text-[10px] font-mono uppercase text-muted mb-1">
                  Estimated Payback
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                  {franchise.roiPeriodMonths} Mos
                </div>
                <div className="text-[11px] text-muted">Capital breakeven</div>
              </div>
            </div>

            {/* Operating Projections Breakdown */}
            {franchise.unitEconomics && (
              <div className="pt-4 border-t border-white/[0.06]">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-medium mb-3">
                  Projected Unit P&L Performance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-item bg-surface-card border border-white/[0.04]">
                    <span className="text-xs text-muted block mb-0.5">Est. Monthly Turnover</span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      {formatINR(franchise.unitEconomics.expectedMonthlyRevenue)} / mo
                    </span>
                  </div>

                  <div className="p-3 rounded-item bg-surface-card border border-white/[0.04]">
                    <span className="text-xs text-muted block mb-0.5">Operating Net Margin</span>
                    <span className="text-sm font-semibold text-emerald-400 font-mono">
                      ~{franchise.unitEconomics.expectedNetProfitMargin}% Net Profit
                    </span>
                  </div>

                  <div className="p-3 rounded-item bg-surface-card border border-white/[0.04]">
                    <span className="text-xs text-muted block mb-0.5">Operating Break-Even</span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      Month {franchise.unitEconomics.breakEvenPeriodMonths || 4}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2. Brand Backstory & Overview */}
          <section className="rounded-card bg-surface border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-lg font-bold font-display text-foreground">
              About {franchise.name}
            </h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {franchise.description}
            </p>
          </section>

          {/* 3. Comprehensive Franchisor Support */}
          <section className="rounded-card bg-surface border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-lg font-bold font-display text-foreground">
              Franchisor Operational Support Provided
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {franchise.supportProvided?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-item bg-surface-subtle border border-white/[0.04]"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Target Territories & Expansion Scope */}
          <section className="rounded-card bg-surface border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-lg font-bold font-display text-foreground">
              Territory & Expansion Locations
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {franchise.availableLocations?.map((loc) => (
                <Badge key={loc} variant="slate" size="md">
                  <MapPin className="w-3 h-3 mr-1 text-primary" />
                  {loc}
                </Badge>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Quick Spec Sheet & Form Anchor */}
        <div className="space-y-6 sticky top-28">
          <BorderGlowCard className="p-6 space-y-5">
            <h3 className="font-bold text-base text-foreground font-display pb-3 border-b border-white/[0.08]">
              Unit Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-muted flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" /> Floor Space Required:
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {franchise.spaceMinSqFt} - {franchise.spaceMaxSqFt || franchise.spaceMinSqFt * 2} sq ft
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-muted flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Min Investment:
                </span>
                <span className="font-semibold text-primary font-mono">
                  {formatINR(franchise.investmentMin)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-muted flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Max Investment:
                </span>
                <span className="font-semibold text-primary font-mono">
                  {formatINR(franchise.investmentMax)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Payback Period:
                </span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {franchise.roiPeriodMonths} Months
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-muted flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Units Active:
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {franchise.unitsOperational} Outlets
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsInquiryModalOpen(true)}
              className="w-full"
            >
              Request Brand Callback
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBrochureModalOpen(true)}
              className="w-full text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Unit Deck (.pdf)
            </Button>
          </BorderGlowCard>

          {/* Verified Franchisor Guarantee */}
          <div className="p-4 rounded-card bg-surface-subtle border border-emerald-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold font-display">
              <CheckCircle2 className="w-4 h-4" />
              <span>FranchiseDunia Verification Guarantee</span>
            </div>
            <p className="text-muted leading-relaxed">
              Financial metrics are reviewed against company disclosures. Your initial discussions
              are protected with zero intermediary broker fees.
            </p>
          </div>
        </div>
      </div>

      {/* Brochure Prospectus Download Modal */}
      <Modal
        isOpen={isBrochureModalOpen}
        onClose={() => setIsBrochureModalOpen(false)}
        title={`${franchise.name} Franchise Prospectus`}
        description="Official informational kit for qualified investors and multi-unit operators."
      >
        <div className="space-y-4 text-center py-4">
          <div className="p-6 rounded-item bg-surface-subtle border border-white/[0.08] space-y-2">
            <h4 className="font-semibold text-foreground text-sm font-display">
              {franchise.name} Official 2026 Expansion Deck
            </h4>
            <p className="text-xs text-muted">
              Includes floor designs, kitchen/hardware blueprints, capex breakdown, and marketing
              calendar.
            </p>
          </div>

          <a
            href={franchise.brochureUrl || '/docs/brochure-sample.pdf'}
            download={`${franchise.slug}-franchise-deck.pdf`}
            onClick={() => {
              setTimeout(() => setIsBrochureModalOpen(false), 500);
            }}
          >
            <Button variant="primary" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download PDF Prospectus
            </Button>
          </a>
        </div>
      </Modal>

      {/* Direct Connect Lead Modal */}
      <InquiryModal
        franchise={franchise}
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />
    </div>
  );
}
