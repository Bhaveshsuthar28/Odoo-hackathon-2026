'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard, GlassCardHeader } from '@/components/ui/cards/GlassCard';
import { StatCard } from '@/components/ui/cards/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/data-table/DataTable';
import { apiRequest } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Plus,
  Loader2,
  Send,
  MessageSquare,
} from 'lucide-react';

export default function StaffRequestsSelfPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  async function fetchMyRequests() {
    setLoading(true);
    try {
      const res = await apiRequest('/api/staff-requests');
      if (res.success && res.data?.requests) {
        setRequests(res.data.requests);
      }
    } catch (e) {
      console.error('Failed to load my staff requests', e);
    } finally {
      setLoading(false);
    }
  }

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
        fetchMyRequests();
      } else {
        alert(res.message || 'Failed to submit request.');
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting request.');
    } finally {
      setCreating(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'Request Summary',
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
                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
              }`}
            >
              {req.priority}
            </span>
          </div>
          <p className="text-[11px] text-[#77717B] dark:text-zinc-400 mt-1 line-clamp-2">
            {req.description}
          </p>
          {req.adminNotes && (
            <div className="mt-1.5 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-[11px] text-[#714B67] dark:text-purple-300">
              <strong>Admin Response:</strong> {req.adminNotes}
            </div>
          )}
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
      header: 'Date Created',
      cell: (req) => (
        <span className="text-xs text-[#77717B] dark:text-zinc-400">
          {formatDate(req.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/staff/dashboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline"
              >
                <ArrowLeft size={13} />
                <span>Back to Staff Workspace</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#211B24] dark:text-white tracking-tight">
              My Operational Requests
            </h1>
            <p className="text-xs sm:text-sm text-[#77717B] dark:text-zinc-400 mt-1">
              Submit requests for hardware/equipment, permission escalation, leave of absence, or client discount approvals.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-subflow-primary text-xs"
          >
            <Plus size={15} />
            <span>New Request</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          emptyTitle="No requests submitted yet"
          emptyMessage="You have not submitted any operational requests. Click 'New Request' to get started."
          emptyAction={
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-subflow-primary text-xs"
            >
              <Plus size={14} />
              <span>Create First Request</span>
            </button>
          }
        />

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
                      Submit Operational Request
                    </h3>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400">Forwarded directly to administration for review</p>
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
                    placeholder="e.g. Request for special customer concession override"
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
                    Details &amp; Justification *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide full description and reason for your request..."
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
