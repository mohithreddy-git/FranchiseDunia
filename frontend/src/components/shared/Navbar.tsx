'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  Building2,
  Calendar,
  Briefcase,
  User as UserIcon,
  LogOut,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, demoModeEnabled } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/franchises?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-item bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-background" />
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-1.5">
                Franchise<span className="text-primary">Dunia</span>
              </span>
              <span className="text-[10px] text-muted tracking-wider uppercase block -mt-1 font-medium">
                Business Opportunity Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/franchises"
              className={`px-3.5 py-2 rounded-item text-sm font-medium transition-colors ${
                pathname.startsWith('/franchises')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              Franchise Marketplace
            </Link>

            <Link
              href="/events"
              className="px-3.5 py-2 rounded-item text-sm font-medium text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Expos & Summits
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                Hub
              </span>
            </Link>

            <Link
              href="/business-for-sale"
              className="px-3.5 py-2 rounded-item text-sm font-medium text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Business-for-Sale
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono">
                NDA
              </span>
            </Link>
          </nav>
        </div>

        {/* Global Quick Search Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex items-center relative w-72"
        >
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Chai Point, Lenskart..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full bg-surface-subtle text-foreground text-xs rounded-item border border-white/[0.08] pl-9 pr-3 py-2 placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </form>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {demoModeEnabled && (
            <Badge variant="amber" size="sm" className="hidden sm:inline-flex">
              <Sparkles className="w-3 h-3 mr-1" /> Demo Mode
            </Badge>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm" className="text-xs">
                  Dashboard
                </Button>
              </Link>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground">{user.name}</span>
                <span className="text-[10px] uppercase font-mono text-primary font-medium">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-muted hover:text-red-400"
                title="Log Out"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm" className="text-xs">
                  Join Platform
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted hover:text-foreground rounded-item hover:bg-white/[0.06]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-surface p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search franchises, food, retail..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full bg-surface-subtle text-foreground text-sm rounded-item border border-white/[0.08] pl-9 pr-3 py-2.5"
            />
          </form>

          <div className="flex flex-col gap-1 pt-2">
            <Link
              href="/franchises"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-foreground hover:bg-white/[0.05] rounded-item"
            >
              Franchise Marketplace
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-foreground hover:bg-white/[0.05] rounded-item flex items-center justify-between"
            >
              <span>Expos & Summits</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                Hub
              </span>
            </Link>
            <Link
              href="/business-for-sale"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-foreground hover:bg-white/[0.05] rounded-item flex items-center justify-between"
            >
              <span>Business-for-Sale</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                NDA Gated
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
