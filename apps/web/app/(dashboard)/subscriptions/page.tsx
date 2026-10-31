'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Repeat,
  Search,
  Pause,
  Play,
  Ban,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action Modals State
  const [actionTarget, setActionTarget] = useState<any>(null);
  const [actionType, setActionType] = useState<'pause' | 'cancel' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

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
    const timer = setTimeout(() => {
      fetchSubscriptions();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget || !actionType) return;

    setSubmittingAction(true);
    try {
      const endpoint =
        actionType === 'pause'
          ? `/api/subscriptions/${actionTarget.id}/pause`
          : `/api/subscriptions/${actionTarget.id}/cancel`;

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: actionReason || 'Operational adjustment' }),
      });

      if (res.success) {
        setActionTarget(null);
        setActionType(null);
        setActionReason('');
        fetchSubscriptions();
      } else {
        alert(res.message || `Failed to ${actionType} subscription`);
      }
    } catch (e: any) {
      alert(e.message || 'Action error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResume = async (sub: any) => {
    try {
      const res = await apiRequest(`/api/subscriptions/${sub.id}/resume`, { method: 'POST' });
      if (res.success) fetchSubscriptions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Subscription Lifecycle"
          subtitle="Manage recurring customer contracts, automated billing intervals, pauses, and cancellations."
          badge={subscriptions.length ? `${subscriptions.length} contracts` : undefined}
          secondaryActions={[
            {
              label: 'Quotations',
              icon: FileSpreadsheet,
              href: '/quotations',
            },
          ]}
          primaryAction={{
            label: 'New Quotation',
            icon: Plus,
            href: '/quotations',
          }}
          search={{
            value: search,
            onChange: setSearch,
            onSubmit: () => fetchSubscriptions(),
            placeholder: 'Search by subscription # or customer name...',
          }}
          filter={{
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PAUSED', label: 'Paused' },
              { value: 'CLOSED', label: 'Closed / Cancelled' },
            ],
          }}
        />

        {/* Subscriptions Table */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Cadence</th>
                  <th className="py-3 px-4">Next Billing Date</th>
                  <th className="py-3 px-4">Recurring Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading subscription contracts...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500">
                      <Repeat size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No subscriptions found</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Activate accepted quotations to initiate recurring subscriptions.</p>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                        {s.subscriptionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.customer.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{s.plan.name}</span>
                        <span className="block text-[10px] text-zinc-400 uppercase font-semibold mt-0.5">
                          {s.billingInterval} INTERVAL
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                          <Calendar size={13} className="text-[#714B67]" />
                          <span>{formatDate(s.nextBillingDate)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-base text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionTarget(s);
                                setActionType('pause');
                                setActionReason('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-amber-300 bg-amber-50/60 text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
                              title="Pause Subscription"
                            >
                              <Pause size={12} />
                              <span>Pause</span>
                            </button>
                          )}
                          {s.status === 'PAUSED' && (
                            <button
                              type="button"
                              onClick={() => handleResume(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                              title="Resume Subscription"
                            >
                              <Play size={12} />
                              <span>Resume</span>
                            </button>
                          )}
                          {s.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionTarget(s);
                                setActionType('cancel');
                                setActionReason('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm"
                              title="Cancel Contract"
                            >
                              <Ban size={12} />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Confirmation Modal (Pause or Cancel) */}
        {actionTarget && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${
                      actionType === 'pause'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                    }`}
                  >
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100 capitalize">
                      {actionType} Subscription
                    </h3>
                    <p className="text-xs font-mono text-[#714B67] dark:text-purple-300">
                      {actionTarget.subscriptionNumber} &bull; {actionTarget.customer.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActionTarget(null);
                    setActionType(null);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleExecuteAction} className="py-4 space-y-4 text-xs">
                <p className="text-zinc-600 dark:text-zinc-400">
                  {actionType === 'pause'
                    ? 'Pausing will temporarily halt recurring invoice generation for this subscription.'
                    : 'Cancelling will mark this subscription as CLOSED and record churn audit history.'}
                </p>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Reason / Operational Note *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={
                      actionType === 'pause'
                        ? 'e.g. Client requested temporary hold for seasonal break'
                        : 'e.g. Budget cut / switched to alternate vendor'
                    }
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActionTarget(null);
                      setActionType(null);
                    }}
                    className="btn-odoo-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className={`btn-odoo-primary text-xs ${
                      actionType === 'cancel'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {submittingAction && <Loader2 size={13} className="animate-spin" />}
                    <span>Confirm {actionType === 'pause' ? 'Pause' : 'Cancellation'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
