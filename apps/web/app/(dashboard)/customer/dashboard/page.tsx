'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Repeat,
  Receipt,
  CreditCard,
  User,
  Download,
  Pause,
  Play,
  Ban,
  LogOut,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Mail,
  AlertCircle,
  ExternalLink,
  KeyRound,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices' | 'payments' | 'profile'>('subscriptions');
  const [customer, setCustomer] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Role Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/customer/login');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'STAFF') {
        router.push('/staff/dashboard');
      }
    }
  }, [user, authLoading, router]);

  async function loadCustomerData() {
    setLoading(true);
    try {
      const [cRes, sRes, iRes, pRes] = await Promise.all([
        apiRequest('/api/portal/me'),
        apiRequest('/api/portal/subscriptions'),
        apiRequest('/api/portal/invoices'),
        apiRequest('/api/portal/payments'),
      ]);

      if (cRes.success && cRes.data) {
        setCustomer(cRes.data.customer);
        setPhone(cRes.data.customer.phone || '');
        setAddress(cRes.data.customer.addressLine1 || '');
        setCity(cRes.data.customer.city || '');
      }
      if (sRes.success && sRes.data) setSubscriptions(sRes.data.subscriptions || []);
      if (iRes.success && iRes.data) setInvoices(iRes.data.invoices || []);
      if (pRes.success && pRes.data) setPayments(pRes.data.payments || []);
    } catch (e) {
      console.error('Failed to load customer data', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      loadCustomerData();
    }
  }, [user]);

  const handlePause = async (subId: string) => {
    if (!confirm('Are you sure you want to pause this subscription?')) return;
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${subId}/pause`, { method: 'POST' });
      if (res.success) {
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResume = async (subId: string) => {
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${subId}/resume`, { method: 'POST' });
      if (res.success) {
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const res = await apiRequest('/api/portal/me', {
        method: 'PUT',
        body: JSON.stringify({ phone, addressLine1: address, city }),
      });
      if (res.success) {
        setProfileMsg('Contact information updated successfully.');
      }
    } catch (e) {
      setProfileMsg('Failed to update details.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Metrics calculation
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
  const outstandingTotal = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.outstandingAmount) || 0), 0);
  const totalPaidInvoices = invoices.filter((i) => i.status === 'PAID').length;

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#121214]">
      {/* Top Customer Portal Navigation */}
      <header className="bg-white dark:bg-[#1C1C1F] border-b border-[#E5E7EB] dark:border-[#2E2E32] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-extrabold text-xl font-heading shadow-md">
              S
            </div>
            <div>
              <span className="font-heading font-extrabold text-base tracking-tight text-[#252525] dark:text-white">
                SubFlow
              </span>
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                Customer Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-[#252525] dark:text-white">{user?.name}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> {user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#2E2E32] text-xs font-semibold text-[#737373] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-emerald-100 mb-2">
              <ShieldCheck size={14} className="text-emerald-300" />
              Verified Gmail Subscriber Account
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
              Welcome, {user?.name || 'Valued Subscriber'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
              Manage your active recurring subscriptions, download tax invoices, view transaction history, and configure renewal preferences.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/customer/forgot-password"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs transition-colors"
            >
              <KeyRound size={14} />
              Reset Password
            </Link>
          </div>
        </div>

        {/* Customer KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
              <span>Active Subscriptions</span>
              <Repeat size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-heading text-[#252525] dark:text-white">{activeSubs}</p>
            <p className="text-[11px] text-[#737373] mt-1">Currently renewing</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
              <span>Paid Invoices</span>
              <Receipt size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold font-heading text-[#252525] dark:text-white">{totalPaidInvoices}</p>
            <p className="text-[11px] text-[#737373] mt-1">Settled invoices to date</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
              <span>Outstanding Due</span>
              <CreditCard size={18} className="text-rose-600" />
            </div>
            <p className="text-2xl font-bold font-heading text-[#252525] dark:text-white">
              {formatCurrency(outstandingTotal)}
            </p>
            <p className="text-[11px] text-[#737373] mt-1">{unpaidInvoices.length} pending payments</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
              <span>Security Status</span>
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Verified OTP
            </p>
            <p className="text-[11px] text-[#737373] mt-1">Gmail identity secured</p>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#2E2E32] pb-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-[#714B67] text-white shadow-sm'
                : 'text-[#737373] hover:text-[#252525] dark:hover:text-white'
            }`}
          >
            <Repeat size={15} />
            My Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'invoices'
                ? 'bg-[#714B67] text-white shadow-sm'
                : 'text-[#737373] hover:text-[#252525] dark:hover:text-white'
            }`}
          >
            <Receipt size={15} />
            Invoices &amp; Receipts ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'payments'
                ? 'bg-[#714B67] text-white shadow-sm'
                : 'text-[#737373] hover:text-[#252525] dark:hover:text-white'
            }`}
          >
            <CreditCard size={15} />
            Payment Records ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-[#714B67] text-white shadow-sm'
                : 'text-[#737373] hover:text-[#252525] dark:hover:text-white'
            }`}
          >
            <User size={15} />
            Account &amp; Security
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="p-12 text-center text-[#737373]">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#714B67]" />
            Loading your subscriber portal...
          </div>
        ) : (
          <div>
            {/* 1. Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#1C1C1F] rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32]">
                    <Repeat size={32} className="mx-auto text-[#737373] mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-[#252525] dark:text-white">No subscriptions active</p>
                    <p className="text-xs text-[#737373] mt-1">You do not have any recurring plans associated with this account.</p>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white dark:bg-[#1C1C1F] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-[#252525] dark:text-white font-heading">
                            {sub.plan?.name || 'Custom Subscription Plan'}
                          </h3>
                          <StatusBadge status={sub.status} />
                        </div>
                        <p className="text-xs text-[#737373]">
                          Subscription #{sub.subscriptionNumber} • Interval: {sub.billingInterval}
                        </p>
                        <p className="text-xs text-[#737373] mt-1 flex items-center gap-1.5">
                          <Calendar size={13} />
                          Next renewal date:{' '}
                          <strong className="text-[#252525] dark:text-white">
                            {formatDate(sub.nextBillingDate)}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#F1F1F3] dark:border-[#27272A]">
                        <div className="text-left md:text-right">
                          <p className="text-lg font-bold font-heading text-[#252525] dark:text-white">
                            {formatCurrency(sub.totalAmount)}
                          </p>
                          <p className="text-[11px] text-[#737373]">per {sub.billingInterval.toLowerCase()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {sub.status === 'ACTIVE' && (
                            <button
                              onClick={() => handlePause(sub.id)}
                              className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold flex items-center gap-1"
                            >
                              <Pause size={13} /> Pause
                            </button>
                          )}
                          {sub.status === 'PAUSED' && (
                            <button
                              onClick={() => handleResume(sub.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <Play size={13} /> Resume
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] font-semibold border-b border-[#E5E7EB] dark:border-[#2E2E32]">
                      <tr>
                        <th className="px-6 py-3.5">Invoice #</th>
                        <th className="px-6 py-3.5">Issue Date</th>
                        <th className="px-6 py-3.5">Due Date</th>
                        <th className="px-6 py-3.5">Total Amount</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">PDF Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F1F3] dark:divide-[#2E2E32]">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-[#737373]">
                            No invoices generated for your account yet.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#232326] transition-colors">
                            <td className="px-6 py-4 font-bold text-[#252525] dark:text-white">
                              {inv.invoiceNumber}
                            </td>
                            <td className="px-6 py-4 text-[#737373]">{formatDate(inv.issueDate)}</td>
                            <td className="px-6 py-4 text-[#737373]">{formatDate(inv.dueDate)}</td>
                            <td className="px-6 py-4 font-bold text-[#252525] dark:text-white">
                              {formatCurrency(inv.totalAmount)}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={inv.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <a
                                href={`/api/portal/invoices/${inv.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#2E2E32] text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                              >
                                <Download size={13} />
                                Download PDF
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Payments Tab */}
            {activeTab === 'payments' && (
              <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] font-semibold border-b border-[#E5E7EB] dark:border-[#2E2E32]">
                      <tr>
                        <th className="px-6 py-3.5">Payment Ref</th>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Method</th>
                        <th className="px-6 py-3.5">Amount</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F1F3] dark:divide-[#2E2E32]">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-[#737373]">
                            No payments recorded yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#232326] transition-colors">
                            <td className="px-6 py-4 font-bold text-[#252525] dark:text-white">
                              {pay.paymentNumber}
                            </td>
                            <td className="px-6 py-4 text-[#737373]">{formatDate(pay.paymentDate)}</td>
                            <td className="px-6 py-4 text-[#737373]">{pay.paymentMethod}</td>
                            <td className="px-6 py-4 font-bold text-emerald-600">
                              {formatCurrency(pay.amount)}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={pay.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Profile & Security Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl bg-white dark:bg-[#1C1C1F] p-8 rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#252525] dark:text-white font-heading">
                    Account Information &amp; Verification
                  </h3>
                  <p className="text-xs text-[#737373]">
                    Your account is securely verified via Google Gmail OTP
                  </p>
                </div>

                {profileMsg && (
                  <div className="p-3 rounded-xl bg-purple-50 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 text-xs flex items-center gap-2 border border-purple-200">
                    <CheckCircle2 size={15} />
                    <span>{profileMsg}</span>
                  </div>
                )}

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                      Verified Gmail Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] cursor-not-allowed"
                      />
                      <span className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Verified
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-[#F1F1F3] dark:border-[#2E2E32]">
                    <h4 className="font-bold text-[#252525] dark:text-white">Billing Contact Details</h4>
                    <div>
                      <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-white dark:bg-[#121214] text-[#252525] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                        Billing Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street address"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-white dark:bg-[#121214] text-[#252525] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-white dark:bg-[#121214] text-[#252525] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving...' : 'Update Details'}
                    </button>
                  </form>

                  <div className="pt-6 border-t border-[#F1F1F3] dark:border-[#2E2E32] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#252525] dark:text-white">Security &amp; Password</p>
                      <p className="text-[11px] text-[#737373]">Need to change or recover your password?</p>
                    </div>
                    <Link
                      href="/customer/forgot-password"
                      className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#2E2E32] text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:bg-purple-50"
                    >
                      Reset Password
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
