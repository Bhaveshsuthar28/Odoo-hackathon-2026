'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Chart } from '@/components/ui/Chart';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  TrendingUp,
  Users,
  Repeat,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  Receipt,
  CreditCard,
  CheckCircle2,
  Calendar,
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
      axisLabel: { color: '#737373' },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      axisLabel: {
        color: '#737373',
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
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(113, 75, 103, 0.4)' },
              { offset: 1, color: 'rgba(113, 75, 103, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  const statusPieOption: any = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center', textStyle: { color: '#737373' } },
    series: [
      {
        name: 'Subscriptions by Status',
        type: 'pie' as const,
        radius: ['50%', '75%'],
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
        {/* Top Header & Fast KPI Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
              Executive Financial Overview
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Real-time recurring billing metrics powered by PostgreSQL transactions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/leakage"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
            >
              <ShieldAlert size={14} />
              <span>Revenue Leakage ({kpis.overdueInvoicesCount} Alerts)</span>
            </Link>
            <Link
              href="/subscriptions"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#714B67] text-white hover:bg-[#55364E] shadow-sm transition-colors"
            >
              <span>Manage Subscriptions</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 8 Primary Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR */}
          <Link href="/subscriptions" className="odoo-card p-5 block group">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Monthly Recurring Revenue</span>
              <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-[#714B67] dark:text-purple-300 tracking-tight">
              {formatCurrency(kpis.mrr)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight size={14} />
              <span>Normalized Active MRR</span>
            </div>
          </Link>

          {/* ARR */}
          <Link href="/subscriptions" className="odoo-card p-5 block group">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Annual Recurring Revenue</span>
              <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300">
                <Repeat size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-[#252525] dark:text-white tracking-tight">
              {formatCurrency(kpis.arr)}
            </p>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-2">
              Projected 12-month run rate
            </p>
          </Link>

          {/* Revenue Collected */}
          <Link href="/payments" className="odoo-card p-5 block group">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue Collected</span>
              <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(kpis.revenueCollected)}
            </p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300 mt-2 font-medium">
              Actual reconciled cash received
            </p>
          </Link>

          {/* Outstanding Receivables */}
          <Link href="/invoices?status=CONFIRMED" className="odoo-card p-5 block group">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
              <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Receipt size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-amber-600 dark:text-amber-400 tracking-tight">
              {formatCurrency(kpis.outstandingAmount)}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300 mt-2 font-medium">
              Unpaid invoices total
            </p>
          </Link>

          {/* Active Subscriptions */}
          <Link href="/subscriptions" className="odoo-card p-5 block group">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Repeat size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-[#252525] dark:text-white tracking-tight">
              {kpis.activeSubscriptions}
            </p>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-2">
              Currently generating recurring billing
            </p>
          </Link>

          {/* Total Customers */}
          <Link href="/customers" className="odoo-card p-5 block group">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Customers</span>
              <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                <Users size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-[#252525] dark:text-white tracking-tight">
              {kpis.totalCustomers}
            </p>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-2">
              Registered business accounts
            </p>
          </Link>

          {/* Overdue Invoices */}
          <Link href="/invoices?status=OVERDUE" className="odoo-card p-5 block group">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Overdue Invoices</span>
              <div className="p-2 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-rose-600 dark:text-rose-400 tracking-tight">
              {kpis.overdueInvoicesCount}
            </p>
            <p className="text-xs text-rose-700/80 dark:text-rose-300 mt-2 font-medium">
              {formatCurrency(kpis.overdueInvoicesTotal)} past due date
            </p>
          </Link>

          {/* Upcoming Renewals */}
          <div className="odoo-card p-5">
            <div className="flex items-center justify-between text-[#737373] dark:text-[#A1A1AA] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Renewals (Next 30d)</span>
              <div className="p-2 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-600">
                <Clock size={18} />
              </div>
            </div>
            <p className="text-3xl font-extrabold font-heading text-teal-700 dark:text-teal-400 tracking-tight">
              {kpis.upcomingRenewalsCount}
            </p>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-2">
              Subscriptions renewing soon
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trends Chart (2 cols) */}
          <div className="odoo-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Monthly Revenue Trajectory
                </h3>
                <p className="text-xs text-[#737373] dark:text-[#A1A1AA]">
                  Actual reconciled payments aggregated from PostgreSQL
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#714B67]/10 text-[#714B67] dark:text-purple-300">
                Last 6 Months
              </span>
            </div>
            <Chart option={revenueTrendOption} height="300px" />
          </div>

          {/* Subscription Status Chart (1 col) */}
          <div className="odoo-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Subscription Status
                </h3>
                <p className="text-xs text-[#737373] dark:text-[#A1A1AA]">
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Overdue Invoices Action List
                </h3>
              </div>
              <Link href="/invoices?status=OVERDUE" className="text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline">
                View All Invoices
              </Link>
            </div>

            {data?.overdueInvoices?.length > 0 ? (
              <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A] text-xs">
                {data.overdueInvoices.map((inv: any) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#252525] dark:text-white">{inv.invoiceNumber}</p>
                      <p className="text-[#737373]">{inv.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-rose-600 dark:text-rose-400">
                        {formatCurrency(inv.outstandingAmount)}
                      </p>
                      <p className="text-[11px] text-[#737373]">Due: {formatDate(inv.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#737373]">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                No overdue invoices currently!
              </div>
            )}
          </div>

          {/* Upcoming Renewals */}
          <div className="odoo-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Upcoming Subscription Renewals
                </h3>
              </div>
              <Link href="/subscriptions" className="text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline">
                View Subscriptions
              </Link>
            </div>

            {data?.upcomingRenewals?.length > 0 ? (
              <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A] text-xs">
                {data.upcomingRenewals.map((sub: any) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#252525] dark:text-white">{sub.subscriptionNumber}</p>
                      <p className="text-[#737373]">{sub.customer.name} — <span className="font-medium text-[#714B67] dark:text-purple-300">{sub.plan.name}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#252525] dark:text-white">
                        {formatCurrency(sub.totalAmount)}
                      </p>
                      <p className="text-[11px] text-[#737373]">Billing: {formatDate(sub.nextBillingDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#737373]">
                <Calendar size={28} className="mx-auto text-teal-500 mb-2" />
                No renewals due in the next 30 days.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="odoo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                Recent Payment Transactions
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#A1A1AA]">
                Live ledger payments reconciled directly against invoices
              </p>
            </div>
            <Link href="/payments" className="text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline">
              View All Payments
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-md">Payment #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4 rounded-r-md">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                {data?.recentTransactions?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#714B67] dark:text-purple-300">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#252525] dark:text-white">
                      {p.customer.name}
                    </td>
                    <td className="py-3 px-4 text-[#737373]">
                      {p.invoice?.invoiceNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-medium uppercase tracking-wider text-[11px]">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-[#737373]">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#252525] dark:text-white">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {p.status}
                      </span>
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
