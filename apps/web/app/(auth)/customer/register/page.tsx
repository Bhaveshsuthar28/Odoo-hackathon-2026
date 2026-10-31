'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import {
  User,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const normalizedEmail = email.trim().toLowerCase();
  const isGmail = normalizedEmail.endsWith('@gmail.com') && normalizedEmail.length > 10;

  // Real-time password criteria
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  }, [password]);

  const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!isGmail) {
      setError('Registration is restricted to valid @gmail.com addresses.');
      return;
    }

    if (!allCriteriaMet) {
      setError('Password does not satisfy all security complexity requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Password confirmation does not match.');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the SubFlow terms and privacy policy.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/customer/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
          confirmPassword,
          termsAccepted: acceptTerms,
        }),
      });

      if (res.success) {
        router.push(
          `/customer/verify-email?email=${encodeURIComponent(normalizedEmail)}&source=register`
        );
      } else {
        setError(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-2">
            <ShieldCheck size={13} /> Gmail-Verified Subscriber Signup
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] font-heading tracking-tight">
            Create Account
          </h2>
          <p className="text-xs text-[#77727A] mt-1">
            Start managing your subscriptions with SubFlow.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <AuthInput
            label="Full Name"
            type="text"
            required
            icon={User}
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <AuthInput
            label="Gmail Address"
            type="email"
            required
            icon={Mail}
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            badge={
              email && (
                <span
                  className={`text-[11px] flex items-center gap-1 font-semibold ${
                    isGmail ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {isGmail ? (
                    <>
                      <CheckCircle2 size={12} /> Valid Gmail
                    </>
                  ) : (
                    'Must be @gmail.com'
                  )}
                </span>
              )
            }
          />

          <PasswordInput
            label="Password"
            required
            placeholder="Create secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Password criteria chips */}
          {password.length > 0 && (
            <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E8E5E9] text-[10px] space-y-1">
              <div className="grid grid-cols-2 gap-1 text-[#77727A]">
                <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-emerald-600 font-semibold' : ''}`}>
                  {passwordCriteria.length ? <CheckCircle2 size={11} /> : <XCircle size={11} />} 8+ characters
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
            label="Confirm Password"
            required
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
          />

          <div className="flex items-start gap-2 pt-1">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#E8E5E9] text-[#714B67] focus:ring-[#714B67]"
            />
            <label htmlFor="terms" className="text-[11px] text-[#77727A] leading-snug cursor-pointer select-none">
              I agree to the SubFlow{' '}
              <a href="#" className="text-[#714B67] font-semibold hover:underline">
                Terms of Service
              </a>{' '}
              and Privacy Policy.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !isGmail || !allCriteriaMet || !passwordsMatch || !acceptTerms}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#714B67] hover:bg-[#55364E] disabled:opacity-50 text-white text-xs font-bold transition-all duration-150 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-[#F1F1F3]">
          <p className="text-xs text-[#77727A]">
            Already have an account?{' '}
            <Link
              href="/customer/login"
              className="font-bold text-[#714B67] hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
