'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { INDUSTRIES, TOP_CITIES } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { RotateCcw, Filter, Check } from 'lucide-react';

const INVESTMENT_PRESETS = [
  { label: 'All Budgets', min: undefined, max: undefined },
  { label: 'Under ₹10 Lakhs', min: undefined, max: 1000000 },
  { label: '₹10L – ₹25 Lakhs', min: 1000000, max: 2500000 },
  { label: '₹25L – ₹50 Lakhs', min: 2500000, max: 5000000 },
  { label: '₹50L – ₹1 Crore', min: 5000000, max: 10000000 },
  { label: '₹1 Crore & Above', min: 10000000, max: undefined },
];

export default function FilterSidebar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read active query filters
  const selectedIndustry = searchParams.get('industry') || 'All';
  const minInvestment = searchParams.get('minInvestment') || '';
  const maxInvestment = searchParams.get('maxInvestment') || '';
  const selectedCity = searchParams.get('city') || 'All';
  const selectedRoi = searchParams.get('roiPeriod') || '';

  // Function to set / update single or multiple query params
  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'All') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    // Reset pagination to page 1 on filter alteration
    params.delete('page');

    router.push(`/franchises?${params.toString()}`, { scroll: false });
  };

  const resetAllFilters = () => {
    router.push('/franchises', { scroll: false });
  };

  // Determine current active investment preset
  const activePresetIndex = INVESTMENT_PRESETS.findIndex((preset) => {
    if (preset.min === undefined && preset.max === undefined) {
      return !minInvestment && !maxInvestment;
    }
    const matchMin = preset.min ? String(preset.min) === minInvestment : !minInvestment;
    const matchMax = preset.max ? String(preset.max) === maxInvestment : !maxInvestment;
    return matchMin && matchMax;
  });

  return (
    <aside
      className={`rounded-card bg-surface border border-white/[0.08] p-5 space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground font-display">
            Opportunity Filters
          </h2>
        </div>
        <button
          onClick={resetAllFilters}
          className="text-xs text-muted hover:text-primary flex items-center gap-1 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* 1. Industry Sector */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted font-medium block">
          Industry Sector
        </label>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => updateQuery({ industry: 'All' })}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-item text-xs font-medium transition-colors ${
              selectedIndustry === 'All'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted hover:text-foreground hover:bg-white/[0.03]'
            }`}
          >
            <span>All Sectors</span>
            {selectedIndustry === 'All' && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          {INDUSTRIES.map((ind) => {
            const isSelected = selectedIndustry.toLowerCase() === ind.toLowerCase();
            return (
              <button
                key={ind}
                onClick={() => updateQuery({ industry: ind })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-item text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted hover:text-foreground hover:bg-white/[0.03]'
                }`}
              >
                <span className="truncate">{ind}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Capital Investment Bracket */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <label className="text-xs font-mono uppercase tracking-wider text-muted font-medium block">
          Investment Bracket (INR)
        </label>
        <div className="space-y-1">
          {INVESTMENT_PRESETS.map((preset, index) => {
            const isSelected = activePresetIndex === index;
            return (
              <button
                key={preset.label}
                onClick={() =>
                  updateQuery({
                    minInvestment: preset.min ? String(preset.min) : undefined,
                    maxInvestment: preset.max ? String(preset.max) : undefined,
                  })
                }
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-item text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-muted hover:text-foreground hover:bg-white/[0.03]'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preferred City / Location */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <label className="text-xs font-mono uppercase tracking-wider text-muted font-medium block">
          Target City
        </label>
        <select
          value={selectedCity}
          onChange={(e) => updateQuery({ city: e.target.value })}
          className="w-full bg-surface-subtle text-foreground text-xs rounded-item border border-white/[0.08] px-3 py-2 focus:outline-none focus:border-primary"
        >
          <option value="All">All Indian Cities</option>
          {TOP_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Expected ROI Payback Period */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <label className="text-xs font-mono uppercase tracking-wider text-muted font-medium block">
          Maximum ROI Period
        </label>
        <select
          value={selectedRoi}
          onChange={(e) => updateQuery({ roiPeriod: e.target.value })}
          className="w-full bg-surface-subtle text-foreground text-xs rounded-item border border-white/[0.08] px-3 py-2 focus:outline-none focus:border-primary"
        >
          <option value="">Any Payback Period</option>
          <option value="12">Under 12 Months (Fast Recovery)</option>
          <option value="18">Within 18 Months</option>
          <option value="24">Within 24 Months</option>
        </select>
      </div>
    </aside>
  );
}
