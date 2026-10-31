'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Search, Tag, X, Loader2, Layers } from 'lucide-react';

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
              Products & Service Catalog
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Define recurring billing products, line-item goods, and multi-tier SKUs.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Create Product</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-[#737373]">
              <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
              Loading product catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-[#737373]">
              <Package size={36} className="mx-auto mb-2 opacity-50" />
              No products found. Click "Create Product" to add your first item.
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="odoo-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-[#714B67] dark:text-purple-300 font-bold">
                      {p.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white mt-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-1 line-clamp-2">
                    {p.description || 'No description provided.'}
                  </p>

                  {/* Variants */}
                  {p.variants?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[11px] font-semibold text-[#737373] block mb-1">
                        Variants ({p.variants.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v: any) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#252525] dark:text-white"
                          >
                            <Tag size={10} className="text-[#714B67]" />
                            {v.variantName} (+₹{Number(v.additionalPrice)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#737373] uppercase font-semibold block">Sales Price</span>
                    <span className="text-lg font-extrabold font-heading text-[#714B67] dark:text-purple-300">
                      {formatCurrency(p.salesPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#737373] uppercase font-semibold block">Cost Price</span>
                    <span className="text-xs font-semibold text-[#737373]">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#27272A]">
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Create Product or Service
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-[#737373] hover:text-[#252525] dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#252525] dark:text-white mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                    placeholder="e.g. Dedicated Virtual Server"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Product Code / SKU *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                      placeholder="e.g. PRD-SRV-04"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                    >
                      <option value="SERVICE">Service (Recurring)</option>
                      <option value="GOODS">Goods / Hardware</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Sales Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={salesPrice}
                      onChange={(e) => setSalesPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#252525] dark:text-white mb-1">Cost Price (₹)</label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#252525] dark:text-white mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                    placeholder="Detailed service specifications..."
                  />
                </div>

                {/* Variants builder */}
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#27272A]">
                  <label className="block font-semibold text-[#252525] dark:text-white mb-1">Add Product Variants</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Variant (e.g. 16GB RAM)"
                      value={varName}
                      onChange={(e) => setVarName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={varSku}
                      onChange={(e) => setVarSku(e.target.value)}
                      className="w-24 px-2.5 py-1.5 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="+Price"
                      value={varPrice}
                      onChange={(e) => setVarPrice(e.target.value)}
                      className="w-20 px-2.5 py-1.5 bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 py-1.5 bg-[#714B67] text-white rounded-md font-semibold"
                    >
                      Add
                    </button>
                  </div>

                  {variants.length > 0 && (
                    <div className="space-y-1">
                      {variants.map((v, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#F7F7F8] dark:bg-[#27272A] p-2 rounded">
                          <span>{v.variantName} (SKU: {v.sku})</span>
                          <span className="font-semibold text-emerald-600">+₹{v.additionalPrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E7EB] dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-md border border-[#E5E7EB] dark:border-[#3F3F46] text-[#737373]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm flex items-center gap-1.5"
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
