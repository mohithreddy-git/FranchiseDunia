'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Franchise } from '@/types';
import { formatCompactINR } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import BorderGlowCard from '@/components/animations/BorderGlowCard';
import HoverLift from '@/components/animations/HoverLift';
import InquiryModal from '@/components/shared/InquiryModal';
import SaveButton from '@/components/shared/SaveButton';
import {
  TrendingUp,
  Maximize2,
  Clock,
  ArrowUpRight,
  Store,
  MapPin,
} from 'lucide-react';

interface FranchiseCardProps {
  franchise: Franchise;
}

export default function FranchiseCard({ franchise }: FranchiseCardProps) {
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  return (
    <>
      <HoverLift yOffset={-4}>
        <BorderGlowCard className="flex flex-col justify-between h-full group p-5">
          <div>
            {/* Top Row: Logo, Badges & Industry */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-item bg-surface-subtle border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
                  {franchise.logoUrl ? (
                    <Image
                      src={franchise.logoUrl}
                      alt={franchise.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground font-display group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {franchise.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted font-medium">
                      {franchise.industry}
                    </span>
                    {franchise.isVerified && <Badge variant="verified" size="sm">Verified</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {franchise.isFeatured && (
                  <Badge variant="featured" size="sm">Featured</Badge>
                )}
                <SaveButton
                  targetType="franchise"
                  targetId={franchise._id}
                  initialSaved={franchise.isSaved}
                  size="sm"
                />
              </div>
            </div>

            {/* Sample listing badge (carry-over fix: seed uses fictional brands) */}
            {franchise.isSampleData && (
              <div className="mb-3">
                <Badge variant="amber" size="sm">
                  Sample listing
                </Badge>
              </div>
            )}

            {/* Tagline */}
            <p className="text-xs text-muted line-clamp-2 min-h-[32px] mb-4 leading-relaxed">
              {franchise.tagline || franchise.description}
            </p>

            {/* Investment Box (Fintech Highlight) */}
            <div className="bg-surface-subtle/80 rounded-item p-3.5 border border-white/[0.06] mb-4">
              <div className="text-[11px] uppercase tracking-wider text-muted font-mono mb-1">
                Required Capital Outlay
              </div>
              <div className="text-lg font-bold text-foreground font-display flex items-baseline gap-1.5">
                <span className="text-primary font-mono">
                  {formatCompactINR(franchise.investmentMin)}
                </span>
                <span className="text-xs text-muted font-normal">to</span>
                <span className="text-primary font-mono">
                  {formatCompactINR(franchise.investmentMax)}
                </span>
              </div>
            </div>

            {/* Unit Economics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/[0.06] mb-4 text-center">
              <div>
                <div className="flex items-center justify-center text-muted mb-0.5">
                  <Maximize2 className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] uppercase font-mono">Space</span>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {franchise.spaceMinSqFt} sq ft
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center text-muted mb-0.5">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] uppercase font-mono">ROI</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">
                  {franchise.roiPeriodMonths} Mos
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center text-muted mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] uppercase font-mono">Royalty</span>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {franchise.royaltyPercent ? `${franchise.royaltyPercent}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Location Tag */}
            <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
              <MapPin className="w-3.5 h-3.5 text-muted/70 shrink-0" />
              <span className="truncate">
                {franchise.availableLocations?.slice(0, 3).join(', ') || 'Pan-India'}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-2 pt-2">
            <Link href={`/franchises/${franchise.slug}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInquiryModalOpen(true)}
              className="text-xs"
            >
              Inquire
            </Button>
          </div>
        </BorderGlowCard>
      </HoverLift>

      {/* Direct Connect Inquiry Modal */}
      <InquiryModal
        franchise={franchise}
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />
    </>
  );
}
