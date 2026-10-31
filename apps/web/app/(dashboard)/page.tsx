'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Chart } from '@/components/ui/Chart';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  TrendingUp,
  Users,
  Repeat,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Receipt,
  CheckCircle2,
  Calendar,
  CreditCard,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await apiRequest('/api/dashboard/metrics');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const kpis = data?.kpis || {
    activeSubscriptions: 0,
    totalCustomers: 0,
    mrr: 0,
    arr: 0,
    revenueCollected: 0,
    outstandingAmount: 0,
    overdueInvoicesCount: 0,
    overdueInvoicesTotal: 0,
    upcomingRenewalsCount: 0,
  };

  // ECharts Options
  const revenueTrendOption: any = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/><strong>₹${Number(item.value).toLocaleString('en-IN')}</strong>`;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: data?.charts?.revenueTrend?.map((d: any) => d.month) || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#737373', fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      axisLabel: {
        color: '#737373',
        fontSize: 11,
        formatter: (val: number) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
      },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [
      {
        name: 'Collected Revenue',
        type: 'line' as const,
        smooth: true,
        data: data?.charts?.revenueTrend?.map((d: any) => d.revenue) || [12000, 15000, 18500, 22000, 19500, 27500],
        itemStyle: { color: '#714B67' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(113, 75, 103, 0.45)' },
              { offset: 1, color: 'rgba(113, 75, 103, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  const statusPieOption: any = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center', textStyle: { color: '#737373', fontSize: 11 } },
    series: [
      {
        name: 'Subscriptions by Status',
        type: 'pie' as const,
        radius: ['52%', '78%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        data: data?.charts?.subscriptionStatus?.map((s: any) => ({
          name: s.status,
          value: s.count,
        })) || [
          { value: 3, name: 'ACTIVE', itemStyle: { color: '#16A34A' } },
          { value: 1, name: 'PAUSED', itemStyle: { color: '#D97706' } },
          { value: 1, name: 'CLOSED', itemStyle: { color: '#737373' } },
        ],
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Signature Control Panel Header */}
        <ControlPanel
          title="Executive Financial Dashboard"
          subtitle="Real-time recurring billing metrics and cashflow aggregated from PostgreSQL transactions."
          badge="LIVE LEDGER"
          secondaryActions={[
            {
              label: `Revenue Leakage (${kpis.overdueInvoicesCount} Alerts)`,
              icon: ShieldAlert,
              href: '/leakage',
            },
          ]}
          primaryAction={{
            label: 'Manage Subscriptions',
            icon: ArrowRight,
            href: '/subscriptions',
          }}
        />

        {/* 8 Primary Financial KPI Cards with large typography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(kpis.mrr)}
            trend={{ value: 'Normalized Active MRR', positive: true }}
            icon={TrendingUp}
            color="purple"
            href="/subscriptions"
          />

          <KpiCard
            title="Annual Recurring Revenue"
            value={formatCurrency(kpis.arr)}
            subtext="Projected 12-month run rate"
            icon={Repeat}
            color="purple"
            href="/subscriptions"
          />

          <KpiCard
            title="Revenue Collected"
            value={formatCurrency(kpis.revenueCollected)}
            subtext="Reconciled cash received"
            icon={DollarSign}
            color="emerald"
            href="/payments"
          />

          <KpiCard
            title="Outstanding Balance"
            value={formatCurrency(kpis.outstandingAmount)}
            subtext="Unpaid invoice total"
            icon={Receipt}
            color="amber"
            href="/invoices?status=CONFIRMED"
          />

          <KpiCard
            title="Active Subscriptions"
            value={kpis.activeSubscriptions}
            subtext="Generating recurring cycles"
            icon={Repeat}
            color="blue"
            href="/subscriptions"
          />

          <KpiCard
            title="Total Customers"
            value={kpis.totalCustomers}
            subtext="Registered client organizations"
            icon={Users}
            color="blue"
            href="/customers"
          />

          <KpiCard
            title="Overdue Invoices"
            value={kpis.overdueInvoicesCount}
            subtext={`${formatCurrency(kpis.overdueInvoicesTotal)} past due date`}
            icon={AlertTriangle}
            color="rose"
            href="/invoices?status=OVERDUE"
          />

          <KpiCard
            title="Renewals (Next 30d)"
            value={kpis.upcomingRenewalsCount}
            subtext="Upcoming billing events"
            icon={Clock}
            color="teal"
            href="/subscriptions"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trends Chart (2 cols) */}
          <div className="odoo-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Monthly Revenue Trajectory
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Actual reconciled payments aggregated from PostgreSQL
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#714B67] dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                Last 6 Months
              </span>
            </div>
            <Chart option={revenueTrendOption} height="300px" />
          </div>

          {/* Subscription Status Chart (1 col) */}
          <div className="odoo-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Subscription Status
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Distribution by active lifecycle
                </p>
              </div>
            </div>
            <Chart option={statusPieOption} height="300px" />
          </div>
        </div>

        {/* Tables Section: Overdue Receivables & Upcoming Renewals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Invoices Alert Table */}
          <div className="odoo-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Overdue Invoices Action List
                </h3>
              </div>
              <Link href="/invoices?status=OVERDUE" className="text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline">
                View All Invoices &rarr;
              </Link>
            </div>

            {data?.overdueInvoices?.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {data.overdueInvoices.map((inv: any) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold text-xs">
                        INV
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{inv.invoiceNumber}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{inv.customer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-xs text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(inv.outstandingAmount)}
                      </p>
                      <p className="text-[11px] text-zinc-400">Due: {formatDate(inv.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                No overdue invoices currently!
              </div>
            )}
          </div>

          {/* Upcoming Renewals */}
          <div className="odoo-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500" />
                <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Upcoming Subscription Renewals
                </h3>
              </div>
              <Link href="/subscriptions" className="text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline">
                View Subscriptions &rarr;
              </Link>
            </div>

            {data?.upcomingRenewals?.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {data.upcomingRenewals.map((sub: any) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                        SUB
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{sub.subscriptionNumber}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {sub.customer.name} &bull; <span className="font-medium text-[#714B67] dark:text-purple-300">{sub.plan.name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatCurrency(sub.totalAmount)}
                      </p>
                      <p className="text-[11px] text-zinc-400">Next cycle: {formatDate(sub.nextBillingDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">
                <Calendar size={28} className="mx-auto text-teal-500 mb-2" />
                No renewals due in the next 30 days.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="odoo-card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100">
                Recent Payment Transactions
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Live ledger payments reconciled directly against invoices
              </p>
            </div>
            <Link href="/payments" className="text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline">
              View All Payments &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-y border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {data?.recentTransactions?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#714B67] dark:text-purple-300">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.customer.name}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      {p.invoice?.invoiceNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[10px] text-zinc-600 dark:text-zinc-300">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
