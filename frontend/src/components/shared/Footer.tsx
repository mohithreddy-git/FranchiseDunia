import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { INDUSTRIES, TOP_CITIES } from '@/lib/utils';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-surface/50 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-item bg-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-background" />
              </div>
              <span className="text-xl font-bold font-display text-foreground">
                Franchise<span className="text-primary">Dunia</span>
              </span>
            </div>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              India’s premier intelligence and matchmaking platform connecting verified
              franchise brands, visionary entrepreneurs, angel investors, and business sellers.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted pt-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>All brand listings are manually verified with financial disclosures.</span>
            </div>
          </div>

          {/* Core Industries */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono mb-4">
              Top Industries
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              {INDUSTRIES.slice(0, 6).map((ind) => (
                <li key={ind}>
                  <Link
                    href={`/franchises?industry=${encodeURIComponent(ind)}`}
                    className="hover:text-primary transition-colors"
                  >
                    {ind}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hub Cities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono mb-4">
              Hub Cities
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              {TOP_CITIES.slice(0, 6).map((city) => (
                <li key={city}>
                  <Link
                    href={`/franchises?city=${encodeURIComponent(city)}`}
                    className="hover:text-primary transition-colors"
                  >
                    Franchises in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono mb-4">
              Headquarters
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted/80 shrink-0" />
                <span>BKC Financial Center, Bandra East, Mumbai 400051</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted/80 shrink-0" />
                <span>partnerships@franchisedunia.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted/80 shrink-0" />
                <span>+91 22 4890 5500</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and compliance strip */}
        <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>
            © {new Date().getFullYear()} FranchiseDunia Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-muted/60">Currency values displayed in whole INR (₹)</span>
            <span className="text-muted/60">Confidentiality Protected by Digital NDA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
