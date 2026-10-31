'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Search, Loader2, Receipt } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await apiRequest('/api/payments');
      if (res.success && res.data) {
        setPayments(res.data.payments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.paymentNumber?.toLowerCase().includes(s) ||
      p.customer?.name?.toLowerCase().includes(s) ||
      p.invoice?.invoiceNumber?.toLowerCase().includes(s) ||
      p.reference?.toLowerCase().includes(s)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Payments Ledger & Cashflow"
          subtitle="Audit trail of all UPI, Card, Net Banking, and cash settlements reconciled with invoices."
          badge={filteredPayments.length ? `${filteredPayments.length} transactions` : undefined}
          secondaryActions={[
            {
              label: 'View Invoices',
              icon: Receipt,
              href: '/invoices',
            },
          ]}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search payments by ref, customer, or invoice #...',
          }}
        />

        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer Organization</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Transaction UTR / Ref</th>
                  <th className="py-3 px-4">Settlement Date</th>
                  <th className="py-3 px-4">Amount Reconciled</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading payments ledger...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <CreditCard size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No payment transactions found</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Reconcile outstanding invoices to record payments.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                        {p.invoice?.invoiceNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {p.customer.name}
                      </td>
                      <td className="py-3.5 px-4 uppercase tracking-wider font-bold text-[10px] text-zinc-600 dark:text-zinc-400">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {p.reference || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
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
