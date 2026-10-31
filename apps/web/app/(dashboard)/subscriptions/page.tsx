'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Repeat, Search, Pause, Play, Ban, X, Loader2, ArrowRight } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
      });
      const res = await apiRequest(`/api/subscriptions?${query.toString()}`);
      if (res.success && res.data) {
        setSubscriptions(res.data.subscriptions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const handlePause = async (id: string) => {
    const reason = prompt('Enter reason for pausing this subscription:');
    if (!reason) return;

    try {
      const res = await apiRequest(`/api/subscriptions/${id}/pause`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res.success) fetchSubscriptions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResume = async (id: string) => {
    try {
      const res = await apiRequest(`/api/subscriptions/${id}/resume`, { method: 'POST' });
      if (res.success) fetchSubscriptions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Enter cancellation reason (churn record):');
    if (!reason) return;

    try {
      const res = await apiRequest(`/api/subscriptions/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res.success) fetchSubscriptions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
              Subscription Management
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Control the complete recurring lifecycle: Active, Paused, Renewing, and Churned accounts.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="odoo-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
            <input
              type="text"
              placeholder="Search by subscription number or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSubscriptions()}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#737373]">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed / Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Subscription #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Interval</th>
                  <th className="py-3 px-4">Next Billing Date</th>
                  <th className="py-3 px-4">Recurring Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#737373]">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading subscriptions...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#737373]">
                      <Repeat size={32} className="mx-auto mb-2 opacity-50" />
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#714B67] dark:text-purple-300">
                        {s.subscriptionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#252525] dark:text-white">
                        {s.customer.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#252525] dark:text-white">{s.plan.name}</span>
                        <span className="block text-[10px] text-[#737373] uppercase">{s.billingInterval}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {formatDate(s.nextBillingDate)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-base text-[#252525] dark:text-white">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {s.status === 'ACTIVE' && (
                          <button
                            onClick={() => handlePause(s.id)}
                            className="px-2.5 py-1 text-xs rounded border border-amber-300 text-amber-700 hover:bg-amber-50"
                            title="Pause Subscription"
                          >
                            Pause
                          </button>
                        )}
                        {s.status === 'PAUSED' && (
                          <button
                            onClick={() => handleResume(s.id)}
                            className="px-2.5 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Resume Subscription"
                          >
                            Resume
                          </button>
                        )}
                        {s.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="px-2.5 py-1 text-xs rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                            title="Cancel Subscription"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
