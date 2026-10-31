'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AuthTransitionProgress } from '@/components/auth/AuthTransitionProgress';
import { Mail, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, rememberMe }),
      });

      if (res.success && res.data) {
        setAdminName(res.data.user?.name || 'Administrator');
        setTransitioning(true);
        router.prefetch('/admin/dashboard');

        // Timed interval for clean visual transition
        setTimeout(() => {
          login(res.data.token, res.data.user);
        }, 900);
      } else {
        setLoading(false);
        setError(res.message || 'Invalid administrative credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please check your connection.');
    }
  };

  return (
    <AuthSplitLayout activeRole="ADMIN">
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#714B67] text-[11px] font-bold border border-purple-200 mb-2">
            <ShieldCheck size={13} /> Root Administrator Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] font-heading tracking-tight">
            Welcome Back, Admin
          </h2>
          <p className="text-xs text-[#77727A] mt-1">
            Access your business management workspace.
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
            title={`Welcome Back, ${adminName}`}
            subtitle="Admin credentials authenticated. Loading command center..."
            durationMs={900}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="admin@subflow.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
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
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] disabled:opacity-50 text-white text-xs font-bold transition-all duration-150 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying credentials...
                </>
              ) : (
                <>
                  Sign In to Admin Workspace
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <p className="text-[11px] text-[#77727A]">
            Staff or Customer? Use the portal selector above to switch roles.
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
