'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  X,
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

  // Cancel modal
  const [cancelSubId, setCancelSubId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

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

  const handleExecuteCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelSubId) return;
    setCancelling(true);
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${cancelSubId}/request-cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason || 'Customer requested closure' }),
      });
      if (res.success) {
        setCancelSubId(null);
        setCancelReason('');
        loadCustomerData();
      } else {
        alert(res.message || 'Cancellation request failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setCancelling(false);
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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121214]">
      {/* Top Customer Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#714B67] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100 block">
                SubFlow Self-Service Portal
              </span>
              <span className="block text-xs text-zinc-400">
                {customer?.company || customer?.name || 'Customer Organization'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                href="/"
                className="btn-odoo-primary text-xs"
              >
                Back to Admin Dashboard
              </Link>
            )}
            <button
              onClick={logout}
              className="btn-odoo-secondary text-xs"
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
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'subscriptions'
                ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Repeat size={15} />
            <span>My Subscriptions ({subscriptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Receipt size={15} />
            <span>My Invoices ({invoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <CreditCard size={15} />
            <span>Payment Receipts ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#714B67] text-[#714B67] dark:border-purple-400 dark:text-purple-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <User size={15} />
            <span>Billing Profile</span>
          </button>
        </div>

        {/* Tab 1: Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {loading ? (
              <div className="odoo-card p-12 text-center text-zinc-500 text-xs">
                <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                Loading your contracts...
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="odoo-card p-12 text-center text-xs text-zinc-500">
                <Repeat size={36} className="mx-auto mb-2 opacity-50 text-[#714B67]" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">No active subscriptions currently on file</p>
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="odoo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#714B67]/40 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
                        {sub.subscriptionNumber}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>

                    <h3 className="font-heading font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
                      {sub.plan.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <Calendar size={13} className="text-[#714B67]" />
                      <span>Next Billing Cycle: <strong className="text-zinc-900 dark:text-zinc-100">{formatDate(sub.nextBillingDate)}</strong> ({sub.billingInterval})</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Recurring Total</span>
                      <span className="text-2xl font-extrabold font-heading text-[#714B67] dark:text-purple-300 tabular-nums">
                        {formatCurrency(sub.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handlePause(sub.id)}
                          className="btn-odoo-secondary text-xs"
                        >
                          <Pause size={13} className="text-amber-600" />
                          <span>Pause Plan</span>
                        </button>
                      ) : sub.status === 'PAUSED' ? (
                        <button
                          type="button"
                          onClick={() => handleResume(sub.id)}
                          className="btn-odoo-primary bg-emerald-600 hover:bg-emerald-700 text-xs"
                        >
                          <Play size={13} />
                          <span>Resume Plan</span>
                        </button>
                      ) : null}

                      {sub.status !== 'CLOSED' && sub.autoRenew && (
                        <button
                          type="button"
                          onClick={() => setCancelSubId(sub.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm"
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
                <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">PDF Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        No invoices on file.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">{formatDate(inv.invoiceDate)}</td>
                        <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">{formatDate(inv.dueDate)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold tabular-nums">
                          {Number(inv.outstandingAmount) > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {formatCurrency(inv.outstandingAmount)}
                            </span>
                          ) : (
                            <span className="text-zinc-400">₹0.00</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`http://localhost:4000/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-[#714B67] text-zinc-700 dark:text-zinc-300 hover:text-[#714B67] dark:hover:text-purple-300 transition-colors shadow-sm"
                          >
                            <Download size={13} />
                            <span>Download PDF</span>
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
                <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">UTR Reference</th>
                    <th className="py-3 px-4">Amount Reconciled</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        No payment records yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                          {p.paymentNumber}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">{formatDate(p.paymentDate)}</td>
                        <td className="py-3.5 px-4 uppercase font-bold text-[10px] text-zinc-600 dark:text-zinc-400">{p.paymentMethod}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{p.reference || '—'}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={p.status} />
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
          <div className="odoo-card p-6 max-w-lg space-y-4">
            <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Update Billing Profile Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Company / Organization</label>
                <input
                  type="text"
                  disabled
                  value={customer?.company || customer?.name || ''}
                  className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-not-allowed text-zinc-400 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Billing Email</label>
                <input
                  type="email"
                  disabled
                  value={customer?.email || ''}
                  className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-not-allowed text-zinc-400 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Billing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-odoo-primary text-xs"
                >
                  {savingProfile && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cancellation Modal */}
        {cancelSubId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Request Subscription Cancellation
                </h3>
                <button
                  type="button"
                  onClick={() => setCancelSubId(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleExecuteCancel} className="py-4 space-y-4 text-xs">
                <p className="text-zinc-500">
                  Please let us know the reason for cancellation. Your feedback helps us improve SubFlow services.
                </p>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Cancellation Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Budget cut, project ended, or switching stack..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCancelSubId(null)}
                    className="btn-odoo-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cancelling}
                    className="btn-odoo-primary bg-rose-600 hover:bg-rose-700 text-xs"
                  >
                    {cancelling && <Loader2 size={13} className="animate-spin" />}
                    <span>Confirm Cancellation</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
