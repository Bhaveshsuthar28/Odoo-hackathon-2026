'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const normalizedEmail = email.trim().toLowerCase();
  const isGmail = normalizedEmail.endsWith('@gmail.com');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isGmail) {
      setError('Password recovery is restricted to verified @gmail.com accounts.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/customer/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || 'Failed to dispatch reset code.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#714B67] text-[11px] font-bold border border-purple-200 mb-2">
            <KeyRound size={13} /> Account Recovery
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] font-heading tracking-tight">
            Forgot Password
          </h2>
          <p className="text-xs text-[#77727A] mt-1">
            Enter your registered Gmail to receive a 6-digit recovery code.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center py-2">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#242126]">
                Recovery Code Dispatched
              </h3>
              <p className="mt-1.5 text-xs text-[#77727A] leading-relaxed">
                If an account exists for <strong className="text-[#242126]">{normalizedEmail}</strong>, we have sent a 6-digit recovery OTP code to your inbox.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/customer/reset-password?email=${encodeURIComponent(normalizedEmail)}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] text-white text-xs font-bold transition-all shadow-sm"
              >
                Enter 6-Digit OTP Code <ArrowRight size={14} />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-xs text-[#77727A] hover:underline"
            >
              Entered wrong email? Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Registered Gmail Address"
              type="email"
              required
              icon={Mail}
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              badge={
                email && isGmail ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Valid Gmail
                  </span>
                ) : null
              }
            />

            <button
              type="submit"
              disabled={loading || !isGmail}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] disabled:opacity-50 text-white text-xs font-bold transition-all duration-150 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending Recovery Code...
                </>
              ) : (
                <>
                  Send Recovery OTP
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-[#F1F1F3]">
          <Link
            href="/customer/login"
            className="text-xs font-bold text-[#714B67] hover:underline"
          >
            Remembered your password? Back to Login
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
