'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Lead, Message, User } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  X,
  Send,
  MessageSquare,
  Clock,
  UserCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

interface LeadDrawerProps {
  lead: Lead;
  currentUser: User | null;
  onClose: () => void;
  onStatusChange?: (updatedLead: Lead) => void;
}

export default function LeadDrawer({
  lead,
  currentUser,
  onClose,
  onStatusChange,
}: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'notes'>('details');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [status, setStatus] = useState(lead.status);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState('');
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOwner = currentUser?.role === 'brand_owner' || currentUser?.role === 'business_seller';
  const isAdmin = currentUser?.role === 'admin';

  // 1. Fetch & Poll messages every 5s (paused when tab hidden)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetchMessages = async () => {
      if (document.hidden) return;
      try {
        const lastMsgId = messages.length > 0 ? messages[messages.length - 1]._id : undefined;
        const res = await api.messages.list(lead._id, lastMsgId);
        if (res.messages && res.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const newOnes = res.messages.filter((m) => !existingIds.has(m._id));
            return [...prev, ...newOnes];
          });
          // Mark as read
          api.messages.markRead(lead._id).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to poll messages:', err);
      }
    };

    fetchMessages();
    timer = setInterval(fetchMessages, 5000);

    return () => clearInterval(timer);
  }, [lead._id, messages]);

  // Scroll to latest message
  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const res = await api.messages.send(lead._id, newMsg.trim());
      setMessages((prev) => [...prev, res.message]);
      setNewMsg('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSuccess(false);
    try {
      const res = await api.leads.updateStatus(lead._id, { status, notes });
      if (onStatusChange) onStatusChange(res.lead);
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleUpdateStatus = async (newStatus: any) => {
    setStatusError('');
    try {
      const res = await api.leads.updateStatus(lead._id, {
        status: newStatus,
        reason: statusReason || undefined,
      });
      setStatus(res.lead.status);
      if (onStatusChange) onStatusChange(res.lead);
    } catch (err: any) {
      if (err.statusCode === 409 && err.data?.allowedTransitions) {
        setStatusError(
          `Invalid transition. Allowed next states: ${err.data.allowedTransitions.join(', ')}`
        );
      } else {
        setStatusError(err.message || 'Failed to update status.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-surface border-l border-white/[0.1] h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-surface-subtle/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-foreground">{lead.fullName}</h2>
              <Badge variant="emerald" size="sm">{lead.status.replace('_', ' ')}</Badge>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Inquiry on: <span className="text-foreground font-medium">{lead.targetId?.name || lead.targetId?.title || 'Listing Opportunity'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] px-5 bg-surface">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Applicant & Score
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'messages'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat</span>
            {messages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px]">
                {messages.length}
              </span>
            )}
          </button>
          {(isOwner || isAdmin) && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'notes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Private Notes
            </button>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Score Card with Breakdown Tooltip */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-white/[0.08] relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase font-mono text-muted">Computed Lead Fit Score</span>
                    <button
                      type="button"
                      onClick={() => setShowScoreTooltip(!showScoreTooltip)}
                      className="text-muted hover:text-foreground"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {lead.leadScore} <span className="text-xs text-muted font-normal">/ 100</span>
                  </span>
                </div>

                {/* Score Breakdown Tooltip / Panel */}
                {lead.scoreBreakdown && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px] text-muted">
                    <div>Budget Fit: <span className="text-foreground font-mono">{lead.scoreBreakdown.budgetFit}/40</span></div>
                    <div>Timeline Urgency: <span className="text-foreground font-mono">{lead.scoreBreakdown.timelineUrgency}/20</span></div>
                    <div>Profile Depth: <span className="text-foreground font-mono">{lead.scoreBreakdown.profileCompleteness}/15</span></div>
                    <div>Account Trust: <span className="text-foreground font-mono">{lead.scoreBreakdown.accountTrust}/10</span></div>
                    <div className="col-span-2">Message Quality: <span className="text-foreground font-mono">{lead.scoreBreakdown.messageQuality}/15</span></div>
                  </div>
                )}
              </div>

              {/* Status State Machine Controller (Owner & Admin Only) */}
              {(isOwner || isAdmin) && (
                <div className="p-4 rounded-xl bg-surface-subtle border border-white/[0.08] space-y-3">
                  <span className="text-xs uppercase font-mono text-muted">Manage Pipeline Stage</span>
                  {statusError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{statusError}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {['under_review', 'contacted', 'converted', 'rejected'].map((st) => (
                      <Button
                        key={st}
                        variant={status === st ? 'primary' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => handleUpdateStatus(st)}
                      >
                        {st.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact & Territory Details */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Target Territory: {lead.targetCity}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-foreground">
                    Budget Outlay: ₹{(lead.investmentBudget / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
              </div>

              {/* Original Message */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-white/[0.06] space-y-1">
                <span className="text-xs uppercase font-mono text-muted">Investor Application Message</span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{lead.message}</p>
              </div>

              {/* Status History Timeline */}
              {lead.statusHistory && lead.statusHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs uppercase font-mono text-muted">Status History Timeline</span>
                  <div className="space-y-2 border-l-2 border-white/[0.1] pl-3">
                    {lead.statusHistory.map((h, i) => (
                      <div key={i} className="text-xs text-muted">
                        <span className="text-foreground font-semibold capitalize">{h.to.replace('_', ' ')}</span>
                        <span className="text-[10px] ml-2 text-muted/70">
                          {new Date(h.at).toLocaleDateString()} · {h.reason || 'Status updated'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Live Chat Tab */}
          {activeTab === 'messages' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] p-2 bg-surface-subtle/50 rounded-xl border border-white/[0.06]">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted text-xs">
                    No messages in this inquiry thread yet. Start the conversation below.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSender =
                      (m.sender as any)?._id?.toString() === currentUser?._id?.toString() ||
                      (m.sender as any)?.id?.toString() === currentUser?.id?.toString() ||
                      m.sender?.toString() === currentUser?._id?.toString() ||
                      m.sender?.toString() === currentUser?.id?.toString();

                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isSender
                              ? 'bg-primary text-black font-medium'
                              : 'bg-surface border border-white/[0.1] text-foreground'
                          }`}
                        >
                          {/* STRICT: Plain text render only, prevents XSS execution */}
                          {m.body}
                        </div>
                        <span className="text-[10px] text-muted/60 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Composer */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type message to applicant... (max 2000 chars)"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  maxLength={2000}
                  className="flex-1 text-xs"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={sendingMsg || !newMsg.trim()}
                  className="px-4"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          )}

          {/* Private Notes Tab (Owner & Admin Only) */}
          {activeTab === 'notes' && (isOwner || isAdmin) && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Private owner notes are strictly confidential and NEVER shown to the applicant.</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Enter internal evaluation notes, credit rating remarks, or meeting minutes..."
                className="w-full bg-surface-subtle text-foreground text-xs rounded-xl border border-white/[0.08] p-3 focus:outline-none focus:border-primary"
              />
              <div className="flex items-center justify-between">
                {notesSuccess ? (
                  <span className="text-xs text-emerald-400">Notes updated successfully!</span>
                ) : <span />}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving...' : 'Save Private Notes'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
