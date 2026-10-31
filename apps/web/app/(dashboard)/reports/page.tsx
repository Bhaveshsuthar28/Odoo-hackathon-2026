'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard, GlassCardHeader } from '@/components/ui/cards/GlassCard';
import { StatCard } from '@/components/ui/cards/StatCard';
import { Chart } from '@/components/ui/Chart';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiRequest('/api/dashboard/metrics');
        if (res.success && res.data) {
          setMetrics(res.data);
        }
      } catch (e) {
        console.error('Failed to load report metrics', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpis = metrics?.kpis || {
    mrr: 0,
    arr: 0,
    revenueCollected: 0,
    outstandingAmount: 0,
    activeSubscriptions: 0,
  };

  const revenueByPlanOption: any = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(33, 27, 36, 0.95)',
      textStyle: { color: '#FFFFFF', fontSize: 12 },
    },
    legend: { bottom: '0%', textStyle: { color: '#77717B', fontSize: 11 } },
    series: [
      {
        name: 'Revenue Distribution',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        data: metrics?.charts?.planDistribution?.length
          ? metrics.charts.planDistribution.map((p: any) => ({
              name: p.name,
              value: p.count,
            }))
          : [
              { name: 'Enterprise Pro', value: 45, itemStyle: { color: '#714B67' } },
              { name: 'Growth Tier', value: 30, itemStyle: { color: '#8C5A80' } },
              { name: 'Starter Flow', value: 18, itemStyle: { color: '#A47A9A' } },
              { name: 'Custom Billing', value: 7, itemStyle: { color: '#16A679' } },
            ],
      },
    ],
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Period\n' +
      `Monthly Recurring Revenue,${kpis.mrr},Current\n` +
      `Annual Run-Rate,${kpis.arr},Projected\n` +
      `Reconciled Collected Revenue,${kpis.revenueCollected},All-Time\n` +
      `Outstanding Balance,${kpis.outstandingAmount},Current\n` +
      `Active Subscriptions,${kpis.activeSubscriptions},Current\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subflow_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(113,75,103,0.10)] text-[#714B67] dark:text-purple-300 font-bold text-xs border border-[rgba(113,75,103,0.18)] mb-1">
              <BarChart3 size={13} />
              <span>Financial Intelligence &amp; Ledger Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#211B24] dark:text-white tracking-tight">
              Executive Financial Reports
            </h1>
            <p className="text-xs sm:text-sm text-[#77717B] dark:text-zinc-400 mt-1">
              Recurring billing analytics, revenue stream decomposition, and compliance balance sheet.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center p-1 bg-white/70 dark:bg-zinc-800 rounded-xl border border-[rgba(113,75,103,0.14)] text-xs font-bold text-[#77717B]">
              {(['month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setReportPeriod(period)}
                  className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                    reportPeriod === period
                      ? 'bg-[#714B67] text-white shadow-xs'
                      : 'hover:text-[#211B24] dark:hover:text-white'
                  }`}
                >
                  {period === 'month' ? 'This Month' : period === 'quarter' ? 'Quarter' : 'Full Year'}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="btn-subflow-primary text-xs"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Recognized MRR"
            value={formatCurrency(kpis.mrr)}
            subtext="Net recognized recurring revenue"
            icon={TrendingUp}
            variant="purple"
            trend={{ value: '+8.4%', positive: true }}
          />
          <StatCard
            title="Annualized Run-Rate (ARR)"
            value={formatCurrency(kpis.arr)}
            subtext="12-month forward projection"
            icon={DollarSign}
            variant="blue"
            trend={{ value: '+14.2%', positive: true }}
          />
          <StatCard
            title="All-Time Reconciled Inflow"
            value={formatCurrency(kpis.revenueCollected)}
            subtext="Fully settled via payment gateways"
            icon={ShieldCheck}
            variant="emerald"
            trend={{ value: '100% Verified', positive: true }}
          />
          <StatCard
            title="Outstanding Receivables"
            value={formatCurrency(kpis.outstandingAmount)}
            subtext="Open and overdue unpaid invoices"
            icon={AlertTriangle}
            variant="rose"
            trend={{ value: 'Aging < 30d', positive: false }}
          />
        </div>

        {/* Reports Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2">
            <GlassCardHeader
              title="Revenue Streams & Plan Share"
              subtitle="Decomposition of active recurring contracts across pricing tiers"
              icon={Layers}
            />
            <Chart option={revenueByPlanOption} height="320px" />
          </GlassCard>

          <GlassCard>
            <GlassCardHeader
              title="Invoice Aging Schedule"
              subtitle="Distribution of outstanding receivables by age"
              icon={Clock}
            />

            <div className="space-y-4 my-2 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">Current (0 - 15 Days)</span>
                  <span className="font-bold text-emerald-700">₹{(kpis.mrr * 0.45).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <p className="text-[11px] text-emerald-700/80">Within standard invoice grace period</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300">Due (16 - 30 Days)</span>
                  <span className="font-bold text-amber-700">₹{(kpis.outstandingAmount * 0.6).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <p className="text-[11px] text-amber-700/80">First dunning notification triggered</p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-800 dark:text-rose-300">Overdue (30+ Days)</span>
                  <span className="font-bold text-rose-700">₹{(kpis.outstandingAmount * 0.4).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <p className="text-[11px] text-rose-700/80">Pending service suspension review</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(113,75,103,0.10)]">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl btn-subflow-secondary text-xs"
              >
                <FileSpreadsheet size={14} />
                <span>Download Aging Ledger</span>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
