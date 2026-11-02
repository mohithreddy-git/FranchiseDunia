'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Lead, LeadStatus, PipelineCounts } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import LeadDrawer from '@/components/leads/LeadDrawer';
import {
  LayoutList,
  Kanban,
  Filter,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const PIPELINE_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New Inquiries', color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'under_review', label: 'Under Review', color: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'contacted', label: 'Contacted', color: 'border-purple-500/30 bg-purple-500/5' },
  { id: 'converted', label: 'Converted', color: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'rejected', label: 'Rejected', color: 'border-red-500/30 bg-red-500/5' },
];

export default function LeadsPipelinePage() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<PipelineCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const fetchLeadsData = async () => {
    setLoading(true);
    try {
      const [leadsRes, countsRes] = await Promise.all([
        api.leads.list({ status: statusFilter !== 'All' ? statusFilter : undefined, limit: 50 }),
        api.leads.getPipelineCounts(),
      ]);
      setLeads(leadsRes.leads);
      setCounts(countsRes.counts);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, [statusFilter]);

  // Status transition with optimistic update and rollback on 409
  const handleMoveStatus = async (leadId: string, newStatus: LeadStatus) => {
    const originalLeads = [...leads];
    const targetLead = leads.find((l) => l._id === leadId);
    if (!targetLead || targetLead.status === newStatus) return;

    // Optimistic Update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
    );
    setLiveAnnouncement(`Lead for ${targetLead.fullName} moved to ${newStatus.replace('_', ' ')}.`);

    try {
      const res = await api.leads.updateStatus(leadId, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? res.lead : l))
      );
      if (selectedLead?._id === leadId) setSelectedLead(res.lead);
    } catch (err: any) {
      // Rollback on 409 Conflict
      setLeads(originalLeads);
      const msg = err.data?.allowedTransitions
        ? `Cannot move to ${newStatus}. Allowed next: ${err.data.allowedTransitions.join(', ')}`
        : err.message || 'Status transition rejected.';
      setLiveAnnouncement(msg);
      alert(msg);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* a11y Live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Badge variant="emerald" size="sm" className="mb-2">Lead Pipeline Management</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Franchise & M&A Inquiries
          </h1>
          <p className="text-xs text-muted mt-1">
            Track applicants, filter by AI-calculated fit scores, and manage conversation threads.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-subtle border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-primary text-black'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-primary text-black'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline KPI Ribbon */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="p-3.5 rounded-xl bg-surface border border-white/[0.08]">
            <div className="text-[10px] uppercase font-mono text-muted mb-1">Total Leads</div>
            <div className="text-xl font-bold font-mono text-foreground">{counts.total}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface border border-white/[0.08]">
            <div className="text-[10px] uppercase font-mono text-muted mb-1">Avg Lead Score</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{counts.avgScore} / 100</div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-[10px] uppercase font-mono text-blue-300 mb-1">New</div>
            <div className="text-xl font-bold font-mono text-blue-400">{counts.new}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-[10px] uppercase font-mono text-amber-300 mb-1">Under Review</div>
            <div className="text-xl font-bold font-mono text-amber-400">{counts.under_review}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="text-[10px] uppercase font-mono text-purple-300 mb-1">Contacted</div>
            <div className="text-xl font-bold font-mono text-purple-400">{counts.contacted}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[10px] uppercase font-mono text-emerald-300 mb-1">Converted</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{counts.converted}</div>
          </div>
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {PIPELINE_COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.id);

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl border ${col.color} p-4 min-w-[240px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                  <span className="text-xs font-bold font-display text-foreground">{col.label}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-muted">
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colLeads.map((lead) => (
                    <div
                      key={lead._id}
                      className="p-3.5 rounded-xl bg-surface border border-white/[0.08] hover:border-primary/40 transition-all shadow-sm group space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                          {lead.fullName}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {lead.leadScore} pts
                        </span>
                      </div>

                      <p className="text-[11px] text-muted line-clamp-1">
                        {lead.targetId?.name || lead.targetId?.title || 'Listing Opportunity'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-white/[0.04]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {lead.targetCity}
                        </span>
                        <span className="font-mono text-foreground font-semibold">
                          ₹{(lead.investmentBudget / 100000).toFixed(1)}L
                        </span>
                      </div>

                      {/* Accessible 'Move to...' select control */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <select
                          aria-label={`Move ${lead.fullName} to another stage`}
                          value={lead.status}
                          onChange={(e) => handleMoveStatus(lead._id, e.target.value as LeadStatus)}
                          className="bg-surface-subtle text-foreground text-[10px] rounded-lg border border-white/[0.08] px-2 py-1 focus:outline-none focus:border-primary"
                        >
                          <option value="new">Move: New</option>
                          <option value="under_review">Move: Under Review</option>
                          <option value="contacted">Move: Contacted</option>
                          <option value="converted">Move: Converted</option>
                          <option value="rejected">Move: Rejected</option>
                        </select>

                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-[11px] text-primary hover:underline font-medium inline-flex items-center"
                        >
                          Chat & Details <ChevronRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="text-center py-8 text-muted/50 text-[11px]">
                      No leads in this stage.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle border-b border-white/[0.08] text-muted uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Applicant</th>
                <th className="p-4">Opportunity</th>
                <th className="p-4">Score</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Territory</th>
                <th className="p-4">Stage</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {leads.map((l) => (
                <tr key={l._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-semibold text-foreground">{l.fullName}</td>
                  <td className="p-4 text-muted">{l.targetId?.name || l.targetId?.title || 'Listing'}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">{l.leadScore}</td>
                  <td className="p-4 font-mono text-foreground">₹{(l.investmentBudget / 100000).toFixed(1)}L</td>
                  <td className="p-4 text-muted">{l.targetCity}</td>
                  <td className="p-4">
                    <Badge variant="emerald" size="sm">{l.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedLead(l)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Lead Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          currentUser={user}
          onClose={() => setSelectedLead(null)}
          onStatusChange={(updated) => {
            setLeads((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
            setSelectedLead(updated);
          }}
        />
      )}
    </main>
  );
}
