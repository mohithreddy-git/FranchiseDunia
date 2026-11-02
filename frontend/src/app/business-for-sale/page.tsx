'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Briefcase, ShieldCheck, ArrowRight } from 'lucide-react';

export default function BusinessForSalePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
        <Briefcase className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <Badge variant="amber" size="sm">Milestone 3 Preview</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
          Business-for-Sale & Strategic Partnerships
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Established cash-flowing enterprises, joint ventures, and equity stakes featuring our
          confidential digital NDA access flow are coming in Milestone 3!
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
