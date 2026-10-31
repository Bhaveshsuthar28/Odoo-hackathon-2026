'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Search, Loader2 } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
            Payments Ledger & Reconciliation
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
            Audit trail of all UPI, Card, Net Banking, and cash transactions reconciled with invoices.
          </p>
        </div>

        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737373]">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading payments...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737373]">
                      <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#714B67] dark:text-purple-300">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#252525] dark:text-white">
                        {p.invoice?.invoiceNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#252525] dark:text-white">
                        {p.customer.name}
                      </td>
                      <td className="py-3.5 px-4 uppercase tracking-wider font-semibold text-[11px]">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#737373]">
                        {p.reference || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[#737373]">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
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
