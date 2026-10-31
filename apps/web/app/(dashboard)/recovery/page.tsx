'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2, DollarSign, ShieldAlert } from 'lucide-react';

export default function RecoveryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function fetchRecovery() {
    setLoading(true);
    try {
      const res = await apiRequest('/api/recovery');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecovery();
  }, []);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await apiRequest(`/api/recovery/${id}/retry`, { method: 'POST' });
      if (res.success) {
        fetchRecovery();
      } else {
        alert(res.message || 'Retry failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setRetryingId(null);
    }
  };

  const stats = data?.stats || {
    recoveredCount: 0,
    pendingCount: 0,
    totalRecovered: 0,
    totalAtRisk: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Subscription Recovery & Dunning"
          subtitle="Automated dunning orchestration, smart retry scheduling, and recovered revenue audit."
          badge="DUNNING ORCHESTRATION"
        />

        {/* 2 Focused Recovery KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Revenue Recovered"
            value={formatCurrency(stats.totalRecovered)}
            subtext={`${stats.recoveredCount} successful dunning retries`}
            icon={DollarSign}
            color="emerald"
          />

          <KpiCard
            title="Pending in Dunning Queue"
            value={formatCurrency(stats.totalAtRisk)}
            subtext={`${stats.pendingCount} accounts in retry cycle`}
            icon={ShieldAlert}
            color="rose"
          />
        </div>

        {/* Recovery Table */}
        <div className="odoo-card overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-[#F9FAFB]/50 dark:bg-zinc-800/30">
            <h3 className="font-heading font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Recovery Accounts & Retry Queue
            </h3>
            <span className="text-xs text-zinc-400">
              Safe simulated dunning enabled for hackathon environment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer Organization</th>
                  <th className="py-3 px-4">At Risk Amount</th>
                  <th className="py-3 px-4">Attempt Status</th>
                  <th className="py-3 px-4">Next Scheduled Retry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Recovery Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading recovery records...
                    </td>
                  </tr>
                ) : data?.recoveries?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500">
                      <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">All payments settled cleanly</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Zero failed transactions in the dunning pipeline.</p>
                    </td>
                  </tr>
                ) : (
                  data?.recoveries?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                        {r.invoice.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.customer.name}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-700 dark:text-zinc-300">
                        Attempt {r.retryCount} of {r.maxRetries}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                        {formatDate(r.nextRetryDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status !== 'RECOVERED' ? (
                          <button
                            type="button"
                            onClick={() => handleRetry(r.id)}
                            disabled={retryingId === r.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm disabled:opacity-50 transition-all"
                          >
                            {retryingId === r.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <RefreshCw size={13} />
                            )}
                            <span>Simulate Retry Now</span>
                          </button>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 text-xs">
                            <CheckCircle2 size={14} /> Recovered
                          </span>
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
