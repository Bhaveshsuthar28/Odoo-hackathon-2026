'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Percent, Plus, Tag, X, Loader2 } from 'lucide-react';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
              Discount Rules & Promo Coupons
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Create percentage or fixed price reductions automatically applied during recurring billing cycles.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>New Discount Code</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-[#737373]">
              <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
              Loading discounts...
            </div>
          ) : (
            discounts.map((d) => (
              <div key={d.id} className="odoo-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[#714B67] dark:text-purple-300 font-mono font-bold text-sm">
                    <Tag size={13} />
                    <span>{d.code}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white mt-2">
                  {d.name}
                </h3>

                <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#27272A] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Benefit:</span>
                    <strong className="text-emerald-600 font-heading text-sm">
                      {d.discountType === 'PERCENTAGE' ? `${d.value}% Off` : `₹${d.value} Flat Off`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Min Purchase:</span>
                    <span className="font-medium">{formatCurrency(d.minPurchaseAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Times Used:</span>
                    <span className="font-medium">{d.usageCount} times</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-lg shadow-xl max-w-md w-full border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-heading font-bold text-base">New Discount Rule</h3>
                <button onClick={() => setShowAddModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleCreate} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md font-mono uppercase"
                    placeholder="e.g. FLASH30"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Promo Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                    placeholder="e.g. 30% Festive Discount"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Discount Value *</label>
                    <input
                      type="number"
                      required
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#714B67] text-white rounded font-semibold">Save Discount</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
