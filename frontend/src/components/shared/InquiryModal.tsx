'use client';

import React, { useState } from 'react';
import { Franchise } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCompactINR, formatINR } from '@/lib/utils';
import { CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface InquiryModalProps {
  franchise: Franchise;
  isOpen: boolean;
  onClose: () => void;
}

export default function InquiryModal({ franchise, isOpen, onClose }: InquiryModalProps) {
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    investmentBudget: franchise.investmentMin || 1000000,
    targetCity: user?.city || 'Mumbai',
    timeline: '1 - 3 Months',
    hasCommercialSpace: false,
    spaceAvailableSqFt: 0,
    message: `Hi, I am interested in exploring franchise expansion for ${franchise.name} in my territory. Please share detailed financials and location viability requirements.`,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // If user is not logged in, prompt sign in
      if (!user) {
        throw new Error('Please sign in or use a demo account to submit an official inquiry.');
      }

      await api.leads.create({
        brandId: franchise._id,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        investmentBudget: Number(formData.investmentBudget),
        targetCity: formData.targetCity,
        timeline: formData.timeline,
        hasCommercialSpace: formData.hasCommercialSpace,
        spaceAvailableSqFt: Number(formData.spaceAvailableSqFt),
        message: formData.message,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={isSuccess ? 'Inquiry Transmitted' : `Connect with ${franchise.name}`}
      description={
        isSuccess
          ? 'Your investment profile has been routed directly to the brand expansion team.'
          : `Direct official inquiry routed to verified franchise representatives.`
      }
    >
      {isSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground font-display">
              Inquiry Successfully Submitted!
            </h3>
            <p className="text-sm text-muted max-w-sm mx-auto mt-1">
              The franchise partner team will review your planned budget of{' '}
              <span className="text-emerald-400 font-semibold font-mono">
                {formatINR(formData.investmentBudget)}
              </span>{' '}
              and reach out within 24 business hours.
            </p>
          </div>
          <Button variant="primary" onClick={handleResetAndClose} className="w-full">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-item bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-surface-subtle p-3 rounded-item border border-white/[0.06] flex items-center justify-between text-xs">
            <div>
              <span className="text-muted">Target Brand:</span>{' '}
              <span className="font-semibold text-foreground">{franchise.name}</span>
            </div>
            <div>
              <span className="text-muted">Range:</span>{' '}
              <span className="font-mono text-primary font-semibold">
                {formatCompactINR(franchise.investmentMin)} - {formatCompactINR(franchise.investmentMax)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Sunil Kothari"
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sunil@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98200 00000"
            />
            <Input
              label="Target City / Location"
              required
              value={formData.targetCity}
              onChange={(e) => setFormData({ ...formData, targetCity: e.target.value })}
              placeholder="e.g. Mumbai, Pune"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Planned Capital Outlay (₹ INR)"
              type="number"
              required
              min={100000}
              step={50000}
              value={formData.investmentBudget}
              onChange={(e) =>
                setFormData({ ...formData, investmentBudget: Number(e.target.value) })
              }
              helperText={formatINR(Number(formData.investmentBudget) || 0)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Execution Timeline
              </label>
              <select
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="w-full bg-surface-subtle text-foreground text-sm rounded-item border border-white/[0.08] px-3.5 py-2.5 focus:outline-none focus:border-primary"
              >
                <option value="Immediately (Within 30 days)">Immediately (Within 30 days)</option>
                <option value="1 - 3 Months">1 - 3 Months</option>
                <option value="3 - 6 Months">3 - 6 Months</option>
                <option value="Exploring Options">Exploring Options</option>
              </select>
            </div>
          </div>

          {/* Commercial space checkbox */}
          <div className="p-3 rounded-item bg-surface-subtle border border-white/[0.06] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground font-medium">
              <input
                type="checkbox"
                checked={formData.hasCommercialSpace}
                onChange={(e) =>
                  setFormData({ ...formData, hasCommercialSpace: e.target.checked })
                }
                className="rounded border-white/[0.2] text-primary focus:ring-primary h-4 w-4 bg-background"
              />
              <span>I already own or have leased commercial space for this unit</span>
            </label>

            {formData.hasCommercialSpace && (
              <Input
                label="Available Carpet Area (Sq. Ft.)"
                type="number"
                value={formData.spaceAvailableSqFt || ''}
                onChange={(e) =>
                  setFormData({ ...formData, spaceAvailableSqFt: Number(e.target.value) })
                }
                placeholder="e.g. 500"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted">
              Message to Brand Representatives
            </label>
            <textarea
              rows={3}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-surface-subtle text-foreground text-sm rounded-item border border-white/[0.08] p-3 focus:outline-none focus:border-primary placeholder:text-muted/60"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              Your contact details are encrypted and disclosed exclusively to verified franchise officers.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Transmit Inquiry
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
