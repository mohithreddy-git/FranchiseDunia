'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export default function EventsHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
        <Calendar className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <Badge variant="emerald" size="sm">Milestone 2 Preview</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
          Events & Franchise Exhibition Hub
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Upcoming Franchise India Expo 2026, Mumbai Investor Summit, and Bangalore Startup
          Franchise Conclave are coming in Milestone 2 with interactive city filtering, 1-click
          RSVP, and calendar syncing!
        </p>
      </div>

      <div className="pt-4">
        <Link href="/franchises">
          <Button variant="primary" size="md">
            <span>Explore Franchise Marketplace</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
