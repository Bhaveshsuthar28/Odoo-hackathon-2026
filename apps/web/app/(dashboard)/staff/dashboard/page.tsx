'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Repeat,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export default function StaffDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Role Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/staff/login');
      } else if (user.role === 'CUSTOMER') {
        router.push('/customer/dashboard');
      }
      // ADMIN is also allowed to view or navigate here if desired
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiRequest('/api/dashboard/metrics');
        if (res.success && res.data) {
          setMetrics(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
      loadData();
    }
  }, [user]);

  const kpis = metrics?.kpis || {
    activeSubscriptions: 0,
    totalCustomers: 0,
    revenueCollected: 0,
    outstandingAmount: 0,
    overdueInvoicesCount: 0,
    overdueInvoicesTotal: 0,
    upcomingRenewalsCount: 0,
  };

  const recentSubscriptions = metrics?.recentSubscriptions || [];
  const recentPayments = metrics?.recentPayments || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Staff Operations Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-amber-100 mb-2">
              <UserCheck size={14} className="text-amber-200" />
              Operational Workspace • Staff Account Mode
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
              Hello, {user?.name || 'Staff Member'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
              Fulfill customer requests, generate quotations, issue invoices, and record incoming payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/quotations"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-amber-800 font-bold text-xs shadow-md hover:bg-amber-50 transition-colors"
            >
              <Plus size={15} />
              New Quotation
            </Link>
            <Link
              href="/customers"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-800/40 hover:bg-amber-800/60 border border-white/20 text-white font-semibold text-xs transition-colors"
            >
              <Users size={15} />
              Customers
            </Link>
          </div>
        </div>

        {/* Operational Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              Staff Access Level: Operational billing and customer fulfillment active. High-level financial auditing, revenue leakage analysis, and staff provisioning are restricted to Administrators.
            </span>
          </div>
          <span className="font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] shrink-0">
            STAFF ROLE
          </span>
        </div>

        {/* Operational KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Active Subscriptions"
            value={kpis.activeSubscriptions.toString()}
            subtext={`${kpis.upcomingRenewalsCount} renewal events pending`}
            icon={Repeat}
            color="blue"
          />
          <KpiCard
            title="Managed Customers"
            value={kpis.totalCustomers.toString()}
            subtext="Registered active accounts"
            icon={Users}
            color="purple"
          />
          <KpiCard
            title="Overdue Invoices"
            value={kpis.overdueInvoicesCount.toString()}
            subtext={`${formatCurrency(kpis.overdueInvoicesTotal)} requires follow-up`}
            icon={AlertTriangle}
            color="rose"
          />
          <KpiCard
            title="Revenue Processed"
            value={formatCurrency(kpis.revenueCollected)}
            subtext="Completed payments recorded"
            icon={DollarSign}
            color="emerald"
          />
        </div>

        {/* Operational Quick Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/quotations"
            className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileSpreadsheet size={20} />
            </div>
            <span className="text-xs font-bold text-[#252525] dark:text-white">Quotations</span>
            <span className="text-[11px] text-[#737373] mt-0.5">Draft &amp; send proposals</span>
          </Link>

          <Link
            href="/subscriptions"
            className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Repeat size={20} />
            </div>
            <span className="text-xs font-bold text-[#252525] dark:text-white">Subscriptions</span>
            <span className="text-[11px] text-[#737373] mt-0.5">Pause, resume, renew</span>
          </Link>

          <Link
            href="/invoices"
            className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Receipt size={20} />
            </div>
            <span className="text-xs font-bold text-[#252525] dark:text-white">Invoices</span>
            <span className="text-[11px] text-[#737373] mt-0.5">Issue &amp; track balances</span>
          </Link>

          <Link
            href="/payments"
            className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm hover:border-purple-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CreditCard size={20} />
            </div>
            <span className="text-xs font-bold text-[#252525] dark:text-white">Record Payment</span>
            <span className="text-[11px] text-[#737373] mt-0.5">Log bank &amp; cash receipts</span>
          </Link>
        </div>

        {/* Operational Records (Recent Subscriptions & Payments) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscriptions */}
          <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#F1F1F3] dark:border-[#27272A] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#252525] dark:text-white font-heading">
                Recent Subscriptions
              </h3>
              <Link href="/subscriptions" className="text-xs text-[#714B67] font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="divide-y divide-[#F1F1F3] dark:divide-[#2E2E32]">
              {recentSubscriptions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737373]">No subscription records yet.</div>
              ) : (
                recentSubscriptions.slice(0, 5).map((sub: any) => (
                  <div key={sub.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#F9FAFB] dark:hover:bg-[#232326] transition-colors">
                    <div>
                      <p className="font-bold text-[#252525] dark:text-white">{sub.subscriptionNumber}</p>
                      <p className="text-[11px] text-[#737373]">{sub.customer?.name} • {sub.plan?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#252525] dark:text-white">{formatCurrency(sub.totalAmount)}</p>
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#F1F1F3] dark:border-[#27272A] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#252525] dark:text-white font-heading">
                Recent Recorded Payments
              </h3>
              <Link href="/payments" className="text-xs text-[#714B67] font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="divide-y divide-[#F1F1F3] dark:divide-[#2E2E32]">
              {recentPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737373]">No recorded payments yet.</div>
              ) : (
                recentPayments.slice(0, 5).map((pay: any) => (
                  <div key={pay.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#F9FAFB] dark:hover:bg-[#232326] transition-colors">
                    <div>
                      <p className="font-bold text-[#252525] dark:text-white">{pay.paymentNumber}</p>
                      <p className="text-[11px] text-[#737373]">{pay.customer?.name} • {pay.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(pay.amount)}</p>
                      <p className="text-[10px] text-[#737373]">{formatDate(pay.paymentDate)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
