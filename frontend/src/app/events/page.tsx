'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Event, EventType } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import BorderGlowCard from '@/components/animations/BorderGlowCard';
import SaveButton from '@/components/shared/SaveButton';
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  ExternalLink,
  Search,
  ChevronRight,
  Star,
} from 'lucide-react';

const CITIES = ['All', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

const EVENT_TYPES: { value: EventType | 'All'; label: string }[] = [
  { value: 'All', label: 'All Events' },
  { value: 'exhibition', label: 'Exhibitions' },
  { value: 'investor_summit', label: 'Investor Summits' },
  { value: 'networking', label: 'Networking' },
  { value: 'webinar', label: 'Webinars' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
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

function EventCard({ event }: { event: Event }) {
  const isSoldOut = event.registeredCount >= event.capacity;
  const occupancyPct = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <BorderGlowCard className="flex flex-col h-full group p-5 hover:border-primary/40 transition-colors">
      {/* Type + City badges + Save */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="emerald" size="sm">
            {event.type === 'investor_summit' ? 'Investor Summit' :
             event.type === 'exhibition' ? 'Exhibition' :
             event.type === 'networking' ? 'Networking' : 'Webinar'}
          </Badge>
          {event.isSampleData && <Badge variant="amber" size="sm">Sample</Badge>}
          {isSoldOut && <Badge variant="amber" size="sm">Sold Out</Badge>}
        </div>
        <SaveButton
          targetType="event"
          targetId={event._id}
          initialSaved={event.isSaved}
          size="sm"
        />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base text-foreground font-display group-hover:text-primary transition-colors line-clamp-2 mb-2">
        {event.title}
      </h3>

      {/* Date & Venue */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/70" />
          <span>{formatDate(event.startDate)} · {formatTime(event.startDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/70" />
          <span className="truncate">{event.venue}, {event.city}</span>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-muted mb-1.5">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {event.registeredCount} / {event.capacity} registered
          </span>
          <span>{occupancyPct}% full</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isSoldOut ? 'bg-amber-500' : 'bg-primary'}`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </div>

      {/* Price & CTA */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <Ticket className="w-3.5 h-3.5 text-primary" />
          {event.ticketPrice === 0 ? (
            <span className="text-emerald-400">Free Entry</span>
          ) : (
            <span>₹{event.ticketPrice.toLocaleString('en-IN')}</span>
          )}
        </div>
        <Link href={`/events/${event.slug}`}>
          <Button variant="secondary" size="sm" className="text-xs gap-1">
            View & RSVP <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </BorderGlowCard>
  );
}

function EventCardSkeleton() {
  return (
    <div className="rounded-card border border-white/[0.08] p-5 space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-2 w-full mt-2" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

function EventsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const city = searchParams.get('city') || 'All';
  const type = (searchParams.get('type') || 'All') as EventType | 'All';
  const search = searchParams.get('search') || '';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'All' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page');
      router.push(`/events?${params.toString()}`, { scroll: false });
      setPage(1);
    },
    [searchParams, router]
  );

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 12 };
        if (city !== 'All') params.city = city;
        if (type !== 'All') params.type = type;
        const result = await api.events.list(params);
        setEvents(result.events);
        setTotal(result.total);
      } catch (e) {
        console.error('Failed to fetch events:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [city, type, page]);

  const totalPages = Math.ceil(total / 12);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Badge variant="emerald" size="md">
          <Star className="w-3 h-3" /> Events & Exhibition Hub
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
          Franchise Summits & Expos
        </h1>
        <p className="text-sm text-muted max-w-2xl">
          India&apos;s premier franchise events — investor summits, brand exhibitions, and
          networking conclaves across 6 cities.
        </p>
      </div>

      {/* City Chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CITIES.map((c) => (
          <button
            key={c}
            onClick={() => updateParam('city', c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              city === c
                ? 'bg-primary text-black border-primary'
                : 'bg-white/[0.04] text-muted border-white/[0.08] hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Event Type Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-8">
        {EVENT_TYPES.map((et) => (
          <button
            key={et.value}
            onClick={() => updateParam('type', et.value)}
            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
              type === et.value
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'bg-transparent text-muted border-white/[0.08] hover:border-white/[0.2] hover:text-foreground'
            }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted mb-4">
          Showing {events.length} of {total} upcoming events
          {city !== 'All' ? ` in ${city}` : ''}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
          : events.map((ev) => <EventCard key={ev._id} event={ev} />)}
      </div>

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <Calendar className="w-12 h-12 text-muted/40 mx-auto" />
          <p className="text-muted text-sm">No upcoming events found for your filters.</p>
          <Button variant="secondary" size="sm" onClick={() => router.push('/events')}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </main>
  );
}

export default function EventsHubPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted">
          Loading Events Hub...
        </div>
      }
    >
      <EventsHubContent />
    </React.Suspense>
  );
}
