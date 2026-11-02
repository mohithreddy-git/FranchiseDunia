'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import {
  User,
  Franchise,
  Event,
  BusinessForSale,
  Lead,
  SavedListing,
  EventRegistration,
  NdaAgreement,
  InvestorDashboardData,
  BrandOwnerDashboardData,
  BusinessSellerDashboardData,
  EventOrganizerDashboardData,
  AdminDashboardData,
} from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import BorderGlowCard from '@/components/animations/BorderGlowCard';
import { Modal } from '@/components/ui/Modal';
import {
  Building2,
  Calendar,
  Briefcase,
  Users,
  TrendingUp,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Shield,
  FileText,
  UserCheck,
  UserX,
  ExternalLink,
  Kanban,
  BarChart3,
  Bookmark,
  Clock,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role dashboard data states
  const [investorData, setInvestorData] = useState<InvestorDashboardData | null>(null);
  const [brandOwnerData, setBrandOwnerData] = useState<BrandOwnerDashboardData | null>(null);
  const [businessSellerData, setBusinessSellerData] = useState<BusinessSellerDashboardData | null>(null);
  const [eventOrganizerData, setEventOrganizerData] = useState<EventOrganizerDashboardData | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);

  // Admin moderation queue & user management
  const [pendingListings, setPendingListings] = useState<{
    franchises: Franchise[];
    events: Event[];
    businesses: BusinessForSale[];
    totalPending: number;
  } | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{
    type: 'franchise' | 'event' | 'business';
    id: string;
    title: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?returnTo=/dashboard');
      return;
    }

    if (user) {
      loadDashboardData(user);
    }
  }, [user, authLoading]);

  const loadDashboardData = async (currentUser: User) => {
    try {
      setLoading(true);
      setError(null);

      switch (currentUser.role) {
        case 'investor': {
          const data = await api.dashboards.investor();
          setInvestorData(data);
          break;
        }
        case 'brand_owner': {
          const data = await api.dashboards.brandOwner();
          setBrandOwnerData(data);
          break;
        }
        case 'business_seller': {
          const data = await api.dashboards.businessSeller();
          setBusinessSellerData(data);
          break;
        }
        case 'event_organizer': {
          const data = await api.dashboards.eventOrganizer();
          setEventOrganizerData(data);
          break;
        }
        case 'admin': {
          const [dashboardStats, pending, usersRes] = await Promise.all([
            api.dashboards.admin(),
            api.admin.getPendingListings(),
            api.admin.getUsers({ limit: 50 }),
          ]);
          setAdminData(dashboardStats);
          setPendingListings(pending);
          setAdminUsers(usersRes.users);
          break;
        }
      }
    } catch (err: any) {
      console.error('Dashboard data load error:', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Admin approve listing
  const handleApproveListing = async (type: 'franchise' | 'event' | 'business', id: string) => {
    try {
      setActionLoading(true);
      await api.admin.updateListingStatus(type, id, 'approved');
      if (user) await loadDashboardData(user);
    } catch (err: any) {
      alert(err?.message || 'Failed to approve listing');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin reject listing with reason
  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      await api.admin.updateListingStatus(
        rejectTarget.type,
        rejectTarget.id,
        'rejected',
        rejectionReason.trim()
      );
      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectionReason('');
      if (user) await loadDashboardData(user);
    } catch (err: any) {
      alert(err?.message || 'Failed to reject listing');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin toggle user active
  const handleToggleUserActive = async (targetUser: User) => {
    const targetUserId = targetUser._id || targetUser.id;
    const currentUserId = user?._id || user?.id;
    if (targetUserId === currentUserId) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const newStatus = !targetUser.isActive;
    const confirmMsg = newStatus
      ? `Reactivate account for ${targetUser.email}?`
      : `Deactivate ${targetUser.email}? This will immediately revoke their sessions and reject access.`;
    if (!confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      await api.admin.toggleUserActive(targetUserId, newStatus);
      if (user) await loadDashboardData(user);
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle user status');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-item" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-item" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 max-w-xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-display text-foreground mb-2">Dashboard Error</h2>
        <p className="text-sm text-muted mb-6">{error}</p>
        <Button onClick={() => user && loadDashboardData(user)}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <Badge variant="emerald" size="sm" className="capitalize">
              {user?.role.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            {user?.email} · Manage your opportunities, pipelines, applications, and network activity.
          </p>
        </div>

        {/* Quick role-specific CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          {user?.role === 'brand_owner' && (
            <Link href="/leads">
              <Button size="sm" className="flex items-center gap-1.5">
                <Kanban className="w-4 h-4" />
                <span>Leads Kanban</span>
              </Button>
            </Link>
          )}
          {user?.role === 'investor' && (
            <Link href="/inquiries">
              <Button size="sm" className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>My Inquiries</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* VIEW 1: INVESTOR */}
      {user?.role === 'investor' && investorData && (
        <div className="space-y-8">
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" /> Inquiries
              </div>
              <div className="text-2xl font-bold font-display text-foreground">
                {investorData.inquiries?.length || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-rose-500" /> Saved Listings
              </div>
              <div className="text-2xl font-bold font-display text-foreground">
                {investorData.savedListings?.length || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Confirmed RSVPs
              </div>
              <div className="text-2xl font-bold font-display text-foreground">
                {investorData.rsvps?.length || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Executed NDAs
              </div>
              <div className="text-2xl font-bold font-display text-foreground">
                {investorData.ndas?.length || 0}
              </div>
            </BorderGlowCard>
          </div>

          {/* Recent Inquiries Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Recent Inquiries</h2>
              <Link href="/inquiries" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all inquiries <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {investorData.inquiries?.length === 0 ? (
              <div className="p-6 text-center bg-surface-subtle rounded-item border border-white/[0.06] text-xs text-muted">
                No inquiries submitted yet. Explore the marketplace to connect with franchise brands.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investorData.inquiries.slice(0, 4).map((inq: any) => (
                  <BorderGlowCard key={inq._id} className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {inq.targetId?.name || inq.targetId?.title || inq.targetType}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">
                        Status: <span className="text-primary font-medium">{inq.status}</span> · Budget: {inq.investmentBudget}
                      </p>
                    </div>
                    <Link href="/inquiries">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Open Thread
                      </Button>
                    </Link>
                  </BorderGlowCard>
                ))}
              </div>
            )}
          </div>

          {/* Registered Events */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display text-foreground">Upcoming Registered Events</h2>
            {investorData.rsvps?.length === 0 ? (
              <div className="p-6 text-center bg-surface-subtle rounded-item border border-white/[0.06] text-xs text-muted">
                No event registrations found. Browse upcoming expos and summits in the Events Hub.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investorData.rsvps.map((reg: any) => (
                  <BorderGlowCard key={reg._id} className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{reg.event?.title}</h4>
                      <p className="text-xs text-muted mt-0.5">
                        {reg.event?.city} · {new Date(reg.event?.startDate).toLocaleDateString('en-IN')}
                      </p>
                      <div className="mt-2 text-[11px] font-mono text-emerald-400">
                        Ticket Code: {reg.ticketCode}
                      </div>
                    </div>
                    {reg.event?.slug && (
                      <a
                        href={api.events.getIcsUrl(reg.event.slug)}
                        download
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> ICS
                      </a>
                    )}
                  </BorderGlowCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: BRAND OWNER */}
      {user?.role === 'brand_owner' && brandOwnerData && (
        <div className="space-y-8">
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Total Pipeline Leads</div>
              <div className="text-2xl font-bold font-display text-foreground">
                {brandOwnerData.leadsSummary?.total || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">New Leads (7d)</div>
              <div className="text-2xl font-bold font-display text-emerald-400">
                +{brandOwnerData.leadsSummary?.newThisWeek || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Avg Lead Score</div>
              <div className="text-2xl font-bold font-display text-primary">
                {brandOwnerData.leadsSummary?.avgScore || 0}/100
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Brochure Downloads</div>
              <div className="text-2xl font-bold font-display text-foreground">
                {brandOwnerData.brochuresSummary?.totalDownloads || 0}
              </div>
            </BorderGlowCard>
          </div>

          {/* Pipeline Breakdown */}
          <div className="bg-surface-subtle p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-foreground">Pipeline Overview</h3>
                <p className="text-xs text-muted">Current lead volume distribution across stages</p>
              </div>
              <Link href="/leads">
                <Button size="sm" variant="primary" className="text-xs flex items-center gap-1.5">
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Open Interactive Board</span>
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {[
                { label: 'New', count: brandOwnerData.leadsSummary?.pipelineCounts?.new || 0, color: 'text-blue-400' },
                { label: 'Under Review', count: brandOwnerData.leadsSummary?.pipelineCounts?.under_review || 0, color: 'text-amber-400' },
                { label: 'Contacted', count: brandOwnerData.leadsSummary?.pipelineCounts?.contacted || 0, color: 'text-emerald-400' },
                { label: 'Converted', count: brandOwnerData.leadsSummary?.pipelineCounts?.converted || 0, color: 'text-emerald-500 font-bold' },
                { label: 'Closed', count: brandOwnerData.leadsSummary?.pipelineCounts?.rejected || 0, color: 'text-rose-400' },
              ].map((stage) => (
                <div key={stage.label} className="p-3 bg-surface-card rounded-item border border-white/[0.04] text-center">
                  <div className="text-xs text-muted mb-1">{stage.label}</div>
                  <div className={`text-xl font-bold font-display ${stage.color}`}>{stage.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* My Brand Listings */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-display text-foreground">My Franchise Listings</h3>
            <div className="space-y-3">
              {brandOwnerData.franchises?.map((fr: any) => (
                <BorderGlowCard key={fr._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">{fr.name}</h4>
                      <Badge
                        variant={fr.status === 'approved' ? 'emerald' : fr.status === 'pending' ? 'amber' : 'rose'}
                        size="sm"
                      >
                        {fr.status}
                      </Badge>
                      {fr.isSampleData && <Badge variant="slate" size="sm">Sample</Badge>}
                    </div>
                    <p className="text-xs text-muted">
                      {fr.industry} · Royalty: {fr.royaltyPercent}% · Space: {fr.spaceMinSqFt} sq ft
                    </p>
                  </div>
                  <Link href={`/franchises/${fr.slug}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Page <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </BorderGlowCard>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: BUSINESS SELLER */}
      {user?.role === 'business_seller' && businessSellerData && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Listings Created</div>
              <div className="text-2xl font-bold font-display text-foreground">
                {businessSellerData.businesses?.length || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">NDAs Executed</div>
              <div className="text-2xl font-bold font-display text-amber-400">
                {businessSellerData.executedNdas?.length || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Acquisition Inquiries</div>
              <div className="text-2xl font-bold font-display text-primary">
                {businessSellerData.inquiries?.length || 0}
              </div>
            </BorderGlowCard>
          </div>

          {/* Executed NDAs Log */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-display text-foreground">Executed NDAs & Disclosures</h3>
            {businessSellerData.executedNdas?.length === 0 ? (
              <div className="p-6 text-center bg-surface-subtle rounded-item border border-white/[0.06] text-xs text-muted">
                No NDAs signed yet by prospective buyers.
              </div>
            ) : (
              <div className="space-y-3">
                {businessSellerData.executedNdas.map((nda: any) => (
                  <BorderGlowCard key={nda._id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {nda.signedName} ({nda.user?.email})
                      </h4>
                      <p className="text-xs text-muted mt-0.5">
                        Opportunity: {nda.business?.title} · Version: {nda.agreementVersion}
                      </p>
                    </div>
                    <div className="text-xs text-muted font-mono">
                      {new Date(nda.signedAt).toLocaleDateString('en-IN')}
                    </div>
                  </BorderGlowCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: EVENT ORGANIZER */}
      {user?.role === 'event_organizer' && eventOrganizerData && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Hosted Expos & Summits</div>
              <div className="text-2xl font-bold font-display text-foreground">
                {eventOrganizerData.totalEvents || 0}
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Confirmed Delegate RSVPs</div>
              <div className="text-2xl font-bold font-display text-emerald-400">
                {eventOrganizerData.totalRegistrations || 0}
              </div>
            </BorderGlowCard>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold font-display text-foreground">Organized Events</h3>
            <div className="space-y-3">
              {eventOrganizerData.events?.map((ev: any) => {
                const occupancy = Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100));
                return (
                  <BorderGlowCard key={ev._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-foreground">{ev.title}</h4>
                        <Badge variant={ev.status === 'approved' ? 'emerald' : 'amber'} size="sm">
                          {ev.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted">
                        {ev.city} · {new Date(ev.startDate).toLocaleDateString('en-IN')} · {ev.registeredCount}/{ev.capacity} registered ({occupancy}%)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={api.events.getAttendeesCsvUrl(ev._id)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-subtle hover:bg-white/[0.08] text-foreground text-xs font-medium rounded-item border border-white/[0.08] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </a>
                      <Link href={`/events/${ev.slug}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View Event
                        </Button>
                      </Link>
                    </div>
                  </BorderGlowCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: ADMIN PLATFORM PORTAL */}
      {user?.role === 'admin' && adminData && (
        <div className="space-y-10">
          {/* Admin KPI stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Franchise Listings</div>
              <div className="text-2xl font-bold font-display text-foreground">
                Approved: {adminData.franchisesByStatus?.approved || 0}
                <span className="text-amber-400 text-sm ml-2 font-normal">
                  ({adminData.franchisesByStatus?.pending || 0} pending)
                </span>
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Events</div>
              <div className="text-2xl font-bold font-display text-foreground">
                Approved: {adminData.eventsByStatus?.approved || 0}
                <span className="text-amber-400 text-sm ml-2 font-normal">
                  ({adminData.eventsByStatus?.pending || 0} pending)
                </span>
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Business Opportunities</div>
              <div className="text-2xl font-bold font-display text-foreground">
                Approved: {adminData.businessesByStatus?.approved || 0}
                <span className="text-amber-400 text-sm ml-2 font-normal">
                  ({adminData.businessesByStatus?.pending || 0} pending)
                </span>
              </div>
            </BorderGlowCard>
            <BorderGlowCard className="p-4">
              <div className="text-xs text-muted mb-1">Platform Leads (7d)</div>
              <div className="text-2xl font-bold font-display text-primary">
                +{adminData.leadsThisWeek || 0}
              </div>
            </BorderGlowCard>
          </div>

          {/* Moderation Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-foreground">Moderation Queue</h3>
                <p className="text-xs text-muted">
                  {pendingListings?.totalPending || 0} pending opportunities awaiting compliance review
                </p>
              </div>
            </div>

            {pendingListings?.totalPending === 0 ? (
              <div className="p-8 text-center bg-surface-subtle rounded-item border border-white/[0.06] text-xs text-muted">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                Moderation queue is clean. No pending listings require review.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pending Franchises */}
                {pendingListings?.franchises?.map((item) => (
                  <BorderGlowCard key={item._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="amber" size="sm">Franchise Review</Badge>
                        <h4 className="font-semibold text-sm text-foreground">{item.name}</h4>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Industry: {item.industry} · Cap: {item.investmentMin}-{item.investmentMax} · Royalty: {item.royaltyPercent}%
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoading}
                        onClick={() => handleApproveListing('franchise', item._id)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => {
                          setRejectTarget({ type: 'franchise', id: item._id, title: item.name });
                          setRejectionReason('');
                          setRejectModalOpen(true);
                        }}
                        className="text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                      >
                        Reject...
                      </Button>
                    </div>
                  </BorderGlowCard>
                ))}

                {/* Pending Events */}
                {pendingListings?.events?.map((item) => (
                  <BorderGlowCard key={item._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="blue" size="sm">Event Review</Badge>
                        <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {item.venue}, {item.city} · Date: {new Date(item.startDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoading}
                        onClick={() => handleApproveListing('event', item._id)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => {
                          setRejectTarget({ type: 'event', id: item._id, title: item.title });
                          setRejectionReason('');
                          setRejectModalOpen(true);
                        }}
                        className="text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                      >
                        Reject...
                      </Button>
                    </div>
                  </BorderGlowCard>
                ))}

                {/* Pending Businesses */}
                {pendingListings?.businesses?.map((item) => (
                  <BorderGlowCard key={item._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="slate" size="sm">Business Review</Badge>
                        <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Type: {item.listingType} · Revenue: {item.revenueBand} · Asking: {item.askingPriceBand}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoading}
                        onClick={() => handleApproveListing('business', item._id)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => {
                          setRejectTarget({ type: 'business', id: item._id, title: item.title });
                          setRejectionReason('');
                          setRejectModalOpen(true);
                        }}
                        className="text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                      >
                        Reject...
                      </Button>
                    </div>
                  </BorderGlowCard>
                ))}
              </div>
            )}
          </div>

          {/* User Management Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-foreground">User Management</h3>
            <div className="bg-surface-subtle rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                      <th className="p-3 text-muted uppercase font-mono font-medium">Name</th>
                      <th className="p-3 text-muted uppercase font-mono font-medium">Email</th>
                      <th className="p-3 text-muted uppercase font-mono font-medium">Role</th>
                      <th className="p-3 text-muted uppercase font-mono font-medium">Status</th>
                      <th className="p-3 text-muted uppercase font-mono font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {adminUsers.map((u) => {
                      const uId = u._id || u.id;
                      const isSelf = uId === (user?._id || user?.id);
                      return (
                        <tr key={uId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 font-semibold text-foreground">{u.name}</td>
                          <td className="p-3 text-muted font-mono">{u.email}</td>
                          <td className="p-3">
                            <span className="capitalize px-2 py-0.5 rounded-pill bg-white/[0.04] text-foreground border border-white/[0.06]">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            {u.isActive !== false ? (
                              <Badge variant="emerald" size="sm">Active</Badge>
                            ) : (
                              <Badge variant="rose" size="sm">Deactivated</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isSelf || actionLoading}
                              onClick={() => handleToggleUserActive(u)}
                              className={`text-xs ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed'
                                  : u.isActive !== false
                                  ? 'text-rose-400 hover:text-rose-300'
                                  : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                            >
                              {isSelf ? 'Current User' : u.isActive !== false ? 'Deactivate' : 'Reactivate'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
        }}
        title={`Reject ${rejectTarget?.type}: ${rejectTarget?.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">
            In compliance with platform transparency rules, a clear, non-empty rejection reason is required. This will be stored with the listing and displayed to the creator.
          </p>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Space minimum square footage contradicts franchise disclosure document, or unverifiable claims."
              rows={4}
              className="w-full rounded-item bg-surface-subtle border border-white/[0.1] p-3 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!rejectionReason.trim() || actionLoading}
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-500"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
