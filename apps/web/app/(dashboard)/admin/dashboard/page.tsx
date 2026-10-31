'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Chart } from '@/components/ui/Chart';
import { KpiCard } from '@/components/ui/KpiCard';
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
  ShieldCheck,
  UserPlus,
  UserCheck,
  UserX,
  Copy,
  Check,
  Loader2,
  History,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  Key,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Staff management state
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [createdStaffTempPass, setCreatedStaffTempPass] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // New staff form fields
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [autoGenPassword, setAutoGenPassword] = useState(true);

  // Role Protection
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      if (!user) router.push('/admin/login');
      else if (user.role === 'STAFF') router.push('/staff/dashboard');
      else router.push('/customer/dashboard');
    }
  }, [user, authLoading, router]);

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await apiRequest('/api/admin/staff');
      if (res.success && res.data?.staff) {
        setStaffList(res.data.staff);
      }
    } catch (e) {
      console.error('Failed to load staff list', e);
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await apiRequest('/api/dashboard/metrics');
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (e) {
      console.error('Failed to load metrics', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadMetrics();
      loadStaff();
    }
  }, [user?.id, user?.role]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');
    setCreatedStaffTempPass(null);

    if (!staffName.trim()) {
      setStaffError('Please enter the staff member full name.');
      return;
    }
    if (!staffEmail.trim() || !staffEmail.includes('@')) {
      setStaffError('Please enter a valid staff email address.');
      return;
    }

    setCreatingStaff(true);
    try {
      const body: any = {
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        phone: staffPhone.trim() || undefined,
      };
      if (!autoGenPassword && staffPassword.trim()) {
        body.password = staffPassword.trim();
      }

      const res = await apiRequest('/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.success && res.data) {
        setStaffSuccess('Staff account provisioned successfully!');
        setCreatedStaffTempPass(res.data.temporaryPassword);
        setStaffName('');
        setStaffEmail('');
        setStaffPhone('');
        setStaffPassword('');
        loadStaff();
      } else {
        setStaffError(res.message || 'Failed to create staff account.');
      }
    } catch (err: any) {
      setStaffError(err.message || 'Error occurred while provisioning staff.');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleToggleStaffStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiRequest(`/api/admin/staff/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.success) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s))
        );
      }
    } catch (e) {
      console.error('Failed to toggle status', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const kpis = metrics?.kpis || {
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
      data: metrics?.charts?.revenueTrend?.map((d: any) => d.month) || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
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
        data: metrics?.charts?.revenueTrend?.map((d: any) => d.revenue) || [12000, 15000, 18500, 22000, 19500, 27500],
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
              { offset: 0, color: 'rgba(113, 75, 103, 0.35)' },
              { offset: 1, color: 'rgba(113, 75, 103, 0.0)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#55364E] to-[#714B67] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-purple-100 mb-2">
              <ShieldCheck size={14} className="text-purple-300" />
              Administrative Command Center • Full Root Privileges
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
              Welcome back, {user?.name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              Global overview of recurring subscriptions, staff operations, revenue health, and security controls.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreatedStaffTempPass(null);
                setStaffError('');
                setStaffSuccess('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#714B67] font-bold text-xs shadow-md hover:bg-purple-50 transition-colors"
            >
              <UserPlus size={16} />
              Provision Staff Account
            </button>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors"
            >
              <History size={16} />
              Audit Logs
            </Link>
          </div>
        </div>

        {/* Global Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Monthly Recurring Revenue (MRR)"
            value={formatCurrency(kpis.mrr)}
            subtext={`ARR: ${formatCurrency(kpis.arr)}`}
            icon={TrendingUp}
            trend={{ value: '12.4%', positive: true }}
            color="purple"
          />
          <KpiCard
            title="Active Subscriptions"
            value={kpis.activeSubscriptions.toString()}
            subtext={`${kpis.upcomingRenewalsCount} renewing in 30 days`}
            icon={Repeat}
            color="blue"
          />
          <KpiCard
            title="Total Revenue Collected"
            value={formatCurrency(kpis.revenueCollected)}
            subtext="Completed payments to date"
            icon={DollarSign}
            color="emerald"
          />
          <KpiCard
            title="Overdue Outstanding"
            value={formatCurrency(kpis.overdueInvoicesTotal)}
            subtext={`${kpis.overdueInvoicesCount} overdue invoices`}
            icon={AlertTriangle}
            color="rose"
          />
        </div>

        {/* Financial Charts & System Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1F] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#252525] dark:text-white font-heading">
                  Revenue Inflow Velocity
                </h3>
                <p className="text-xs text-[#737373]">Monthly collected subscription revenue</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                +18.2% Growth
              </span>
            </div>
            <Chart option={revenueTrendOption} height="280px" />
          </div>

          <div className="bg-white dark:bg-[#1C1C1F] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#252525] dark:text-white font-heading mb-1">
                Admin Control Shortcuts
              </h3>
              <p className="text-xs text-[#737373] mb-4">Core administrative and financial management modules</p>

              <div className="space-y-2.5">
                <Link
                  href="/leakage"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] hover:bg-[#F7F7F8] dark:hover:bg-[#27272A] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#252525] dark:text-white">Revenue Leakage Guard</p>
                      <p className="text-[11px] text-[#737373]">Unbilled cycles &amp; failed retries</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[#737373] group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/simulator"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] hover:bg-[#F7F7F8] dark:hover:bg-[#27272A] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#252525] dark:text-white">Billing Simulator</p>
                      <p className="text-[11px] text-[#737373]">Advance recurring cycles &amp; invoices</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[#737373] group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/recovery"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] hover:bg-[#F7F7F8] dark:hover:bg-[#27272A] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-[#714B67] flex items-center justify-center">
                      <Receipt size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#252525] dark:text-white">Payment Recovery Center</p>
                      <p className="text-[11px] text-[#737373]">Dunning rules &amp; collection workflows</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[#737373] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F1F1F3] dark:border-[#27272A]">
              <div className="flex items-center justify-between text-xs text-[#737373]">
                <span>Total Registered Customers</span>
                <strong className="text-[#252525] dark:text-white">{kpis.totalCustomers}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Members Management Section */}
        <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl border border-[#E5E7EB] dark:border-[#2E2E32] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F1F1F3] dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#714B67]" />
                <h3 className="text-lg font-bold text-[#252525] dark:text-white font-heading">
                  Staff Member Management
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 font-bold border border-purple-200">
                  {staffList.length} Active Staff
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-1">
                Admin-exclusive control: Provision staff members, assign credentials, and manage operational access.
              </p>
            </div>

            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreatedStaffTempPass(null);
                setStaffError('');
                setStaffSuccess('');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#714B67] hover:bg-[#55364E] text-white font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
            >
              <UserPlus size={15} />
              Add Staff Member
            </button>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] font-semibold border-b border-[#E5E7EB] dark:border-[#2E2E32]">
                <tr>
                  <th className="px-6 py-3.5">Staff Member</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Verification</th>
                  <th className="px-6 py-3.5">Provisioned Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F3] dark:divide-[#2E2E32]">
                {loadingStaff ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#737373]">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#714B67]" />
                      Loading staff records...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#737373]">
                      No operational staff members registered yet. Click "Add Staff Member" above to provision one.
                    </td>
                  </tr>
                ) : (
                  staffList.map((member) => (
                    <tr key={member.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#232326] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center uppercase">
                            {member.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-[#252525] dark:text-white">{member.name}</p>
                            <p className="text-[11px] text-[#737373]">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                          STAFF
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            member.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              member.isActive ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          {member.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 size={13} /> Pre-Verified
                          </span>
                          {member.requiresPasswordChange && (
                            <p className="text-[10px] text-amber-600 font-medium">Must update password</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#737373]">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStaffStatus(member.id, member.isActive)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                            member.isActive
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Staff Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl max-w-lg w-full p-6 border border-[#E5E7EB] dark:border-[#2E2E32] shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F1F3] dark:border-[#27272A]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#714B67] text-white flex items-center justify-center font-bold">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#252525] dark:text-white font-heading">
                      Provision Staff Account
                    </h3>
                    <p className="text-xs text-[#737373]">Only administrators can create staff accounts</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#737373] hover:text-[#252525] dark:hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {staffError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              {staffSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{staffSuccess}</span>
                </div>
              )}

              {createdStaffTempPass ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-xs space-y-2">
                    <p className="font-bold text-[#714B67] dark:text-purple-300">
                      Temporary Staff Password Generated:
                    </p>
                    <div className="flex items-center justify-between bg-white dark:bg-[#121214] p-3 rounded-lg border border-purple-300 font-mono text-sm font-bold text-[#252525] dark:text-white">
                      <span>{createdStaffTempPass}</span>
                      <button
                        onClick={() => copyToClipboard(createdStaffTempPass)}
                        className="p-1 text-[#714B67] hover:bg-purple-50 rounded"
                        title="Copy Password"
                      >
                        {copiedPass ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#737373] dark:text-purple-200/80">
                      Please copy and securely transmit this temporary password to the staff member. They will be required to change it on their initial sign-in.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCreatedStaffTempPass(null);
                      setShowCreateModal(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#714B67] text-white text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                      Staff Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-white dark:bg-[#121214] text-[#252525] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                      Staff Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="s.jenkins@company.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-white dark:bg-[#121214] text-[#252525] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-white dark:bg-[#121214] text-[#252525] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#F1F1F3] dark:border-[#27272A]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-[#252525] dark:text-white">
                        Password Configuration
                      </label>
                      <button
                        type="button"
                        onClick={() => setAutoGenPassword(!autoGenPassword)}
                        className="text-[11px] text-[#714B67] dark:text-purple-300 font-semibold hover:underline"
                      >
                        {autoGenPassword ? 'Set manual password' : 'Use auto-generated password'}
                      </button>
                    </div>

                    {autoGenPassword ? (
                      <div className="p-3 rounded-xl bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#2E2E32] text-[11px] text-[#737373] flex items-center gap-2">
                        <Key size={14} className="text-[#714B67]" />
                        <span>A high-entropy 16-character temporary password will be auto-generated.</span>
                      </div>
                    ) : (
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter manual temporary password (min 8 chars, mixed case & symbol)"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2E2E32] bg-white dark:bg-[#121214] text-[#252525] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F1F3] dark:border-[#27272A]">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-[#737373] hover:text-[#252525] font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingStaff}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#714B67] hover:bg-[#55364E] text-white font-semibold text-xs shadow-sm disabled:opacity-50"
                    >
                      {creatingStaff ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Create Staff Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
