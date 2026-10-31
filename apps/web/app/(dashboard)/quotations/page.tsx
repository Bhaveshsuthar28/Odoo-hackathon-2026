'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FileSpreadsheet,
  Plus,
  ArrowRight,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  Calculator,
  Building,
} from 'lucide-react';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Form
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [discPercent, setDiscPercent] = useState(0);

  async function loadData() {
    setLoading(true);
    try {
      const [qRes, cRes, pRes] = await Promise.all([
        apiRequest('/api/quotations'),
        apiRequest('/api/customers?limit=100'),
        apiRequest('/api/products'),
      ]);
      if (qRes.success && qRes.data) setQuotations(qRes.data.quotations);
      if (cRes.success && cRes.data) setCustomers(cRes.data.customers);
      if (pRes.success && pRes.data) setProducts(pRes.data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    const prod = products.find((p) => p.id === selectedProduct);
    if (!prod) return;

    setLines([
      ...lines,
      {
        productId: prod.id,
        name: prod.name,
        quantity: qty,
        unitPrice: Number(prod.salesPrice),
        discountPercent: discPercent,
        taxPercent: 18,
      },
    ]);
    setSelectedProduct('');
    setQty(1);
    setDiscPercent(0);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const calculatedSubtotal = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice * (1 - l.discountPercent / 100),
    0
  );
  const calculatedTax = calculatedSubtotal * 0.18;
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lines.length === 0) {
      alert('Please select a customer and add at least one line item');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          validityDays: 30,
          lines,
        }),
      });
      if (res.success) {
        setShowAddModal(false);
        setLines([]);
        setCustomerId('');
        loadData();
      } else {
        alert(res.message || 'Failed to create quotation');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async (quotationId: string) => {
    setConvertingId(quotationId);
    try {
      const res = await apiRequest(`/api/quotations/${quotationId}/convert`, {
        method: 'POST',
        body: JSON.stringify({ billingInterval: 'MONTHLY' }),
      });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Conversion failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setConvertingId(null);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      !search ||
      q.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Quotations & Proposals"
          subtitle="Draft commercial quotes and seamlessly convert accepted bids into active recurring subscriptions."
          badge={filteredQuotations.length ? `${filteredQuotations.length} proposals` : undefined}
          primaryAction={{
            label: 'New Quotation',
            icon: Plus,
            onClick: () => setShowAddModal(true),
          }}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search by quotation # or customer name...',
          }}
          filter={{
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'ALL', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent' },
              { value: 'ACCEPTED', label: 'Accepted' },
              { value: 'DECLINED', label: 'Declined' },
              { value: 'CONVERTED', label: 'Converted' },
            ],
          }}
        />

        {/* Quotations List Table */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer Organization</th>
                  <th className="py-3 px-4">Validity Date</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Tax (GST)</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading proposals...
                    </td>
                  </tr>
                ) : filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <FileSpreadsheet size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No quotations match criteria</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Try altering your search or status filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                        {q.quotationNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {q.customer.name}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                        {formatDate(q.validityDate)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                        {formatCurrency(q.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 tabular-nums">
                        {formatCurrency(q.taxAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-base text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {q.status !== 'CONVERTED' ? (
                          <button
                            type="button"
                            onClick={() => handleConvert(q.id)}
                            disabled={convertingId === q.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                          >
                            {convertingId === q.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <ArrowRight size={13} />
                            )}
                            <span>Convert to Subscription</span>
                          </button>
                        ) : (
                          <span className="text-xs text-[#714B67] dark:text-purple-300 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 size={14} /> Converted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Quotation Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                    Draft Commercial Quotation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateQuotation} className="py-4 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Select Target Customer *
                  </label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    <option value="">-- Choose Customer Organization --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerNumber}) {c.company ? `— ${c.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Item Builder */}
                <div className="p-4 bg-zinc-50/70 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Add Products & Services
                    </span>
                    <span className="text-[11px] text-zinc-400">18% GST auto-computed</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 sm:col-span-6">
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{Number(p.salesPrice).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-center"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Disc %"
                        value={discPercent}
                        onChange={(e) => setDiscPercent(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-center"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="w-full py-2 bg-[#714B67] hover:bg-[#55364E] text-white font-semibold rounded-lg text-xs transition-colors"
                      >
                        Add Line
                      </button>
                    </div>
                  </div>

                  {lines.length > 0 && (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                      {lines.map((l, i) => (
                        <div key={i} className="p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {l.quantity}x {l.name}
                            </span>
                            <span className="text-zinc-400 ml-2">(@₹{l.unitPrice})</span>
                            {l.discountPercent > 0 && (
                              <span className="text-emerald-600 font-semibold ml-2">
                                [-{l.discountPercent}%]
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                              ₹{(l.quantity * l.unitPrice * (1 - l.discountPercent / 100)).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(i)}
                              className="text-zinc-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary Box */}
                  {lines.length > 0 && (
                    <div className="pt-2 text-right space-y-1 text-xs">
                      <div className="text-zinc-500">
                        Subtotal: <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">₹{calculatedSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="text-zinc-500">
                        Estimated 18% GST: <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">₹{calculatedTax.toFixed(2)}</span>
                      </div>
                      <div className="text-sm font-extrabold text-[#714B67] dark:text-purple-300 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                        Total Quote: ₹{calculatedTotal.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-odoo-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || lines.length === 0}
                    className="btn-odoo-primary text-xs disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    <span>Issue Quotation Proposal</span>
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
