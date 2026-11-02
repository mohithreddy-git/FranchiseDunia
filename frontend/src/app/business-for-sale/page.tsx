'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BusinessForSale, BusinessListingType } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import BorderGlowCard from '@/components/animations/BorderGlowCard';
import SaveButton from '@/components/shared/SaveButton';
import {
  Briefcase,
  Shield,
  TrendingUp,
  MapPin,
  Calendar,
  Users,
  Lock,
  ChevronRight,
  DollarSign,
  Building2,
} from 'lucide-react';

const LISTING_TYPES: { value: BusinessListingType | 'All'; label: string }[] = [
  { value: 'All', label: 'All Opportunities' },
  { value: 'sale', label: 'Full Acquisition' },
  { value: 'equity_stake', label: 'Equity Stake' },
  { value: 'joint_venture', label: 'Joint Venture' },
  { value: 'partnership', label: 'Strategic Partnership' },
];

const INDUSTRIES = [
  'All',
  'Food & Beverage',
  'Retail',
  'Healthcare',
  'Education',
  'Technology',
  'Fitness & Wellness',
  'Logistics & Supply Chain',
  'Automotive & Mobility',
];

const REVENUE_BANDS = [
  'All',
  '₹50 Lakhs - ₹1 Crore',
  '₹1 Crore - ₹3 Crores',
  '₹3 Crores - ₹5 Crores',
  '₹5 Crores - ₹10 Crores',
  '₹10 Crores+',
];

function BusinessCard({ business }: { business: BusinessForSale }) {
  const listingTypeLabels: Record<BusinessListingType, string> = {
    sale: 'Full Sale',
    joint_venture: 'Joint Venture',
    equity_stake: 'Equity Stake',
    partnership: 'Partnership',
  };

  return (
    <BorderGlowCard className="flex flex-col h-full group p-5 hover:border-amber-500/40 transition-colors">
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="amber" size="sm">
            {listingTypeLabels[business.listingType] || business.listingType}
          </Badge>
          <span className="text-[11px] font-medium text-muted bg-white/[0.04] px-2 py-0.5 rounded-pill border border-white/[0.06]">
            {business.industry}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {business.isSampleData && <Badge variant="slate" size="sm">Sample</Badge>}
          <SaveButton
            targetType="business"
            targetId={business._id}
            initialSaved={business.isSaved}
            size="sm"
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base text-foreground font-display group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
        {business.title}
      </h3>

      {/* Summary Teaser */}
      <p className="text-xs text-muted line-clamp-3 mb-4 leading-relaxed">
        {business.summary}
      </p>

      {/* Financial Teaser Grid */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-surface-subtle/80 rounded-item border border-white/[0.06] mb-4">
        <div>
          <div className="text-[10px] uppercase font-mono text-muted mb-0.5">Est. Revenue Band</div>
          <div className="text-xs font-semibold text-foreground truncate">{business.revenueBand}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono text-muted mb-0.5">Est. Profit Band</div>
          <div className="text-xs font-semibold text-emerald-400 truncate">{business.profitBand}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono text-muted mb-0.5">Asking Price Band</div>
          <div className="text-xs font-semibold text-primary truncate">{business.askingPriceBand}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono text-muted mb-0.5">Est. Year / Team</div>
          <div className="text-xs font-semibold text-muted">
            {business.establishedYear} · {business.employeeCountBand}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
        <MapPin className="w-3.5 h-3.5 text-muted/70 shrink-0" />
        <span className="truncate">{business.region}</span>
      </div>

      {/* Protected Financials Teaser Banner */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/90 mb-4">
        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Exact P&L, balance sheet & address protected by NDA</span>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
        <div className="text-xs text-muted">
          Seller: <span className="text-foreground">{business.seller?.company || business.seller?.name || 'Verified Seller'}</span>
        </div>
        <Link href={`/business-for-sale/${business._id || business.slug}`}>
          <Button variant="secondary" size="sm" className="text-xs gap-1 group-hover:border-amber-500/40">
            <span>Unlock Opportunity</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </BorderGlowCard>
  );
}

function BusinessCardSkeleton() {
  return (
    <div className="rounded-card border border-white/[0.08] p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-16 w-full" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

function BusinessForSaleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businesses, setBusinesses] = useState<BusinessForSale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const listingType = (searchParams.get('listingType') || 'All') as BusinessListingType | 'All';
  const industry = searchParams.get('industry') || 'All';
  const revenueBand = searchParams.get('revenueBand') || 'All';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'All' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page');
      router.push(`/business-for-sale?${params.toString()}`, { scroll: false });
      setPage(1);
    },
    [searchParams, router]
  );

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 12 };
        if (listingType !== 'All') params.listingType = listingType;
        if (industry !== 'All') params.industry = industry;
        if (revenueBand !== 'All') params.revenueBand = revenueBand;
        const result = await api.businessForSale.list(params);
        setBusinesses(result.businesses);
        setTotal(result.total);
      } catch (err) {
        console.error('Failed to load business listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [listingType, industry, revenueBand, page]);

  const totalPages = Math.ceil(total / 12);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Badge variant="amber" size="md">
          <Shield className="w-3.5 h-3.5" /> Confidential Business Exchange
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
          Businesses for Sale & Strategic Partnerships
        </h1>
        <p className="text-sm text-muted max-w-2xl leading-relaxed">
          Acquire cash-flowing companies, franchise outlet portfolios, and growth-stage equity stakes.
          All sensitive revenue and balance sheet records are legally gated behind server-side Non-Disclosure Agreements.
        </p>
      </div>

      {/* Listing Type Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {LISTING_TYPES.map((lt) => (
          <button
            key={lt.value}
            onClick={() => updateParam('listingType', lt.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              listingType === lt.value
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-white/[0.03] text-muted border-white/[0.08] hover:border-white/[0.2] hover:text-foreground'
            }`}
          >
            {lt.label}
          </button>
        ))}
      </div>

      {/* Industry Filter Chips */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind}
            onClick={() => updateParam('industry', ind)}
            className={`px-2.5 py-1 rounded-pill text-[11px] font-medium border transition-all ${
              industry === ind
                ? 'bg-primary text-black border-primary'
                : 'bg-white/[0.03] text-muted border-white/[0.06] hover:text-foreground hover:border-white/[0.2]'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-xs text-muted mb-4">
          Showing {businesses.length} of {total} verified business opportunities
          {industry !== 'All' ? ` in ${industry}` : ''}
        </p>
      )}

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <BusinessCardSkeleton key={i} />)
          : businesses.map((b) => <BusinessCard key={b._id || b.id} business={b} />)}
      </div>

      {/* Empty State */}
      {!loading && businesses.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <Briefcase className="w-12 h-12 text-muted/40 mx-auto" />
          <p className="text-muted text-sm">No business listings match the selected filters.</p>
          <Button variant="secondary" size="sm" onClick={() => router.push('/business-for-sale')}>
            Reset All Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </main>
  );
}

export default function BusinessForSalePage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted">
          Loading Business Directory...
        </div>
      }
    >
      <BusinessForSaleContent />
    </React.Suspense>
  );
}
