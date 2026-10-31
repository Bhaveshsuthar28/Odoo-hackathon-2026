'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Loader2, Sparkles } from 'lucide-react';
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
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Revenue Leakage Detector"
          subtitle="Identify uncollected cash, failed transactions, churn-risk accounts, and execute immediate recovery."
          badge="INTELLIGENCE ENGINE"
          primaryAction={{
            label: 'Launch Recovery Center',
            icon: ArrowRight,
            href: '/recovery',
          }}
        />

        {/* Hero Revenue at Risk Card */}
        <div className="odoo-card p-6 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/50 dark:from-rose-950/30 dark:via-zinc-900 dark:to-amber-950/20 border-rose-200 dark:border-rose-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-rose-700 dark:text-rose-400">
                  Total Outstanding Cashflow at Risk
                </span>
              </div>
              <p className="text-4xl sm:text-5xl font-extrabold font-heading text-rose-600 dark:text-rose-400 mt-2 tracking-tight tabular-nums">
                {formatCurrency(summary.totalRevenueAtRisk)}
              </p>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-normal">
                Aggregated from <strong className="text-zinc-900 dark:text-zinc-100">{summary.failedPaymentsCount}</strong> failed payment attempts and <strong className="text-zinc-900 dark:text-zinc-100">{summary.overdueInvoicesCount}</strong> overdue customer invoices.
              </p>
            </div>
            <Link
              href="/recovery"
              className="btn-odoo-primary bg-rose-600 hover:bg-rose-700 self-start md:self-center text-xs sm:text-sm py-2.5 px-4 shadow-md"
            >
              <span>Automate Dunning & Recovery</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#714B67]" />
            <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100">
              Actionable Financial Recommendations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.recommendations?.map((rec: any, i: number) => (
              <div
                key={i}
                className="odoo-card p-5 border-l-4 border-l-amber-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                      {rec.category}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      Est. Recovery: {formatCurrency(rec.potentialRecovery)}
                    </span>
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {rec.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed Payment Audit */}
        {data?.failedPayments?.length > 0 && (
          <div className="odoo-card p-5">
            <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Failed Transactions Requiring Dunning
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {data.failedPayments.map((p: any) => (
                <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-lg transition-colors">
                  <div>
                    <span className="font-mono font-bold text-[#714B67] dark:text-purple-300">{p.paymentNumber}</span>
                    <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">{p.customer.name}</span>
                    <span className="ml-2 text-rose-600 font-medium text-[11px]">({p.failureReason || 'Declined'})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(p.amount)}</span>
                    <Link
                      href="/recovery"
                      className="px-2.5 py-1 text-xs rounded-md bg-[#714B67] hover:bg-[#55364E] text-white font-semibold transition-colors"
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
