'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@subflow.io');
  const [password, setPassword] = useState('SubFlow@Admin2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'staff' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@subflow.io');
      setPassword('SubFlow@Admin2026!');
    } else if (role === 'staff') {
      setEmail('sarah.ops@subflow.io');
      setPassword('SubFlow@Staff2026!');
    } else {
      setEmail('john@acmecorp.com');
      setPassword('Customer@SubFlow2026!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#121214] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#714B67] text-white flex items-center justify-center font-extrabold text-2xl font-heading shadow-md">
          S
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#252525] dark:text-white font-heading">
          SubFlow
        </h2>
        <p className="mt-1 text-xs text-[#737373] dark:text-[#A1A1AA]">
          Every Subscription. Every Payment. Every Invoice.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="odoo-card p-8">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#252525] dark:text-white">Password</label>
                <Link href="#" className="text-[#714B67] dark:text-purple-300 hover:underline text-[11px]">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>Sign In to SubFlow</span>
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB] dark:border-[#27272A] text-center">
            <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block mb-2">
              Quick Demonstration Accounts:
            </span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-2.5 py-1 text-[11px] rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff')}
                className="px-2.5 py-1 text-[11px] rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800"
              >
                Staff (Ops)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('customer')}
                className="px-2.5 py-1 text-[11px] rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800"
              >
                Customer Portal
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/register"
              className="text-xs text-[#714B67] dark:text-purple-300 hover:underline font-semibold"
            >
              Don't have an account? Register as new customer &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
