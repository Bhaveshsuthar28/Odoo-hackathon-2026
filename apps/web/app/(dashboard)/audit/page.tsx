'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { History, Search, Filter, ShieldCheck, Loader2 } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  async function fetchLogs() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        entity: entityFilter,
        limit: '50',
      });
      const res = await apiRequest(`/api/audit?${query.toString()}`);
      if (res.success && res.data) {
        setLogs(res.data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300">
              Intelligence Feature 6
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading mt-1">
            System Audit Trail & Governance
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
            Immutable activity log tracking actors, authentication events, billing executions, and state changes.
          </p>
        </div>

        {/* Toolbar */}
        <div className="odoo-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
            <input
              type="text"
              placeholder="Search by actor email or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#737373]">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
            >
              <option value="ALL">All Entities</option>
              <option value="User">User</option>
              <option value="Customer">Customer</option>
              <option value="Subscription">Subscription</option>
              <option value="Invoice">Invoice</option>
              <option value="Payment">Payment</option>
              <option value="Quotation">Quotation</option>
              <option value="BillingExecution">BillingExecution</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Change Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#737373]">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading audit records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#737373]">
                      <History size={32} className="mx-auto mb-2 opacity-50" />
                      No audit logs match current filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#737373] whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#252525] dark:text-white">
                        {l.actorEmail || 'System / Scheduler'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300">
                          {l.actorRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#252525] dark:text-white">
                        {l.action}
                      </td>
                      <td className="py-3 px-4 text-[#737373]">
                        {l.entity}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#737373] max-w-xs truncate">
                        {l.details ? JSON.stringify(l.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
