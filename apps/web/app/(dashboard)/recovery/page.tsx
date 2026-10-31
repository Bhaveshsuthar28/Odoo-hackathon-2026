'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

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
        alert(res.message);
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
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300">
              Intelligence Feature 3
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading mt-1">
            Subscription Recovery Center
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
            Automated dunning orchestration, smart retry scheduling, and recovered revenue tracking.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="odoo-card p-5">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1">
              Revenue Recovered
            </span>
            <p className="text-3xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalRecovered)}
            </p>
            <span className="text-xs text-emerald-700/80 mt-1 block">
              {stats.recoveredCount} successful dunning retries
            </span>
          </div>

          <div className="odoo-card p-5">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider block mb-1">
              Pending in Recovery Pipeline
            </span>
            <p className="text-3xl font-extrabold font-heading text-rose-600 dark:text-rose-400">
              {formatCurrency(stats.totalAtRisk)}
            </p>
            <span className="text-xs text-[#737373] mt-1 block">
              {stats.pendingCount} accounts in automated dunning
            </span>
          </div>
        </div>

        {/* Recovery Table */}
        <div className="odoo-card overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#27272A] flex justify-between items-center">
            <h3 className="font-heading font-bold text-sm text-[#252525] dark:text-white">
              Recovery Accounts & Retry Queue
            </h3>
            <span className="text-xs text-[#737373]">
              Safe automated dunning simulations enabled for hackathon environment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">At Risk Amount</th>
                  <th className="py-3 px-4">Retry Count</th>
                  <th className="py-3 px-4">Next Scheduled Retry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Recovery Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#737373]">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading recovery records...
                    </td>
                  </tr>
                ) : data?.recoveries?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#737373]">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                      Zero failed payments in the dunning pipeline!
                    </td>
                  </tr>
                ) : (
                  data?.recoveries?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#714B67] dark:text-purple-300">
                        {r.invoice.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#252525] dark:text-white">
                        {r.customer.name}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-rose-600">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {r.retryCount} / {r.maxRetries}
                      </td>
                      <td className="py-3.5 px-4 text-[#737373]">
                        {formatDate(r.nextRetryDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'RECOVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status !== 'RECOVERED' ? (
                          <button
                            onClick={() => handleRetry(r.id)}
                            disabled={retryingId === r.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm disabled:opacity-50"
                          >
                            {retryingId === r.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <RefreshCw size={12} />
                            )}
                            <span>Simulate Retry Now</span>
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 size={13} /> Recovered
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
