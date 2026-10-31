'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthTransitionProgress } from '@/components/auth/AuthTransitionProgress';
import { OtpInput } from '@/components/ui/OtpInput';
import {
  Mail,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Edit2,
  ArrowRight,
} from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const reason = searchParams.get('reason');

  const [email, setEmail] = useState(initialEmail);
  const [editingEmail, setEditingEmail] = useState(!initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 5 minute countdown timer (300 seconds)
  const [expiresIn, setExpiresIn] = useState(300);
  // 60 second resend cooldown
  const [resendCooldown, setResendCooldown] = useState(60);

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !email.endsWith('@gmail.com')) {
      setError('Please provide a valid @gmail.com address.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the OTP verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/customer/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      if (res.success && res.data) {
        setTransitioning(true);
        router.prefetch('/customer/dashboard');

        // Timed interval for clean visual transition
        setTimeout(() => {
          login(res.data.token, res.data.user);
        }, 1000);
      } else {
        setLoading(false);
        setError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await apiRequest('/api/auth/customer/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.success) {
        setSuccessMsg('A fresh 6-digit verification code was sent to your Gmail.');
        setExpiresIn(300);
        setResendCooldown(60);
        setOtp('');
      } else {
        setError(res.message || 'Could not resend OTP. Please wait a moment.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-2">
            <Mail size={13} /> Two-Factor Email Security
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] font-heading tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-xs text-[#77727A] mt-1">
            We sent a 6-digit verification code to your Gmail address.
          </p>
        </div>

        {reason === 'unverified' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>Please verify your email address to access your subscription portal.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !transitioning && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {transitioning ? (
          <AuthTransitionProgress
            title="Account Successfully Verified!"
            subtitle="Launching your subscriber portal..."
            durationMs={1000}
          />
        ) : (
          <>
            {/* Email indicator badge */}
            <div className="p-3 rounded-xl bg-[#F7F7F8] border border-[#E8E5E9] flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Mail size={15} className="text-[#714B67] shrink-0" />
                {editingEmail ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="text-xs bg-white border border-[#E8E5E9] rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#242126] truncate">
                    {email || 'No email provided'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingEmail(!editingEmail)}
                className="text-xs text-[#714B67] hover:underline flex items-center gap-1 shrink-0 ml-2 font-semibold"
              >
                <Edit2 size={12} /> {editingEmail ? 'Save' : 'Change'}
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-[#242126]">
                    6-Digit Security Code
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-[#77727A]">
                    <Clock size={13} />
                    <span>
                      Expires in{' '}
                      <strong className={expiresIn < 60 ? 'text-rose-500 font-mono' : 'text-[#242126] font-mono'}>
                        {formatTimer(expiresIn)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Individual 6-digit boxes */}
                <div className="py-1">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading || expiresIn === 0}
                    autoFocus
                  />
                </div>

                <p className="mt-2 text-center text-[11px] text-[#77727A]">
                  Maximum 5 attempts before the security code expires.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || expiresIn === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] disabled:opacity-50 text-white text-xs font-bold transition-all duration-150 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Verify Email &amp; Activate Account
                  </>
                )}
              </button>
            </form>

            {/* Resend Cooldown */}
            <div className="pt-2 text-center border-t border-[#F1F1F3]">
              <p className="text-xs text-[#77727A] mb-2">
                Didn't receive the email? Check your Spam or Promotions folder.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#714B67] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending
                  ? 'Sending fresh OTP...'
                  : resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : 'Resend Verification Code'}
              </button>
            </div>
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}

export default function CustomerVerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#714B67]" size={28} /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
