'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Search, Tag, X, Loader2, Layers, DollarSign } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('SERVICE');
  const [salesPrice, setSalesPrice] = useState('4999');
  const [costPrice, setCostPrice] = useState('1500');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState<any[]>([]);

  // Variant input
  const [varName, setVarName] = useState('');
  const [varSku, setVarSku] = useState('');
  const [varPrice, setVarPrice] = useState('0');

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/products?search=${encodeURIComponent(search)}`);
      if (res.success && res.data) {
        setProducts(res.data.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddVariant = () => {
    if (!varName || !varSku) return;
    setVariants([...variants, { variantName: varName, sku: varSku, additionalPrice: Number(varPrice) }]);
    setVarName('');
    setVarSku('');
    setVarPrice('0');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code,
          type,
          salesPrice: Number(salesPrice),
          costPrice: Number(costPrice),
          description,
          variants,
        }),
      });
      if (res.success) {
        setShowAddModal(false);
        setName('');
        setCode('');
        setDescription('');
        setVariants([]);
        fetchProducts();
      } else {
        alert(res.message || 'Failed to create product');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Products & Services Catalog"
          subtitle="Define recurring billing products, line-item goods, and multi-tier SKUs."
          badge={products.length ? `${products.length} products` : undefined}
          primaryAction={{
            label: 'New Product',
            icon: Plus,
            onClick: () => setShowAddModal(true),
          }}
          search={{
            value: search,
            onChange: setSearch,
            onSubmit: () => fetchProducts(),
            placeholder: 'Search products by name or SKU...',
          }}
        />

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-zinc-500">
              <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
              Loading product catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-zinc-500">
              <Package size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">No products match your criteria</p>
              <p className="text-xs text-zinc-400 mt-0.5">Click "New Product" to catalog your first offering.</p>
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="odoo-card p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#714B67]/40 transition-all"
              >
                {/* Accent Top Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#714B67] opacity-80" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300 font-bold border border-purple-200/50 dark:border-purple-800/40">
                      {p.code}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>

                  <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-zinc-100 mt-2">
                    {p.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 min-h-[36px] line-clamp-2">
                    {p.description || 'Enterprise product offering with flexible billing.'}
                  </p>

                  {/* Variants */}
                  {p.variants?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                        SKU Variants ({p.variants.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v: any) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          >
                            <Tag size={10} className="text-[#714B67]" />
                            {v.variantName} (+₹{Number(v.additionalPrice)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Sales Price</span>
                    <span className="text-2xl font-extrabold font-heading text-[#714B67] dark:text-purple-300 tabular-nums">
                      {formatCurrency(p.salesPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Cost Basis</span>
                    <span className="text-xs font-semibold text-zinc-500 tabular-nums">
                      {formatCurrency(p.costPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300">
                    <Package size={18} />
                  </div>
                  <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                    Create Product or Service
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

              <form onSubmit={handleCreateProduct} className="py-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    placeholder="e.g. Dedicated Virtual Server"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                      placeholder="e.g. PRD-SRV-04"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    >
                      <option value="SERVICE">Service (Recurring)</option>
                      <option value="GOODS">Goods / Hardware</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Sales Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={salesPrice}
                      onChange={(e) => setSalesPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-[#714B67] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Cost Basis (₹)
                    </label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#714B67] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    placeholder="Short product or service specification"
                  />
                </div>

                {/* Variant Builder */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    Product Variants (Optional)
                  </span>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Variant Name"
                        value={varName}
                        onChange={(e) => setVarName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Variant SKU"
                        value={varSku}
                        onChange={(e) => setVarSku(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="w-full py-1.5 bg-[#714B67] text-white font-semibold rounded-md text-xs hover:bg-[#55364E]"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                  {variants.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {variants.map((v, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border font-mono">
                          {v.variantName} ({v.sku})
                        </span>
                      ))}
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
                    disabled={submitting}
                    className="btn-odoo-primary text-xs"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    <span>Save Product</span>
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
