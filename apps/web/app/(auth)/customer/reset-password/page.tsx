'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { OtpInput } from '@/components/ui/OtpInput';
import {
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const normalizedEmail = email.trim().toLowerCase();
  const isGmail = normalizedEmail.endsWith('@gmail.com');

  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
    };
  }, [newPassword]);

  const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isGmail) {
      setError('Please provide a valid @gmail.com address.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    if (!allCriteriaMet) {
      setError('Password does not satisfy all complexity requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/customer/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/customer/login');
        }, 2200);
      } else {
        setError(res.message || 'Password reset failed. Check OTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#714B67] text-[11px] font-bold border border-purple-200 mb-2">
            <KeyRound size={13} /> Security Credential Update
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] font-heading tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-[#77727A] mt-1">
            Enter your 6-digit OTP code and choose a new password.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#242126]">
                Password Reset Successfully!
              </h3>
              <p className="text-xs text-[#77727A] mt-1">
                Your password has been securely updated. Redirecting to login...
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/customer/login"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] text-white text-xs font-bold shadow-sm"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <AuthInput
              label="Registered Gmail Address"
              type="email"
              required
              icon={Mail}
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <label className="block text-xs font-bold text-[#242126] mb-1.5">
                6-Digit Recovery OTP Code
              </label>
              <div className="py-1">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <PasswordInput
              label="New Password"
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {/* Password Criteria */}
            {newPassword.length > 0 && (
              <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E8E5E9] text-[10px] space-y-1">
                <div className="grid grid-cols-2 gap-1 text-[#77727A]">
                  <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-emerald-600 font-semibold' : ''}`}>
                    {passwordCriteria.length ? <CheckCircle2 size={11} /> : <XCircle size={11} />} 8+ chars
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.uppercase ? 'text-emerald-600 font-semibold' : ''}`}>
                    {passwordCriteria.uppercase ? <CheckCircle2 size={11} /> : <XCircle size={11} />} 1 Uppercase
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.lowercase ? 'text-emerald-600 font-semibold' : ''}`}>
                    {passwordCriteria.lowercase ? <CheckCircle2 size={11} /> : <XCircle size={11} />} 1 Lowercase
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-emerald-600 font-semibold' : ''}`}>
                    {passwordCriteria.number ? <CheckCircle2 size={11} /> : <XCircle size={11} />} 1 Number
                  </span>
                  <span className={`col-span-2 flex items-center gap-1 ${passwordCriteria.special ? 'text-emerald-600 font-semibold' : ''}`}>
                    {passwordCriteria.special ? <CheckCircle2 size={11} /> : <XCircle size={11} />} 1 Special char (!@#$%^&*)
                  </span>
                </div>
              </div>
            )}

            <PasswordInput
              label="Confirm New Password"
              required
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || !allCriteriaMet || !passwordsMatch}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] disabled:opacity-50 text-white text-xs font-bold transition-all duration-150 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Reset Password
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

export default function CustomerResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#714B67]" size={28} /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
