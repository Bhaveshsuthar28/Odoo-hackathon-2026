'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Layers, Plus, Pause, Play, X, Loader2, CheckCircle2, Calendar } from 'lucide-react';

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
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Subscription Plans & Cadences"
          subtitle="Configure recurring billing cadences (Daily, Weekly, Monthly, Yearly) and pricing terms."
          badge={plans.length ? `${plans.length} tiers` : undefined}
          primaryAction={{
            label: 'New Plan',
            icon: Plus,
            onClick: () => setShowAddModal(true),
          }}
        />

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-zinc-500">
              <Loader2 size={24} className="animate-spin mx-auto text-[#714B67] mb-2" />
              Loading subscription plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-zinc-500">
              <Layers size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">No subscription plans found</p>
              <p className="text-xs text-zinc-400 mt-0.5">Click "New Plan" to define your first subscription tier.</p>
            </div>
          ) : (
            plans.map((p) => (
              <div
                key={p.id}
                className="odoo-card p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#714B67]/40 transition-all"
              >
                {/* Accent Top Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#714B67] opacity-80" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                      {p.billingInterval}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>

                  <h3 className="font-heading font-extrabold text-xl text-zinc-900 dark:text-zinc-100 mt-2">
                    {p.name}
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">{p.code}</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 min-h-[36px] line-clamp-2">
                    {p.description || 'Enterprise recurring plan with automated billing.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
                    <span>Active Contracts:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {p._count?.subscriptions || 0} active
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-extrabold font-heading text-[#714B67] dark:text-purple-300 tabular-nums">
                      {formatCurrency(p.price)}
                    </span>
                    <span className="text-xs text-zinc-400 lowercase ml-1">/{p.billingInterval.toLowerCase()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm"
                  >
                    {p.status === 'ACTIVE' ? (
                      <>
                        <Pause size={12} className="text-amber-600" />
                        <span>Pause Plan</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300">
                    <Layers size={18} />
                  </div>
                  <h3 className="font-heading font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                    Create Subscription Plan
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

              <form onSubmit={handleCreatePlan} className="py-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    placeholder="e.g. Pro Growth Monthly"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Plan Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                      placeholder="PLAN-GROWTH-M"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Billing Interval
                    </label>
                    <select
                      value={billingInterval}
                      onChange={(e) => setBillingInterval(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-[#714B67] tabular-nums"
                  />
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
                    placeholder="Short description of plan features and deliverables"
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
                    <span>Save Plan</span>
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
