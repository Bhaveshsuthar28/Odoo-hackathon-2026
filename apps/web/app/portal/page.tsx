'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
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
  ChevronRight,
} from 'lucide-react';

export default function CustomerPortalPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices' | 'payments' | 'profile'>('subscriptions');
  const [customer, setCustomer] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

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
      if (sRes.success && sRes.data) setSubscriptions(sRes.data.subscriptions);
      if (iRes.success && iRes.data) setInvoices(sRes.data.invoices || iRes.data.invoices);
      if (pRes.success && pRes.data) setPayments(pRes.data.payments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomerData();
  }, []);

  const handlePause = async (subId: string) => {
    if (!confirm('Are you sure you want to pause this subscription?')) return;
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${subId}/pause`, { method: 'POST' });
      if (res.success) {
        alert('Subscription paused.');
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
        alert('Subscription resumed.');
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestCancel = async (subId: string) => {
    const reason = prompt('Please share why you wish to cancel:');
    if (!reason) return;
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${subId}/request-cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res.success) {
        alert(res.message);
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiRequest('/api/portal/me', {
        method: 'PUT',
        body: JSON.stringify({ phone, addressLine1: address, city }),
      });
      if (res.success) {
        alert('Profile details updated successfully');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#121214]">
      {/* Top Customer Header */}
      <header className="bg-white dark:bg-[#18181B] border-b border-[#E5E7EB] dark:border-[#27272A] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#714B67] text-white flex items-center justify-center font-bold text-lg">
              S
            </div>
            <div>
              <span className="font-heading font-bold text-base text-[#252525] dark:text-white">
                SubFlow Customer Portal
              </span>
              <span className="block text-[11px] text-[#737373]">
                {customer?.company || customer?.name || 'Self-Service Billing'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                href="/"
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#714B67] text-white hover:bg-[#55364E]"
              >
                Back to Admin Dashboard
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#252525] dark:hover:text-white px-2.5 py-1.5 rounded-md border"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E5E7EB] dark:border-[#27272A] space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'subscriptions'
                ? 'border-[#714B67] text-[#714B67] dark:text-purple-300'
                : 'border-transparent text-[#737373] hover:text-[#252525]'
            }`}
          >
            <Repeat size={15} />
            <span>My Subscriptions ({subscriptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'invoices'
                ? 'border-[#714B67] text-[#714B67] dark:text-purple-300'
                : 'border-transparent text-[#737373] hover:text-[#252525]'
            }`}
          >
            <Receipt size={15} />
            <span>My Invoices ({invoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-[#714B67] text-[#714B67] dark:text-purple-300'
                : 'border-transparent text-[#737373] hover:text-[#252525]'
            }`}
          >
            <CreditCard size={15} />
            <span>Payment Receipts ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-[#714B67] text-[#714B67] dark:text-purple-300'
                : 'border-transparent text-[#737373] hover:text-[#252525]'
            }`}
          >
            <User size={15} />
            <span>Billing Profile</span>
          </button>
        </div>

        {/* Tab 1: Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="odoo-card p-12 text-center text-xs text-[#737373]">
                <Repeat size={36} className="mx-auto mb-2 opacity-50" />
                No active subscriptions currently on file.
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="odoo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
                        {sub.subscriptionNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-[#252525] dark:text-white">
                      {sub.plan.name}
                    </h3>
                    <p className="text-xs text-[#737373] mt-1">
                      Next Billing Cycle: <strong className="text-[#252525] dark:text-white">{formatDate(sub.nextBillingDate)}</strong> ({sub.billingInterval})
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-[#737373] block">Recurring Total</span>
                      <span className="text-xl font-extrabold font-heading text-[#714B67] dark:text-purple-300">
                        {formatCurrency(sub.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handlePause(sub.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded border border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          Pause Plan
                        </button>
                      ) : sub.status === 'PAUSED' ? (
                        <button
                          onClick={() => handleResume(sub.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Resume Plan
                        </button>
                      ) : null}

                      {sub.status !== 'CLOSED' && sub.autoRenew && (
                        <button
                          onClick={() => handleRequestCancel(sub.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          Request Cancellation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Invoices */}
        {activeTab === 'invoices' && (
          <div className="odoo-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#737373]">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="py-3 px-4 font-bold text-[#714B67] dark:text-purple-300">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-[#737373]">{formatDate(inv.invoiceDate)}</td>
                        <td className="py-3 px-4 text-[#737373]">{formatDate(inv.dueDate)}</td>
                        <td className="py-3 px-4 font-bold">{formatCurrency(inv.totalAmount)}</td>
                        <td className="py-3 px-4 font-semibold text-rose-600">
                          {formatCurrency(inv.outstandingAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`http://localhost:4000/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border hover:bg-black/5 text-[#737373]"
                          >
                            <Download size={12} />
                            <span>PDF</span>
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

        {/* Tab 3: Payments */}
        {activeTab === 'payments' && (
          <div className="odoo-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#737373]">
                        No payment records yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="py-3 px-4 font-bold text-[#714B67] dark:text-purple-300">
                          {p.paymentNumber}
                        </td>
                        <td className="py-3 px-4 text-[#737373]">{formatDate(p.paymentDate)}</td>
                        <td className="py-3 px-4 uppercase font-semibold text-[11px]">{p.paymentMethod}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#737373]">{p.reference || '—'}</td>
                        <td className="py-3 px-4 font-extrabold text-emerald-600">{formatCurrency(p.amount)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Profile */}
        {activeTab === 'profile' && (
          <div className="odoo-card p-6 max-w-lg">
            <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white mb-4">
              Update Billing Profile Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Company / Organization</label>
                <input
                  type="text"
                  disabled
                  value={customer?.company || customer?.name || ''}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 border rounded-md cursor-not-allowed text-[#737373]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Billing Email</label>
                <input
                  type="email"
                  disabled
                  value={customer?.email || ''}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 border rounded-md cursor-not-allowed text-[#737373]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Billing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#55364E] text-white rounded font-semibold flex items-center gap-1.5"
                >
                  {savingProfile && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
