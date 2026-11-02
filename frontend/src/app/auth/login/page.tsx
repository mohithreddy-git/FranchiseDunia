'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import AnimatedGridBackground from '@/components/animations/AnimatedGridBackground';
import {
  Building2,
  Lock,
  Mail,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, demoModeEnabled } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.auth.login({ email, password });
      setUser(res.user);
      router.push('/franchises');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setDemoLoadingRole(role);
    setError(null);

    try {
      const res = await api.auth.demoLogin(role);
      setUser(res.user);
      router.push('/franchises');
    } catch (err: any) {
      setError(err.message || `Failed to sign in with demo ${role} role.`);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-8">
      <AnimatedGridBackground />

      <div className="w-full max-w-md space-y-6">
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
            Sign in to your account
          </h1>
          <p className="text-xs text-muted">
            Access verified opportunities, track inquiries, and unlock confidential metrics.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-card bg-surface/90 border border-white/[0.1] p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-item bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aditya@capital.in"
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm"
            >
              Sign In
            </Button>
          </form>

          {/* Conditional Demo Mode Box */}
          {demoModeEnabled && (
            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 1-Click Evaluation Accounts
                </span>
                <Badge variant="amber" size="sm">Demo Mode</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('investor')}
                  isLoading={demoLoadingRole === 'investor'}
                  className="w-full text-xs justify-start"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  <span>Investor</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('brand_owner')}
                  isLoading={demoLoadingRole === 'brand_owner'}
                  className="w-full text-xs justify-start"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  <span>Brand Owner</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('business_seller')}
                  isLoading={demoLoadingRole === 'business_seller'}
                  className="w-full text-xs justify-start"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  <span>Business Seller</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                  isLoading={demoLoadingRole === 'admin'}
                  className="w-full text-xs justify-start"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  <span>Admin</span>
                </Button>
              </div>
            </div>
          )}

          <div className="text-center pt-2 border-t border-white/[0.06] text-xs text-muted">
            Don’t have an account yet?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
