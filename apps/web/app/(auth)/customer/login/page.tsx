'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AuthTransitionProgress } from '@/components/auth/AuthTransitionProgress';
import { Mail, Loader2, AlertCircle, ArrowRight, CheckCircle2, Users } from 'lucide-react';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const isGmail = email.trim().toLowerCase().endsWith('@gmail.com');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isGmail) {
      setError('Customer portal accounts must use a valid @gmail.com address.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/customer/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, rememberMe }),
      });

      if (res.success && res.data) {
        setCustomerName(res.data.user?.name || 'Valued Subscriber');
        setTransitioning(true);
        router.prefetch('/customer/dashboard');

        // Timed interval for clean visual transition
        setTimeout(() => {
          login(res.data.token, res.data.user);
        }, 900);
      } else if ((res as any).requiresVerification) {
        // Redirect to OTP verification if unverified
        router.push(`/customer/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&reason=unverified`);
      } else {
        setLoading(false);
        setError(res.message || 'Invalid customer credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication error. Please check your connection.');
    }
  };

  return (
    <AuthSplitLayout activeRole="CUSTOMER">
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-2">
            <Users size={13} /> Subscriber Self-Service
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] font-heading tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-[#77727A] mt-1">
            Sign in to manage your subscriptions.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {transitioning ? (
          <AuthTransitionProgress
            title={`Welcome Back, ${customerName}`}
            subtitle="Subscriber account verified. Launching your portal..."
            durationMs={900}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Gmail Address"
              type="email"
              required
              icon={Mail}
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              badge={
                email && isGmail ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Valid Gmail
                  </span>
                ) : null
              }
            />

            <PasswordInput
              label="Password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#77727A] hover:text-[#242126]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="rounded border-[#E8E5E9] text-[#714B67] focus:ring-[#714B67]"
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/customer/forgot-password"
                className="text-[#714B67] hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !isGmail || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] disabled:opacity-50 text-white text-xs font-bold transition-all duration-150 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying subscriber...
                </>
              ) : (
                <>
                  Sign In to Subscriber Portal
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-[#F1F1F3]">
          <p className="text-xs text-[#77727A]">
            Don't have an account yet?{' '}
            <Link
              href="/customer/register"
              className="font-bold text-[#714B67] hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
