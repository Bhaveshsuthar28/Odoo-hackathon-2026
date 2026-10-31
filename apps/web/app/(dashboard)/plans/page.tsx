'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Layers, Plus, Pause, Play, X, Loader2, CheckCircle2 } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [price, setPrice] = useState('4999');
  const [description, setDescription] = useState('');

  async function fetchPlans() {
    setLoading(true);
    try {
      const res = await apiRequest('/api/plans');
      if (res.success && res.data) {
        setPlans(res.data.plans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleStatus = async (plan: any) => {
    const action = plan.status === 'ACTIVE' ? 'pause' : 'resume';
    try {
      const res = await apiRequest(`/api/plans/${plan.id}/${action}`, { method: 'POST' });
      if (res.success) {
        fetchPlans();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/plans', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code,
          billingInterval,
          price: Number(price),
          description,
        }),
      });
      if (res.success) {
        setShowAddModal(false);
        setName('');
        setCode('');
        setDescription('');
        fetchPlans();
      } else {
        alert(res.message || 'Failed to create plan');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading">
              Subscription Plans
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
              Configure recurring intervals (Daily, Weekly, Monthly, Yearly) and pricing terms.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Create New Plan</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-[#737373]">
              <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
              Loading subscription plans...
            </div>
          ) : (
            plans.map((p) => (
              <div key={p.id} className="odoo-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300">
                      {p.billingInterval}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-[#252525] dark:text-white mt-1">
                    {p.name}
                  </h3>
                  <span className="text-xs font-mono text-[#737373]">{p.code}</span>
                  <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-2">
                    {p.description || 'Enterprise recurring plan with automated billing.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#27272A] text-xs text-[#737373] flex justify-between">
                    <span>Active Subscriptions:</span>
                    <strong className="text-[#252525] dark:text-white font-heading text-sm">
                      {p._count?.subscriptions || 0}
                    </strong>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-extrabold font-heading text-[#714B67] dark:text-purple-300">
                      {formatCurrency(p.price)}
                    </span>
                    <span className="text-[11px] text-[#737373] lowercase">/{p.billingInterval.toLowerCase()}</span>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(p)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded border border-[#E5E7EB] dark:border-[#3F3F46] hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {p.status === 'ACTIVE' ? (
                      <>
                        <Pause size={12} className="text-amber-600" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} className="text-emerald-600" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Plan Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-lg shadow-xl max-w-md w-full border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#27272A]">
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Create Subscription Plan
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-[#737373]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                    placeholder="e.g. Pro Growth Monthly"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Plan Code *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                      placeholder="e.g. PLAN-GROWTH-M"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Interval</label>
                    <select
                      value={billingInterval}
                      onChange={(e) => setBillingInterval(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                  />
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
                    disabled={submitting}
                    className="px-4 py-2 bg-[#714B67] text-white rounded font-semibold"
                  >
                    {submitting ? 'Creating...' : 'Save Plan'}
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
