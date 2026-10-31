'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Loader2,
  Trash2,
  UserCheck,
  UserX,
  Lock,
  Inbox,
  ExternalLink,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  requiresPasswordChange: boolean;
  createdAt: string;
}

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [autoGenPassword, setAutoGenPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reset password state
  const [resetCustomPassword, setResetCustomPassword] = useState('');
  const [resetAutoGen, setResetAutoGen] = useState(true);
  const [resetting, setResetting] = useState(false);

  // Credentials dialog after creation or reset
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState<{
    title: string;
    name: string;
    email: string;
    tempPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick Staff Requests Drawer/Modal
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await apiRequest<{ staff: StaffMember[] }>('/api/admin/staff');
      if (res.success && res.data?.staff) {
        setStaffList(res.data.staff);
      }
    } catch (e) {
      console.error('Failed to load staff list', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaffRequests() {
    setLoadingRequests(true);
    try {
      const res = await apiRequest('/api/staff-requests');
      if (res.success && res.data?.requests) {
        setRequestsList(res.data.requests);
      }
    } catch (e) {
      console.error('Failed to load requests', e);
    } finally {
      setLoadingRequests(false);
    }
  }

  const openRequestsModal = () => {
    setShowRequestsModal(true);
    fetchStaffRequests();
  };

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || undefined,
      };
      if (!autoGenPassword && customPassword) {
        payload.password = customPassword;
      }

      const res = await apiRequest<{
        staff: StaffMember;
        temporaryPassword?: string;
      }>('/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setCustomPassword('');
        setAutoGenPassword(true);

        setCredentialsData({
          title: 'Staff Member Provisioned Successfully',
          name: res.data.staff.name,
          email: res.data.staff.email,
          tempPassword: res.data.temporaryPassword,
        });
        setShowCredsModal(true);
        fetchStaff();
      } else {
        alert(res.message || 'Failed to create staff member');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating staff member');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaff) return;
    setResetting(true);

    try {
      const payload: any = {};
      if (!resetAutoGen && resetCustomPassword) {
        payload.password = resetCustomPassword;
      }

      const res = await apiRequest<{
        staff: StaffMember;
        temporaryPassword?: string;
      }>(`/api/admin/staff/${selectedStaff.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setShowResetModal(false);
        setResetCustomPassword('');
        setResetAutoGen(true);

        setCredentialsData({
          title: 'Staff Password Reset Successfully',
          name: res.data.staff.name,
          email: res.data.staff.email,
          tempPassword: res.data.temporaryPassword,
        });
        setShowCredsModal(true);
        fetchStaff();
      } else {
        alert(res.message || 'Failed to reset password');
      }
    } catch (err: any) {
      alert(err.message || 'Error resetting staff password');
    } finally {
      setResetting(false);
    }
  }

  async function handleToggleStatus(staff: StaffMember) {
    const action = staff.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${staff.name}'s account?`)) return;

    try {
      const res = await apiRequest(`/api/admin/staff/${staff.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !staff.isActive }),
      });
      if (res.success) {
        fetchStaff();
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  }

  async function handleDeleteStaff(staff: StaffMember) {
    if (!confirm(`Are you sure you want to permanently delete staff member "${staff.name}"?`)) {
      return;
    }

    try {
      const res = await apiRequest(`/api/admin/staff/${staff.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        fetchStaff();
      } else {
        alert(res.message || 'Failed to delete staff member');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting staff member');
    }
  }

  function copyCredentials() {
    if (!credentialsData) return;
    const text = `SubFlow Staff Login Credentials\nName: ${credentialsData.name}\nEmail / Username: ${credentialsData.email}\nTemporary Password: ${credentialsData.tempPassword}\nLogin Portal: ${window.location.origin}/staff/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = staffList.filter((s) => s.isActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Staff Request Button & Add Staff Member */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(113,75,103,0.10)] text-[#714B67] dark:text-purple-300 font-bold text-xs border border-[rgba(113,75,103,0.18)] mb-1">
              <Shield size={13} />
              <span>Personnel &amp; Operational Security</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#211B24] dark:text-white tracking-tight">
              Staff Members &amp; Access Management
            </h1>
            <p className="text-xs sm:text-sm text-[#77717B] dark:text-zinc-400 mt-1">
              Provision operational credentials, force password resets, toggle account access, and manage staff requests.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Staff Request Button */}
            <button
              onClick={openRequestsModal}
              className="btn-subflow-secondary text-xs flex items-center gap-2"
              title="Open Staff Requests Desk"
            >
              <Inbox size={15} className="text-[#714B67] dark:text-purple-300" />
              <span>Staff Requests</span>
            </button>

            {/* Direct Link to Dedicated Page */}
            <Link
              href="/admin/staff/requests"
              className="btn-subflow-secondary text-xs flex items-center gap-1.5"
              title="Open Dedicated Staff Requests Page"
            >
              <span>Dedicated Desk</span>
              <ExternalLink size={13} />
            </Link>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-subflow-primary text-xs"
            >
              <UserPlus size={15} />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Metric Cards with visible borders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="odoo-kpi-card flex items-center justify-between border border-[rgba(113,75,103,0.20)] dark:border-zinc-800 rounded-2xl shadow-sm p-5 hover:bg-[#F4EFF4] dark:hover:bg-[#1E1B22] transition-colors">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77717B] dark:text-zinc-400">
                Total Staff
              </span>
              <p className="text-3xl font-extrabold text-[#714B67] dark:text-purple-300 font-heading mt-1">
                {staffList.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 border border-[rgba(113,75,103,0.18)]">
              <Users size={20} />
            </div>
          </div>

          <div className="odoo-kpi-card flex items-center justify-between border border-emerald-500/25 dark:border-emerald-500/35 rounded-2xl shadow-sm p-5 hover:bg-[#F4EFF4] dark:hover:bg-[#1E1B22] transition-colors">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77717B] dark:text-zinc-400">
                Active &amp; Verified
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading mt-1">
                {activeCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/25">
              <UserCheck size={20} />
            </div>
          </div>

          <div className="odoo-kpi-card flex items-center justify-between border border-rose-500/25 dark:border-rose-500/35 rounded-2xl shadow-sm p-5 hover:bg-[#F4EFF4] dark:hover:bg-[#1E1B22] transition-colors">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77717B] dark:text-zinc-400">
                Suspended / Inactive
              </span>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-heading mt-1">
                {staffList.length - activeCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-500/25">
              <UserX size={20} />
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77717B]" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          />
        </div>

        {/* Staff Table with unified container & distinct borders */}
        <div className="subflow-table-container shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="subflow-table-head">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-4 py-3.5">Email / Username</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Provisioned</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(113,75,103,0.08)] dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#714B67]" />
                      Loading staff accounts...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      No staff accounts found. Click "Add Staff Member" to provision credentials.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className="subflow-table-row"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#714B67] to-[#432A3E] text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                            {staff.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-[#211B24] dark:text-white block">
                              {staff.name}
                            </span>
                            <span className="text-[10px] text-[#714B67] dark:text-purple-300 font-semibold uppercase tracking-wider">
                              Operational Staff
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#77717B] dark:text-zinc-400">
                        {staff.email}
                      </td>
                      <td className="px-4 py-3.5 text-[#77717B] dark:text-zinc-400">
                        {staff.phone || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            staff.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              staff.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {staff.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#77717B] dark:text-zinc-400 text-[11px]">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setResetCustomPassword('');
                              setResetAutoGen(true);
                              setShowResetModal(true);
                            }}
                            className="btn-subflow-secondary btn-sm inline-flex items-center gap-1.5 whitespace-nowrap"
                            title="Reset staff password"
                          >
                            <KeyRound size={13} className="text-[#714B67] dark:text-purple-300" />
                            <span>Reset Pass</span>
                          </button>

                          {staff.isActive ? (
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              className="btn-subflow-danger btn-sm inline-flex items-center gap-1.5 whitespace-nowrap"
                              title="Deactivate staff account"
                            >
                              <UserX size={13} />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              className="btn-subflow-secondary btn-sm inline-flex items-center gap-1.5 whitespace-nowrap text-emerald-700 dark:text-emerald-400 border-emerald-300/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              title="Activate staff account"
                            >
                              <UserCheck size={13} />
                              <span>Activate</span>
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

        {/* Staff Requests Drawer / Modal with "Open Dedicated Page" option */}
        {showRequestsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in">
            <div className="modal-dialog max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(113,75,103,0.14)] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(113,75,103,0.10)] text-[#714B67] dark:text-purple-300 flex items-center justify-center border border-[rgba(113,75,103,0.18)]">
                    <Inbox size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#211B24] dark:text-white">
                      Staff Requests Quick View
                    </h3>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400">Recent inquiries, leave, and equipment tickets</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/staff/requests"
                    onClick={() => setShowRequestsModal(false)}
                    className="btn-subflow-secondary btn-sm inline-flex items-center gap-1.5"
                  >
                    <span>Open in Dedicated Page</span>
                    <ExternalLink size={12} />
                  </Link>
                  <button
                    onClick={() => setShowRequestsModal(false)}
                    className="text-[#77717B] hover:text-[#211B24] dark:hover:text-white p-1 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {loadingRequests ? (
                  <div className="py-12 text-center text-[#77717B]">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#714B67]" />
                    Loading staff requests...
                  </div>
                ) : requestsList.length === 0 ? (
                  <div className="py-12 text-center text-[#77717B] max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(113,75,103,0.08)] flex items-center justify-center text-[#714B67] dark:text-purple-300 border border-[rgba(113,75,103,0.16)] mx-auto mb-3">
                      <Inbox size={22} />
                    </div>
                    <p className="font-bold text-sm text-[#211B24] dark:text-white">No staff requests found</p>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400 mt-1">Staff members can submit inquiries and requests from their portal desk.</p>
                  </div>
                ) : (
                  requestsList.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-[#FAF8FB] dark:bg-zinc-800/80 border border-[rgba(113,75,103,0.16)] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#211B24] dark:text-white text-xs">{req.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[#77717B] dark:text-zinc-300 line-clamp-2 text-xs leading-relaxed">
                        {req.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[rgba(113,75,103,0.10)] text-[11px] text-[#77717B] dark:text-zinc-400">
                        <span>By {req.staff?.name} ({req.category})</span>
                        <span>{formatDate(req.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-[rgba(113,75,103,0.14)] flex items-center justify-between shrink-0">
                <span className="text-xs text-[#77717B] dark:text-zinc-400 font-medium">{requestsList.length} total requests</span>
                <Link
                  href="/admin/staff/requests"
                  onClick={() => setShowRequestsModal(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#714B67] dark:text-purple-300 hover:underline"
                >
                  <span>Go to Full Request Management Desk</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in">
            <div className="modal-dialog max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(113,75,103,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#714B67] text-white flex items-center justify-center font-bold shadow-sm">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#211B24] dark:text-white">
                      Provision Staff Account
                    </h3>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400">Add operational credentials for a new team member</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#77717B] hover:text-[#211B24] dark:hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="ui-input"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. staff@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="ui-input"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="ui-input"
                  />
                </div>

                <div className="pt-2 border-t border-[rgba(113,75,103,0.14)] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#211B24] dark:text-zinc-200">Initial Password</label>
                    <button
                      type="button"
                      onClick={() => setAutoGenPassword(!autoGenPassword)}
                      className="text-[11px] text-[#714B67] dark:text-purple-300 font-semibold hover:underline"
                    >
                      {autoGenPassword ? 'Custom Password' : 'Auto-Generate'}
                    </button>
                  </div>

                  {autoGenPassword ? (
                    <p className="p-3 rounded-xl bg-[rgba(113,75,103,0.06)] border border-[rgba(113,75,103,0.14)] text-[#77717B] dark:text-zinc-400 text-xs">
                      A secure temporary password will be auto-generated and shown to you immediately upon creation.
                    </p>
                  ) : (
                    <input
                      type="text"
                      placeholder="Minimum 8 characters"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="ui-input"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[rgba(113,75,103,0.14)]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-subflow-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-subflow-primary text-xs"
                  >
                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                    <span>Provision Staff</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetModal && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in">
            <div className="modal-dialog max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(113,75,103,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-500/25">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#211B24] dark:text-white">
                      Reset Password
                    </h3>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400">{selectedStaff.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-[#77717B] hover:text-[#211B24] dark:hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
                <p className="text-[#77717B] dark:text-zinc-400 leading-relaxed">
                  Resetting credentials for <strong className="text-[#211B24] dark:text-white font-medium">{selectedStaff.email}</strong>. The staff member will be required to change their temporary password upon login.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#211B24] dark:text-zinc-200">New Password</label>
                    <button
                      type="button"
                      onClick={() => setResetAutoGen(!resetAutoGen)}
                      className="text-[11px] text-[#714B67] dark:text-purple-300 font-semibold hover:underline"
                    >
                      {resetAutoGen ? 'Custom Password' : 'Auto-Generate'}
                    </button>
                  </div>

                  {resetAutoGen ? (
                    <p className="p-3 rounded-xl bg-[rgba(113,75,103,0.06)] border border-[rgba(113,75,103,0.14)] text-[#77717B] dark:text-zinc-400 text-xs">
                      A secure random temporary password will be generated upon confirmation and displayed to you.
                    </p>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Minimum 8 characters"
                      value={resetCustomPassword}
                      onChange={(e) => setResetCustomPassword(e.target.value)}
                      className="ui-input"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[rgba(113,75,103,0.14)]">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="btn-subflow-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetting}
                    className="btn-subflow-primary text-xs"
                  >
                    {resetting ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                    <span>Confirm Reset</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials Created/Reset Success Dialog */}
        {showCredsModal && credentialsData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in">
            <div className="modal-dialog max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(113,75,103,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-[#211B24] dark:text-white">
                    {credentialsData.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCredsModal(false)}
                  className="text-[#77717B] hover:text-[#211B24] dark:hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8FB] dark:bg-zinc-800/80 border border-[rgba(113,75,103,0.18)] space-y-3 text-xs">
                <div>
                  <span className="text-[#77717B] dark:text-zinc-400 block text-[11px] uppercase font-bold">Staff Name</span>
                  <span className="font-bold text-[#211B24] dark:text-white text-sm">{credentialsData.name}</span>
                </div>
                <div>
                  <span className="text-[#77717B] dark:text-zinc-400 block text-[11px] uppercase font-bold">Login Email / Username</span>
                  <span className="font-bold text-[#211B24] dark:text-white font-mono text-xs">{credentialsData.email}</span>
                </div>
                {credentialsData.tempPassword && (
                  <div>
                    <span className="text-[#77717B] dark:text-zinc-400 block text-[11px] uppercase font-bold">Temporary Password</span>
                    <span className="font-bold text-[#714B67] dark:text-purple-300 font-mono text-sm bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-[rgba(113,75,103,0.25)] inline-block mt-1 select-all shadow-xs">
                      {credentialsData.tempPassword}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[rgba(113,75,103,0.14)]">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="btn-subflow-secondary text-xs flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCredsModal(false)}
                  className="btn-subflow-primary text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
