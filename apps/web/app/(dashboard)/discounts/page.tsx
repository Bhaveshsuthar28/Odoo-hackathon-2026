'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Percent, Plus, Tag, X, Loader2, Sparkles } from 'lucide-react';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [value, setValue] = useState('15');
  const [minPurchase, setMinPurchase] = useState('2000');

  async function fetchDiscounts() {
    setLoading(true);
    try {
      const res = await apiRequest('/api/discounts');
      if (res.success && res.data) {
        setDiscounts(res.data.discounts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/discounts', {
        method: 'POST',
        body: JSON.stringify({
          code: code.toUpperCase(),
          name,
          discountType,
          value: Number(value),
          minPurchaseAmount: Number(minPurchase),
        }),
      });
      if (res.success) {
        setShowAddModal(false);
        setCode('');
        setName('');
        fetchDiscounts();
      } else {
        alert(res.message || 'Error creating discount');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Discount Rules & Coupons"
          subtitle="Configure percentage or fixed price reductions automatically applied during recurring billing cycles."
          badge={discounts.length ? `${discounts.length} coupons` : undefined}
          primaryAction={{
            label: 'New Coupon Code',
            icon: Plus,
            onClick: () => setShowAddModal(true),
          }}
        />

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-zinc-500">
              <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
              Loading discounts...
            </div>
          ) : discounts.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-zinc-500">
              <Percent size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">No discount codes defined</p>
              <p className="text-xs text-zinc-400 mt-0.5">Click "New Coupon Code" to incentivize subscriptions.</p>
            </div>
          ) : (
            discounts.map((d) => (
              <div
                key={d.id}
                className="odoo-card p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#714B67]/40 transition-all border-dashed"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-extrabold uppercase px-3 py-1 rounded-lg bg-purple-50 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 flex items-center gap-1.5">
                      <Tag size={13} />
                      {d.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                      Active
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                    {d.name}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-heading text-[#714B67] dark:text-purple-300 tabular-nums">
                      {d.discountType === 'PERCENTAGE' ? `${d.value}% OFF` : `₹${d.value} OFF`}
                    </span>
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">
                      {d.discountType}
                    </span>
                  </div>

                  {d.minPurchaseAmount && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Min Purchase:{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100 font-semibold tabular-nums">
                        {formatCurrency(d.minPurchaseAmount)}
                      </strong>
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>Redemptions</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {d.usedCount || 0} times used
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Discount Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300">
                    <Percent size={18} />
                  </div>
                  <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                    Create Discount Coupon
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

              <form onSubmit={handleCreate} className="py-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    placeholder="e.g. ANNUAL20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Campaign / Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    placeholder="e.g. New Year Enterprise Deal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-base font-extrabold tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold tabular-nums"
                  />
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
                    disabled={submitting}
                    className="btn-odoo-primary text-xs"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    <span>Save Coupon</span>
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
