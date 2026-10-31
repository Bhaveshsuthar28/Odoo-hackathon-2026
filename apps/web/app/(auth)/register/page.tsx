'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Lock, Mail, User, Phone, Loader2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client validation
    if (password.length < 9) {
      setError('Password must be more than 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one special character');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password }),
      });

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#121214] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#714B67] text-white flex items-center justify-center font-extrabold text-2xl font-heading shadow-md">
          S
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#252525] dark:text-white font-heading">
          Create Customer Account
        </h2>
        <p className="mt-1 text-xs text-[#737373]">
          Self-service billing and subscription portal access.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="odoo-card p-8">
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1">Full Name / Organization *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
                <input
                  type="password"
                  required
                  placeholder=">8 characters, uppercase, lowercase & symbol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>Register Account</span>
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-xs text-[#714B67] hover:underline font-semibold">
              Already have an account? Sign in &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
