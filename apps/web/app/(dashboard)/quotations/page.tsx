'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileSpreadsheet, Plus, ArrowRight, CheckCircle2, X, Loader2, RefreshCw } from 'lucide-react';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        alert(`Successfully converted into Subscription ${res.data.subscription.subscriptionNumber}!`);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
              Quotations & Proposals
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Draft commercial quotes and seamlessly convert accepted bids into active recurring subscriptions.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Create Quotation</span>
          </button>
        </div>

        {/* Quotations List */}
        <div className="odoo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] dark:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Validity Date</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Tax (GST)</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737373]">
                      <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
                      Loading quotations...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737373]">
                      <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-50" />
                      No quotations found. Click "Create Quotation" to start.
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#714B67] dark:text-purple-300">
                        {q.quotationNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#252525] dark:text-white">
                        {q.customer.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#737373]">
                        {formatDate(q.validityDate)}
                      </td>
                      <td className="py-3.5 px-4">{formatCurrency(q.subtotal)}</td>
                      <td className="py-3.5 px-4 text-[#737373]">{formatCurrency(q.taxAmount)}</td>
                      <td className="py-3.5 px-4 font-bold text-base text-[#252525] dark:text-white">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            q.status === 'CONVERTED'
                              ? 'bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300'
                              : q.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {q.status !== 'CONVERTED' ? (
                          <button
                            onClick={() => handleConvert(q.id)}
                            disabled={convertingId === q.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                          >
                            {convertingId === q.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ArrowRight size={12} />
                            )}
                            <span>Convert to Subscription</span>
                          </button>
                        ) : (
                          <span className="text-xs text-purple-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 size={13} /> Converted
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#27272A]">
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Create Commercial Quotation
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-[#737373]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateQuotation} className="py-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Select Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerNumber}) - {c.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Item Builder */}
                <div className="p-3 bg-[#F7F7F8] dark:bg-[#27272A] rounded-md border border-[#E5E7EB] dark:border-[#3F3F46] space-y-3">
                  <span className="font-semibold block text-[#252525] dark:text-white">Add Products & Services to Quote</span>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#18181B] border rounded-md"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.salesPrice})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#18181B] border rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Disc %"
                        value={discPercent}
                        onChange={(e) => setDiscPercent(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#18181B] border rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="w-full py-1.5 bg-[#714B67] text-white font-semibold rounded-md hover:bg-[#55364E]"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {lines.length > 0 && (
                    <div className="divide-y divide-[#E5E7EB] dark:divide-[#3F3F46] bg-white dark:bg-[#18181B] border rounded-md p-2">
                      {lines.map((l, i) => (
                        <div key={i} className="py-1.5 flex justify-between items-center text-xs">
                          <span>{l.quantity}x {l.name} (@₹{l.unitPrice}) {l.discountPercent > 0 && `[-${l.discountPercent}%]`}</span>
                          <span className="font-semibold">₹{(l.quantity * l.unitPrice * (1 - l.discountPercent / 100)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || lines.length === 0}
                    className="px-4 py-2 bg-[#714B67] text-white rounded font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Save & Issue Quotation'}
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
