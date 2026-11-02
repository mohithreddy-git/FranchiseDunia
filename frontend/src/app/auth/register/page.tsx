'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AnimatedGridBackground from '@/components/animations/AnimatedGridBackground';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Briefcase,
  AlertCircle,
  Check,
} from 'lucide-react';

const ALLOWED_REGISTRATION_ROLES: {
  role: UserRole;
  title: string;
  description: string;
}[] = [
  {
    role: 'investor',
    title: 'Investor / Entrepreneur',
    description: 'Looking to acquire franchise rights or business equity',
  },
  {
    role: 'brand_owner',
    title: 'Franchise Brand Owner',
    description: 'Looking to expand network across Indian cities',
  },
  {
    role: 'business_seller',
    title: 'Business Seller',
    description: 'Looking for M&A buyers, partners, or equity exits',
  },
  {
    role: 'event_organizer',
    title: 'Event Organizer',
    description: 'Hosting franchise expos, summits, and business meetups',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [role, setRole] = useState<UserRole>('investor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Hard client-side safeguard: admin role is forbidden
    if (role === ('admin' as any)) {
      setError('Administrator accounts cannot be registered publicly.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.register({
        name,
        email,
        password,
        role,
        phone,
        city,
        company,
      });

      setUser(res.user);
      router.push('/franchises');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check the provided information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-8">
      <AnimatedGridBackground />

      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-item bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Building2 className="w-5 h-5 text-background" />
            </div>
            <span className="text-2xl font-bold font-display text-foreground">
              Franchise<span className="text-primary">Dunia</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold font-display text-foreground pt-2">
            Create your account
          </h1>
          <p className="text-xs text-muted">
            Join the ecosystem connecting top franchise brands and ambitious investors.
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-card bg-surface/90 border border-white/[0.1] p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-item bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Account Role Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-muted font-medium">
                Select Your Platform Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALLOWED_REGISTRATION_ROLES.map((r) => {
                  const isSelected = role === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setRole(r.role)}
                      className={`text-left p-3 rounded-item border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-foreground'
                          : 'bg-surface-subtle border-white/[0.06] text-muted hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-foreground font-display">
                          {r.title}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted leading-tight line-clamp-2">
                        {r.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                icon={<User className="w-4 h-4" />}
              />

              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password (min 6 characters)"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 00000"
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="City / Headquarters"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Bengaluru"
                icon={<MapPin className="w-4 h-4" />}
              />

              <Input
                label="Company / Firm (Optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Apex Ventures"
                icon={<Briefcase className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm mt-2"
            >
              Complete Registration
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-white/[0.06] text-xs text-muted">
            Already registered on FranchiseDunia?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
