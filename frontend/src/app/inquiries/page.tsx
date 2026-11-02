'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Lead, LeadStatus } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import BorderGlowCard from '@/components/animations/BorderGlowCard';
import LeadDrawer from '@/components/leads/LeadDrawer';
import {
  MessageSquare,
  Building2,
  Briefcase,
  Clock,
  ArrowUpRight,
  Inbox,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const STATUS_VARIANTS: Record<LeadStatus, { label: string; variant: 'blue' | 'amber' | 'emerald' | 'rose' | 'slate' }> = {
  new: { label: 'Submitted', variant: 'blue' },
  under_review: { label: 'Under Review', variant: 'amber' },
  contacted: { label: 'In Discussion', variant: 'emerald' },
  converted: { label: 'Finalized', variant: 'emerald' },
  rejected: { label: 'Closed / Not Fit', variant: 'rose' },
};

export default function InvestorInquiriesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { limit: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await api.leads.myInquiries(params);
      setLeads(res.leads);
    } catch (err: any) {
      console.error('Failed to load inquiries:', err);
      setError(err?.message || 'Could not load your inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?returnTo=/inquiries');
      return;
    }
    if (user) {
      fetchInquiries();
    }
  }, [user, authLoading, statusFilter]);

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads((prev) => prev.map((l) => (l._id === updatedLead._id ? updatedLead : l)));
    setSelectedLead(updatedLead);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">
            My Inquiries & Applications
          </h1>
          <p className="text-sm text-muted mt-1">
            Track inquiries submitted to franchise brands and business sellers, message directly, and monitor status.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {[
            { value: 'all', label: 'All Inquiries' },
            { value: 'new', label: 'Submitted' },
            { value: 'under_review', label: 'Reviewing' },
            { value: 'contacted', label: 'In Discussion' },
            { value: 'converted', label: 'Finalized' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-item transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-primary text-background font-semibold'
                  : 'bg-surface-subtle text-muted hover:text-foreground border border-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {error && (
        <div className="p-4 mb-6 rounded-item bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-item" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 bg-surface-subtle rounded-2xl border border-white/[0.06] p-8">
          <Inbox className="w-12 h-12 text-muted/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground font-display">No inquiries found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-6">
            You haven&apos;t submitted any inquiries yet or none match your selected status filter.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/franchises">
              <Button size="sm">Explore Franchises</Button>
            </Link>
            <Link href="/business-for-sale">
              <Button variant="outline" size="sm">Explore Businesses</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => {
            const isFranchise = lead.targetType === 'franchise';
            const target = lead.targetId as any;
            const targetTitle = target?.name || target?.title || (isFranchise ? 'Franchise Opportunity' : 'Business Opportunity');
            const statusConfig = STATUS_VARIANTS[lead.status] || { label: lead.status, variant: 'slate' };

            return (
              <BorderGlowCard
                key={lead._id}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-item bg-surface-subtle border border-white/[0.1] flex items-center justify-center shrink-0">
                    {isFranchise ? (
                      <Building2 className="w-6 h-6 text-primary" />
                    ) : (
                      <Briefcase className="w-6 h-6 text-amber-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground font-display group-hover:text-primary transition-colors">
                        {targetTitle}
                      </h3>
                      <Badge variant={statusConfig.variant} size="sm">
                        {statusConfig.label}
                      </Badge>
                      <span className="text-[11px] uppercase tracking-wider text-muted font-mono bg-white/[0.04] px-2 py-0.5 rounded-pill border border-white/[0.06]">
                        {lead.targetType}
                      </span>
                    </div>

                    <p className="text-xs text-muted line-clamp-1">
                      {lead.message || 'No initial message attached.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <TrendingUp className="w-3.5 h-3.5 text-primary/70" />
                        Budget: {lead.investmentBudget}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted/70" />
                        Submitted: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                  {target?.slug && (
                    <Link href={isFranchise ? `/franchises/${target.slug}` : `/business-for-sale/${target._id || lead.targetId}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <span>Listing</span>
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setSelectedLead(lead)}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Conversation</span>
                  </Button>
                </div>
              </BorderGlowCard>
            );
          })}
        </div>
      )}

      {/* Slide-over Conversation Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          currentUser={user}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleLeadUpdate}
        />
      )}
    </div>
  );
}
