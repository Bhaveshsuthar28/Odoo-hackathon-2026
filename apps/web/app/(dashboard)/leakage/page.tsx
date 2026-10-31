'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LeakagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadLeakageData() {
    setLoading(true);
    try {
      const res = await apiRequest('/api/leakage');
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
    loadLeakageData();
  }, []);

  const summary = data?.summary || {
    totalRevenueAtRisk: 0,
    failedPaymentsCount: 0,
    overdueInvoicesCount: 0,
    expiringSubscriptionsCount: 0,
    skippedBillingCount: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300">
              Intelligence Feature 1
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading mt-1">
            Revenue Leakage Detector
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
            Identify uncollected cash, failed transactions, churn-risk accounts, and immediate recovery actions.
          </p>
        </div>

        {/* Hero Revenue at Risk Card */}
        <div className="odoo-card p-6 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border-rose-200 dark:border-rose-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400">
                Total Potential Revenue at Risk
              </span>
              <p className="text-4xl font-extrabold font-heading text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(summary.totalRevenueAtRisk)}
              </p>
              <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-1">
                Aggregated from {summary.failedPaymentsCount} payment failures and {summary.overdueInvoicesCount} overdue invoice accounts.
              </p>
            </div>
            <Link
              href="/recovery"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all self-start md:self-center"
            >
              <span>Launch Recovery Center</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
            Actionable Financial Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.recommendations?.map((rec: any, i: number) => (
              <div key={i} className="odoo-card p-5 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                    {rec.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    Est. Recovery: {formatCurrency(rec.potentialRecovery)}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-sm text-[#252525] dark:text-white mt-2">
                  {rec.title}
                </h4>
                <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-1">
                  {rec.action}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Failed Payment Audit */}
        {data?.failedPayments?.length > 0 && (
          <div className="odoo-card p-5">
            <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white mb-3">
              Failed Transactions Requiring Dunning
            </h3>
            <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A] text-xs">
              {data.failedPayments.map((p: any) => (
                <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#714B67] dark:text-purple-300">{p.paymentNumber}</span>
                    <span className="ml-2 font-semibold text-[#252525] dark:text-white">{p.customer.name}</span>
                    <span className="ml-2 text-rose-600 font-medium">({p.failureReason || 'Declined'})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-rose-600">{formatCurrency(p.amount)}</span>
                    <Link
                      href="/recovery"
                      className="px-2.5 py-1 text-[11px] rounded bg-[#714B67] text-white font-semibold"
                    >
                      Retry in Recovery Center
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
