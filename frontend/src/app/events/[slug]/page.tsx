'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Event, EventRegistration } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  ExternalLink,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── RSVP Modal ───────────────────────────────────────────────────────────────

interface RsvpModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: (reg: EventRegistration) => void;
}

function RsvpModal({ event, onClose, onSuccess }: RsvpModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<EventRegistration | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.events.register(event._id);
      setConfirmed(result.registration);
      onSuccess(result.registration);
    } catch (e: unknown) {
      const err = e as Error & { statusCode?: number };
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Focus trap on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-surface border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmed ? (
          /* ── Success State ── */
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold font-display text-foreground">You&apos;re Registered!</h2>
            <p className="text-sm text-muted">Your seat is confirmed for</p>
            <p className="font-semibold text-foreground">{event.title}</p>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted mb-1 font-mono">Your Ticket Code</p>
              <p className="text-2xl font-bold font-mono text-primary tracking-widest">
                {confirmed.ticketCode}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href={api.events.getIcsUrl(event.slug)}
                download={`${event.slug}.ics`}
                className="flex-1"
              >
                <Button variant="secondary" size="sm" className="w-full gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Add to Calendar
                </Button>
              </a>
              <a
                href={api.events.getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Google Calendar
                </Button>
              </a>
            </div>

            <Button variant="secondary" size="sm" className="w-full mt-2" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          /* ── Confirm RSVP State ── */
          <div className="space-y-5">
            <div>
              <Badge variant="emerald" size="sm" className="mb-3">Confirm RSVP</Badge>
              <h2 className="text-xl font-bold font-display text-foreground">{event.title}</h2>
            </div>

            <div className="space-y-2 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary/70" />
                <span>{formatDate(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary/70" />
                <span>{formatTime(event.startDate)} — {formatTime(event.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary/70" />
                <span>{event.venue}, {event.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary/70" />
                <span className={event.ticketPrice === 0 ? 'text-emerald-400 font-semibold' : 'text-foreground font-semibold'}>
                  {event.ticketPrice === 0 ? 'Free Entry' : `₹${event.ticketPrice.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Reserving seat...' : 'Confirm RSVP'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [googleCalUrl, setGoogleCalUrl] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const result = await api.events.getBySlug(slug);
        setEvent(result.event);
        setGoogleCalUrl(result.googleCalendarUrl);
        setIsRegistered(result.isRegistered);
        setTicketCode(result.ticketCode);
        setIsSoldOut(result.isSoldOut);
      } catch {
        setError('Event not found or no longer available.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const handleRsvpSuccess = (reg: EventRegistration) => {
    setIsRegistered(true);
    setTicketCode(reg.ticketCode);
    if (event) setEvent({ ...event, registeredCount: event.registeredCount + 1 });
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted/40 mx-auto mb-4" />
        <p className="text-muted">{error || 'Event not found.'}</p>
        <Link href="/events">
          <Button variant="secondary" size="sm" className="mt-4">← Back to Events</Button>
        </Link>
      </main>
    );
  }

  const occupancyPct = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Back */}
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="emerald" size="sm">
            {event.type === 'investor_summit' ? 'Investor Summit' :
             event.type === 'exhibition' ? 'Exhibition' :
             event.type === 'networking' ? 'Networking' : 'Webinar'}
          </Badge>
          {event.isSampleData && <Badge variant="amber" size="sm">Sample listing</Badge>}
          {isSoldOut && <Badge variant="amber" size="sm">Sold Out</Badge>}
          {isRegistered && (
            <Badge variant="verified" size="sm">
              <CheckCircle2 className="w-3 h-3" /> You&apos;re Registered
            </Badge>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground mb-4">
          {event.title}
        </h1>

        {/* Key info row */}
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary/70" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary/70" />
            <span>{formatTime(event.startDate)} — {formatTime(event.endDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary/70" />
            <span>{event.venue}, {event.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary/70" />
            <span>{event.registeredCount} / {event.capacity} registered</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Description + Agenda + Speakers */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-lg font-bold text-foreground font-display mb-3">About this Event</h2>
            <p className="text-sm text-muted leading-relaxed">{event.description}</p>
          </section>

          {/* Speakers */}
          {event.speakers && event.speakers.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground font-display mb-4">Speakers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.speakers.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-surface-subtle border border-white/[0.06] rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-muted">{s.designation}, {s.company}</p>
                      {s.topic && <p className="text-xs text-primary/80 mt-0.5 italic">{s.topic}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Agenda */}
          {event.agenda && event.agenda.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground font-display mb-4">Agenda</h2>
              <div className="space-y-3 border-l-2 border-primary/20 pl-4">
                {event.agenda.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary/40 border border-primary mt-0.5" />
                    <p className="text-xs text-primary/70 font-mono mb-0.5">{item.time}</p>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted mt-0.5">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Exhibitors */}
          {event.exhibitors && event.exhibitors.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground font-display mb-4">Exhibitors</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {event.exhibitors.map((ex, i) => (
                  <div key={i} className="bg-surface-subtle border border-white/[0.06] rounded-xl p-3 text-center">
                    <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                    {ex.industry && <p className="text-xs text-muted">{ex.industry}</p>}
                    {ex.boothNumber && (
                      <p className="text-xs text-primary/70 mt-1 font-mono">Booth {ex.boothNumber}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: RSVP Sidebar */}
        <div className="space-y-4">
          <div className="bg-surface-subtle border border-white/[0.1] rounded-2xl p-6 sticky top-24 space-y-5">
            {/* Ticket Price */}
            <div className="text-center">
              <p className="text-xs uppercase font-mono text-muted mb-1">Ticket Price</p>
              <p className={`text-3xl font-bold font-display ${event.ticketPrice === 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                {event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice.toLocaleString('en-IN')}`}
              </p>
            </div>

            {/* Capacity bar */}
            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>{event.registeredCount} registered</span>
                <span>{event.capacity - event.registeredCount} seats left</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isSoldOut ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>

            {/* RSVP button or already registered state */}
            {isRegistered ? (
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-muted mb-1">Your Ticket Code</p>
                  <p className="text-lg font-mono font-bold text-primary tracking-widest">{ticketCode}</p>
                </div>
                <a href={api.events.getIcsUrl(event.slug)} download={`${event.slug}.ics`}>
                  <Button variant="secondary" size="md" className="w-full gap-2">
                    <Download className="w-4 h-4" /> Download .ics
                  </Button>
                </a>
                <a href={googleCalUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="md" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" /> Add to Google Calendar
                  </Button>
                </a>
              </div>
            ) : isSoldOut ? (
              <Button variant="secondary" size="md" className="w-full" disabled>
                Sold Out — Capacity Reached
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setShowRsvpModal(true)}
              >
                Reserve My Seat
              </Button>
            )}

            {/* Calendar links (even without RSVP) */}
            {!isRegistered && !isSoldOut && (
              <div className="flex gap-2">
                <a href={api.events.getIcsUrl(event.slug)} download className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                    <Download className="w-3.5 h-3.5" /> .ics
                  </Button>
                </a>
                <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> Google Cal
                  </Button>
                </a>
              </div>
            )}

            {/* Organizer */}
            <div className="border-t border-white/[0.06] pt-4 text-xs text-muted">
              <p className="font-medium text-foreground text-sm mb-1">Organized by</p>
              <p>{event.organizer?.company || event.organizer?.name}</p>
              <p>{event.organizer?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Modal */}
      {showRsvpModal && (
        <RsvpModal
          event={event}
          onClose={() => setShowRsvpModal(false)}
          onSuccess={handleRsvpSuccess}
        />
      )}
    </main>
  );
}
