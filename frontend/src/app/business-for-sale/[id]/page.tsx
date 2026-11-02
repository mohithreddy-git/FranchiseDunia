'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BusinessForSale, BusinessListingType } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactINR } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Building2,
  MapPin,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Scale,
  PhoneCall,
  Mail,
  UserCheck,
} from 'lucide-react';

interface NdaModalProps {
  business: BusinessForSale;
  onClose: () => void;
  onSuccess: () => void;
}

function NdaModal({ business, onClose, onSuccess }: NdaModalProps) {
  const [signedName, setSignedName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedName.trim()) {
      setError('Please type your legal full name.');
      return;
    }
    if (!accepted) {
      setError('You must accept the terms of the Non-Disclosure Agreement.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.businessForSale.signNda(business._id || business.id, {
        signedName: signedName.trim(),
        accepted: true,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as Error & { statusCode?: number };
      if (e.statusCode === 401) {
        setError('Please log in first to sign an NDA and unlock confidential records.');
      } else {
        setError(e.message || 'Failed to sign NDA. Please check your submission.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-surface border border-white/[0.1] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-foreground">
                Digital Non-Disclosure Agreement
              </h2>
              <p className="text-xs text-muted">Legal confidentiality disclosure (v1.0)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-sm font-medium px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Scrollable NDA Agreement Text */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-muted leading-relaxed max-h-[280px] bg-surface-subtle/50 border-b border-white/[0.08]">
          <p className="font-semibold text-foreground">
            CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT FOR OPPORTUNITY: {business.title}
          </p>
          <p>
            This Non-Disclosure Agreement (&ldquo;Agreement&rdquo;) is entered into by the undersigned
            Recipient in favor of the Listing Seller and FranchiseDunia.
          </p>
          <p>
            <strong>1. Purpose:</strong> The Seller intends to disclose proprietary business information,
            un-audited/audited financial books, exact branch locations, and business vendor metrics for the sole purpose of
            evaluating an acquisition, partnership, or equity investment in this commercial entity.
          </p>
          <p>
            <strong>2. Confidential Information:</strong> &ldquo;Confidential Information&rdquo; encompasses all
            undisclosed financial statements, exact turnover figures, EBITDA reports, leases, employee counts, vendor
            identities, client concentrations, and commercial lease addresses disclosed herein.
          </p>
          <p>
            <strong>3. Non-Circumvention:</strong> The Recipient covenants that they shall not directly contact the
            business employees, landlord, suppliers, or customers of the enterprise without written permission from the
            authorized representative.
          </p>
          <p>
            <strong>4. Digital Audit Log:</strong> By checking the acknowledgment below and submitting their legal name,
            the Recipient agrees that an immutable cryptographic audit record comprising their IP address, user identifier,
            and timestamp will be recorded.
          </p>
        </div>

        {/* Signing Form */}
        <form onSubmit={handleSign} className="p-5 space-y-4 bg-surface">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="accept-nda"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-surface-subtle text-amber-500 focus:ring-amber-500/30"
            />
            <label htmlFor="accept-nda" className="text-xs text-muted cursor-pointer select-none">
              I have read, understood, and accept the terms of this Confidentiality Agreement. I agree that my digital signature constitutes a binding legal agreement.
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Full Legal Name (Electronic Signature)
            </label>
            <Input
              type="text"
              placeholder="e.g. Aditya Vikram Singhania"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black border-amber-400 font-semibold"
              disabled={submitting}
            >
              {submitting ? 'Authenticating & Unlocking...' : 'Sign & Reveal Financials'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [business, setBusiness] = useState<BusinessForSale | null>(null);
  const [ndaSigned, setNdaSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await api.businessForSale.getById(id);
      setBusiness(result.business);
      setNdaSigned(result.ndaSigned);
    } catch {
      setError('Business listing not found or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleNdaSuccess = async () => {
    setIsNdaModalOpen(false);
    await fetchDetail();
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-muted/40 mx-auto" />
        <p className="text-muted">{error || 'Opportunity not found.'}</p>
        <Link href="/business-for-sale">
          <Button variant="secondary" size="sm">← Back to Business Listings</Button>
        </Link>
      </main>
    );
  }

  const listingTypeLabels: Record<BusinessListingType, string> = {
    sale: 'Full Business Acquisition',
    joint_venture: 'Joint Venture Opportunity',
    equity_stake: 'Strategic Equity Stake',
    partnership: 'Operational Partnership',
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Back Button */}
      <Link
        href="/business-for-sale"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Business Directory
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="amber" size="sm">
            {listingTypeLabels[business.listingType] || business.listingType}
          </Badge>
          <span className="text-xs font-medium text-muted bg-white/[0.04] px-2.5 py-0.5 rounded-pill border border-white/[0.06]">
            {business.industry}
          </span>
          {business.isSampleData && <Badge variant="slate" size="sm">Sample Listing</Badge>}
          {ndaSigned && (
            <Badge variant="verified" size="sm">
              <ShieldCheck className="w-3.5 h-3.5" /> NDA Executed
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground mb-3">
          {business.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary/70" />
            <span>{business.region}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary/70" />
            <span>Established in {business.establishedYear}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary/70" />
            <span>{business.employeeCountBand} Employees</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary & Protected Financials */}
        <div className="lg:col-span-2 space-y-8">
          {/* Executive Teaser Summary */}
          <section className="bg-surface border border-white/[0.08] rounded-xl p-5 space-y-3">
            <h2 className="text-base font-bold font-display text-foreground">Executive Overview</h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{business.summary}</p>
          </section>

          {/* Public Financial Ranges */}
          <section className="bg-surface border border-white/[0.08] rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold font-display text-foreground">Indicative Financial Parameters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-subtle p-3.5 rounded-lg border border-white/[0.06]">
                <div className="text-[10px] uppercase font-mono text-muted mb-1">Revenue Range</div>
                <div className="text-sm font-semibold text-foreground">{business.revenueBand}</div>
              </div>
              <div className="bg-surface-subtle p-3.5 rounded-lg border border-white/[0.06]">
                <div className="text-[10px] uppercase font-mono text-muted mb-1">EBITDA / Profit Range</div>
                <div className="text-sm font-semibold text-emerald-400">{business.profitBand}</div>
              </div>
              <div className="bg-surface-subtle p-3.5 rounded-lg border border-white/[0.06]">
                <div className="text-[10px] uppercase font-mono text-muted mb-1">Asking Valuation Band</div>
                <div className="text-sm font-semibold text-primary">{business.askingPriceBand}</div>
              </div>
            </div>
          </section>

          {/* GATED SECTION: Protected Financials Dashboard */}
          <section className="relative">
            {ndaSigned && business.protectedFinancials ? (
              /* UNLOCKED CONFIDENTIAL DASHBOARD */
              <div className="bg-surface border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Unlock className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold font-display text-foreground">
                        Confidential Verified Records
                      </h2>
                      <p className="text-xs text-emerald-400">Unlocked under active Non-Disclosure Agreement</p>
                    </div>
                  </div>
                  <Badge variant="verified" size="sm">Confidential</Badge>
                </div>

                {/* Exact Verified Figures */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface-subtle p-4 rounded-xl border border-white/[0.08]">
                    <div className="text-xs text-muted mb-1 font-mono">Exact Annual Revenue (FY25)</div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {formatCompactINR(business.protectedFinancials.exactRevenue)}
                    </div>
                  </div>
                  <div className="bg-surface-subtle p-4 rounded-xl border border-white/[0.08]">
                    <div className="text-xs text-muted mb-1 font-mono">Exact Net Profit (EBITDA)</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {formatCompactINR(business.protectedFinancials.exactNetProfit)}
                    </div>
                  </div>
                </div>

                {/* Exact Facility Address */}
                {business.protectedFinancials.exactAddress && (
                  <div className="bg-surface-subtle p-4 rounded-xl border border-white/[0.08] space-y-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> Physical Site & Legal Address
                    </div>
                    <p className="text-xs text-muted">{business.protectedFinancials.exactAddress}</p>
                  </div>
                )}

                {/* Balance Sheet & Asset Ledger Summary */}
                {business.protectedFinancials.balanceSheetSummary && (
                  <div className="bg-surface-subtle p-4 rounded-xl border border-white/[0.08] space-y-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-primary" /> Balance Sheet & Fixed Asset Overview
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {business.protectedFinancials.balanceSheetSummary}
                    </p>
                  </div>
                )}

                {/* Customer Concentration */}
                {business.protectedFinancials.customerConcentration && (
                  <div className="bg-surface-subtle p-4 rounded-xl border border-white/[0.08] space-y-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" /> Revenue Concentration Risk
                    </div>
                    <p className="text-xs text-muted">
                      {business.protectedFinancials.customerConcentration}
                    </p>
                  </div>
                )}

                {/* Reason for Sale */}
                {business.protectedFinancials.reasonForSale && (
                  <div className="bg-surface-subtle p-4 rounded-xl border border-white/[0.08] space-y-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" /> Seller Motivation & Transition Rationale
                    </div>
                    <p className="text-xs text-muted">
                      {business.protectedFinancials.reasonForSale}
                    </p>
                  </div>
                )}

                {/* Direct Seller Contact */}
                {business.protectedFinancials.sellerContact && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-primary" /> Direct Escrow & Seller Point of Contact
                    </div>
                    <p className="text-xs text-primary/90 font-mono">
                      {business.protectedFinancials.sellerContact}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* LOCKED TEASER GATE */
              <div className="relative rounded-2xl border border-amber-500/30 overflow-hidden bg-surface-subtle/70 p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg font-bold font-display text-foreground">
                    Confidential Financials Locked
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Access to exact P&L balance sheets, property leases, vendor contracts, and seller direct contacts requires execution of a digital Non-Disclosure Agreement.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsNdaModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black border-amber-400 font-semibold"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Sign NDA to Reveal Financials
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar: Seller Information & Security Guarantees */}
        <div className="space-y-4">
          <div className="bg-surface-subtle border border-white/[0.1] rounded-2xl p-6 sticky top-24 space-y-5">
            <div>
              <div className="text-[10px] uppercase font-mono text-muted mb-1">Opportunity Type</div>
              <div className="text-sm font-bold text-foreground">
                {listingTypeLabels[business.listingType] || business.listingType}
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4">
              <div className="text-[10px] uppercase font-mono text-muted mb-1">Listing Representative</div>
              <div className="text-sm font-semibold text-foreground">
                {business.seller?.company || business.seller?.name || 'Verified Seller'}
              </div>
              <div className="text-xs text-muted mt-0.5">Platform Escrow Supported</div>
            </div>

            {/* NDA Execution Status Card */}
            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <div className="text-[10px] uppercase font-mono text-muted">Legal Access Status</div>
              {ndaSigned ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>NDA signed. Full financials unlocked on this account.</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>NDA required to view exact operational records.</span>
                </div>
              )}

              {!ndaSigned && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black border-amber-400 font-semibold"
                  onClick={() => setIsNdaModalOpen(true)}
                >
                  Sign Digital NDA
                </Button>
              )}
            </div>

            {/* Confidentiality Guarantee */}
            <div className="border-t border-white/[0.06] pt-4 text-[11px] text-muted space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Server-Enforced Privacy
              </div>
              <p>
                Proprietary figures are strictly withheld at the database level and will not transmit over the network without explicit cryptographic authorization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NDA Modal */}
      {isNdaModalOpen && (
        <NdaModal
          business={business}
          onClose={() => setIsNdaModalOpen(false)}
          onSuccess={handleNdaSuccess}
        />
      )}
    </main>
  );
}
