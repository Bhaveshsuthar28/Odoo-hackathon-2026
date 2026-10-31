'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { apiRequest } from '@/lib/api';
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
        {/* Odoo Control Panel */}
        <ControlPanel
          title="System Audit Trail & Governance"
          subtitle="Immutable activity log tracking actors, auth events, billing engine runs, and financial transitions."
          badge="COMPLIANCE LOG"
          search={{
            value: search,
            onChange: setSearch,
            onSubmit: () => fetchLogs(),
            placeholder: 'Search audit records by actor email or action...',
          }}
          filter={{
            label: 'Entity',
            value: entityFilter,
            onChange: setEntityFilter,
            options: [
              { value: 'ALL', label: 'All Entities' },
              { value: 'User', label: 'User' },
              { value: 'Customer', label: 'Customer' },
              { value: 'Subscription', label: 'Subscription' },
              { value: 'Invoice', label: 'Invoice' },
              { value: 'Payment', label: 'Payment' },
              { value: 'Quotation', label: 'Quotation' },
              { value: 'BillingExecution', label: 'BillingExecution' },
            ],
          }}
        />

        {/* Audit Log Table */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Change Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-zinc-500">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading audit records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-zinc-500">
                      <History size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No audit logs match criteria</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Try resetting search or entity filters.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {l.actorEmail || 'System / Billing Scheduler'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50">
                          {l.actorRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {l.action}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                        {l.entity}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
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
