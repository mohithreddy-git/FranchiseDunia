'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import FranchiseCard from '@/components/shared/FranchiseCard';
import FilterSidebar from '@/components/shared/FilterSidebar';
import { FranchiseCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Store,
  X,
} from 'lucide-react';

function FranchiseMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active query parameters
  const search = searchParams.get('search') || '';
  const industry = searchParams.get('industry') || '';
  const minInvestment = searchParams.get('minInvestment') || '';
  const maxInvestment = searchParams.get('maxInvestment') || '';
  const city = searchParams.get('city') || '';
  const roiPeriod = searchParams.get('roiPeriod') || '';
  const sortBy = searchParams.get('sortBy') || 'popular';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  // TanStack Query fetching filtered franchises
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'franchises',
      search,
      industry,
      minInvestment,
      maxInvestment,
      city,
      roiPeriod,
      sortBy,
      page,
    ],
    queryFn: () =>
      api.franchises.list({
        search,
        industry,
        minInvestment,
        maxInvestment,
        city,
        roiPeriod,
        sortBy,
        page,
        limit: 9,
      }),
  });

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1
    router.push(`/franchises?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim() || undefined);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    router.push('/franchises');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/franchises?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active filter indicators
  const activeFilters = [
    search ? { key: 'search', label: `Search: "${search}"` } : null,
    industry && industry !== 'All' ? { key: 'industry', label: `Sector: ${industry}` } : null,
    minInvestment || maxInvestment
      ? {
          key: 'investment',
          label: `Budget: ${minInvestment ? `₹${Number(minInvestment) / 100000}L` : '₹0'} - ${
            maxInvestment ? `₹${Number(maxInvestment) / 100000}L` : 'Unlimited'
          }`,
        }
      : null,
    city && city !== 'All' ? { key: 'city', label: `City: ${city}` } : null,
    roiPeriod ? { key: 'roiPeriod', label: `Max ROI: ${roiPeriod} Mos` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
              Franchise Opportunities
            </h1>
            <p className="text-sm text-muted mt-1">
              Browse {data?.total ?? '25+'} verified Indian franchise businesses looking for
              expansion partners.
            </p>
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="text-xs w-full"
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              <span>Filters {activeFilters.length > 0 && `(${activeFilters.length})`}</span>
            </Button>
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand name, keywords, or offerings..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-surface text-foreground text-sm rounded-item border border-white/[0.08] pl-10 pr-24 py-2.5 placeholder:text-muted/60 focus:outline-none focus:border-primary"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateParam('search', undefined);
                }}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                Clear
              </button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs h-7 px-3"
            >
              Search
            </Button>
          </form>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <span className="text-xs text-muted whitespace-nowrap hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="w-full sm:w-auto bg-surface text-foreground text-xs rounded-item border border-white/[0.08] px-3 py-2.5 focus:outline-none focus:border-primary"
            >
              <option value="popular">Recommended / Featured</option>
              <option value="investment_asc">Investment: Low to High</option>
              <option value="investment_desc">Investment: High to Low</option>
              <option value="roi_asc">ROI: Fastest Payback</option>
              <option value="units">Most Established (Units)</option>
              <option value="newest">Newly Listed</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted font-medium">Applied:</span>
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
              >
                <span>{f.label}</span>
                <button
                  onClick={() => {
                    if (f.key === 'investment') {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete('minInvestment');
                      params.delete('maxInvestment');
                      router.push(`/franchises?${params.toString()}`);
                    } else if (f.key === 'search') {
                      setSearchInput('');
                      updateParam('search', undefined);
                    } else {
                      updateParam(f.key, undefined);
                    }
                  }}
                  className="hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted hover:text-red-400 ml-2 underline"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Main Layout: Filter Sidebar + Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-28">
          <FilterSidebar />
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/90 backdrop-blur-md p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-foreground">Filter Opportunities</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded text-muted hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <FilterSidebar />
            <Button
              variant="primary"
              className="w-full mt-4"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        )}

        {/* Listings Section */}
        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <FranchiseCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-card bg-surface p-12 text-center border border-white/[0.08] space-y-3">
              <p className="text-sm text-red-400">Failed to retrieve franchise listings.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry Query
              </Button>
            </div>
          ) : data?.franchises && data.franchises.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.franchises.map((franchise) => (
                  <FranchiseCard key={franchise._id} franchise={franchise} />
                ))}
              </div>

              {/* Pagination Controls */}
              {data.totalPages > 1 && (
                <div className="pt-8 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="text-xs text-muted">
                    Showing <span className="font-medium text-foreground">{(page - 1) * 9 + 1}</span>{' '}
                    to{' '}
                    <span className="font-medium text-foreground">
                      {Math.min(page * 9, data.total)}
                    </span>{' '}
                    of <span className="font-medium text-foreground">{data.total}</span> brands
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="text-xs"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <span className="text-xs font-mono font-medium text-muted px-2">
                      Page {page} of {data.totalPages}
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="text-xs"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="rounded-card bg-surface p-12 text-center border border-white/[0.08] space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] text-muted flex items-center justify-center mx-auto">
                <Store className="w-8 h-8 text-muted/60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground font-display">
                  No Matching Opportunities Found
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Try adjusting your capital investment bracket, clearing the sector filter, or
                  broadening the location scope.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FranchiseMarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted">
          Loading Franchise Marketplace...
        </div>
      }
    >
      <FranchiseMarketplaceContent />
    </Suspense>
  );
}
