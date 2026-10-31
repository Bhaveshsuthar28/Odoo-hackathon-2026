'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard, GlassCardHeader } from '@/components/ui/cards/GlassCard';
import { StatCard } from '@/components/ui/cards/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/data-table/DataTable';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Loader2,
  FileText,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function AdminStaffRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Review modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED' | 'IN_PROGRESS'>('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // New Request modal (Admin can also submit internal requests)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, categoryFilter]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (categoryFilter !== 'ALL') query.set('category', categoryFilter);
      if (search.trim()) query.set('search', search.trim());

      const res = await apiRequest(`/api/staff-requests?${query.toString()}`);
      if (res.success && res.data?.requests) {
        setRequests(res.data.requests);
      }
    } catch (e) {
      console.error('Failed to load staff requests', e);
    } finally {
      setLoading(false);
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmittingReview(true);
    try {
      const res = await apiRequest(`/api/staff-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: reviewStatus,
          adminNotes: adminNotes.trim(),
        }),
      });
      if (res.success) {
        setSelectedRequest(null);
        setAdminNotes('');
        fetchRequests();
      } else {
        alert(res.message || 'Failed to update request.');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating request.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiRequest('/api/staff-requests', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          priority: newPriority,
          description: newDescription.trim(),
        }),
      });
      if (res.success) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('GENERAL');
        setNewPriority('MEDIUM');
        fetchRequests();
      } else {
        alert(res.message || 'Failed to submit request.');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating request.');
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length;

  const columns: ColumnDef<any>[] = [
    {
      header: 'Request Title & Details',
      cell: (req) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <p className="font-bold text-[#211B24] dark:text-white leading-tight">
              {req.title}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                req.priority === 'URGENT'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                  : req.priority === 'HIGH'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                  : req.priority === 'MEDIUM'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {req.priority}
            </span>
          </div>
          <p className="text-[11px] text-[#77717B] dark:text-zinc-400 mt-1 line-clamp-2">
            {req.description}
          </p>
          {req.adminNotes && (
            <div className="mt-1.5 p-1.5 rounded-lg bg-[rgba(113,75,103,0.06)] border border-[rgba(113,75,103,0.12)] text-[10px] text-[#714B67] dark:text-purple-300">
              <strong>Admin Response:</strong> {req.adminNotes}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Staff Member',
      cell: (req) => (
        <div>
          <p className="font-bold text-[#211B24] dark:text-white text-xs">
            {req.staff?.name || 'Staff Member'}
          </p>
          <p className="text-[11px] text-[#77717B] dark:text-zinc-400">
            {req.staff?.email}
          </p>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (req) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(113,75,103,0.08)] text-[#714B67] dark:text-purple-300 border border-[rgba(113,75,103,0.15)]">
          {req.category}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (req) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            req.status === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/70'
              : req.status === 'REJECTED'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/70'
              : req.status === 'IN_PROGRESS'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/70'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/70'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              req.status === 'APPROVED'
                ? 'bg-emerald-500'
                : req.status === 'REJECTED'
                ? 'bg-rose-500'
                : req.status === 'IN_PROGRESS'
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
          />
          {req.status}
        </span>
      ),
    },
    {
      header: 'Submitted',
      cell: (req) => (
        <span className="text-xs text-[#77717B] dark:text-zinc-400">
          {formatDate(req.createdAt)}
        </span>
      ),
    },
    {
      header: <span className="text-right block">Action</span>,
      className: 'text-right',
      cell: (req) => (
        <button
          onClick={() => {
            setSelectedRequest(req);
            setReviewStatus(req.status === 'PENDING' ? 'APPROVED' : req.status);
            setAdminNotes(req.adminNotes || '');
          }}
          className="btn-subflow-secondary text-xs"
        >
          <span>Review</span>
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/staff"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline"
              >
                <ArrowLeft size={13} />
                <span>Back to Staff Management</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[rgba(113,75,103,0.10)] text-[#714B67] dark:text-purple-300 flex items-center justify-center border border-[rgba(113,75,103,0.18)]">
                <Inbox size={19} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#211B24] dark:text-white tracking-tight">
                Staff Requests &amp; Inquiries Desk
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#77717B] dark:text-zinc-400 mt-1">
              Dedicated operational portal for reviewing staff leave requests, equipment procurement, permission upgrades, and client discount overrides.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-subflow-primary text-xs"
            >
              <Plus size={15} />
              <span>Submit Staff Request</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Pending Requests"
            value={pendingCount.toString()}
            subtext="Awaiting administrative review"
            icon={Clock}
            variant="amber"
          />
          <StatCard
            title="In-Progress"
            value={inProgressCount.toString()}
            subtext="Currently being fulfilled"
            icon={Send}
            variant="blue"
          />
          <StatCard
            title="Approved & Resolved"
            value={approvedCount.toString()}
            subtext="Successfully approved requests"
            icon={CheckCircle2}
            variant="emerald"
          />
        </div>

        {/* Filters and Search Toolbar */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-[rgba(113,75,103,0.18)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77717B]" />
            <input
              type="text"
              placeholder="Search request title, staff name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="EQUIPMENT">Equipment &amp; Hardware</option>
              <option value="ACCESS">Permission &amp; Role Upgrade</option>
              <option value="LEAVE">Leave / Absence</option>
              <option value="CONCESSION">Pricing Concession</option>
              <option value="SUPPORT">Operational Support</option>
              <option value="GENERAL">General Inquiry</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests DataTable */}
        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          emptyTitle="No staff requests found"
          emptyMessage="No requests match your current filters. Click 'Submit Staff Request' to create one."
          emptyAction={
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-subflow-primary text-xs"
            >
              <Plus size={14} />
              <span>Create Request</span>
            </button>
          }
        />

        {/* Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in">
            <div className="modal-dialog max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(113,75,103,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(113,75,103,0.10)] text-[#714B67] dark:text-purple-300 flex items-center justify-center border border-[rgba(113,75,103,0.18)]">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#211B24] dark:text-white">
                      Review Staff Request
                    </h3>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400">
                      Submitted by {selectedRequest.staff?.name} ({selectedRequest.staff?.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-[#77717B] hover:text-[#211B24] dark:hover:text-white p-1 rounded-lg transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-4 rounded-xl bg-[#FAF8FB] dark:bg-zinc-800/80 border border-[rgba(113,75,103,0.16)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#211B24] dark:text-white text-sm">{selectedRequest.title}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#714B67] border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300">
                      {selectedRequest.category}
                    </span>
                  </div>
                  <p className="text-[#77717B] dark:text-zinc-300 leading-relaxed mt-2 whitespace-pre-wrap">
                    {selectedRequest.description}
                  </p>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                      Update Decision Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['APPROVED', 'IN_PROGRESS', 'REJECTED'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setReviewStatus(st)}
                          className={`py-2 px-3 rounded-xl font-bold text-xs border transition-colors ${
                            reviewStatus === st
                              ? st === 'APPROVED'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : st === 'IN_PROGRESS'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'border-[rgba(113,75,103,0.2)] bg-white dark:bg-zinc-800 text-[#211B24] dark:text-zinc-200 hover:bg-[#F8F5F8]'
                          }`}
                        >
                          {st === 'IN_PROGRESS' ? 'In Progress' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                      Administrative Notes / Resolution Details
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add guidance, approval notes, or reason for decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="ui-input"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[rgba(113,75,103,0.14)]">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="btn-subflow-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-subflow-primary text-xs"
                    >
                      {submittingReview ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Save Decision</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Submit Request Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in">
            <div className="modal-dialog max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(113,75,103,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#714B67] text-white flex items-center justify-center font-bold shadow-sm">
                    <Inbox size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#211B24] dark:text-white">
                      Submit Operational Staff Request
                    </h3>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400">Internal company inquiry, equipment, or concession</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#77717B] hover:text-[#211B24] dark:hover:text-white p-1 rounded-lg transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                    Request Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dual-monitor workstation requisition"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="ui-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="ui-input"
                    >
                      <option value="GENERAL">General Inquiry</option>
                      <option value="EQUIPMENT">Equipment &amp; Hardware</option>
                      <option value="ACCESS">Permission &amp; Role Upgrade</option>
                      <option value="LEAVE">Leave / Absence</option>
                      <option value="CONCESSION">Pricing Concession</option>
                      <option value="SUPPORT">Operational Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="ui-input"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent Escalation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                    Detailed Explanation *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide full justification and context for this request..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="ui-input"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[rgba(113,75,103,0.14)]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-subflow-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-subflow-primary text-xs"
                  >
                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
