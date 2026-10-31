'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calculator, ArrowRight, CheckCircle2, Loader2, Sparkles, TrendingUp } from 'lucide-react';

export default function SimulatorPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation form
  const [selectedSubId, setSelectedSubId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sRes, pRes] = await Promise.all([
          apiRequest('/api/subscriptions'),
          apiRequest('/api/plans'),
        ]);
        if (sRes.success && sRes.data) setSubscriptions(sRes.data.subscriptions);
        if (pRes.success && pRes.data) setPlans(pRes.data.plans);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || !selectedPlanId) return;

    setSimulating(true);
    try {
      const res = await apiRequest('/api/simulator/simulate', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: selectedSubId,
          targetPlanId: selectedPlanId,
          discountCode,
        }),
      });
      if (res.success && res.data) {
        setResult(res.data.simulation);
      } else {
        alert(res.message || 'Simulation failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Odoo Control Panel */}
        <ControlPanel
          title="Mid-Cycle Billing Simulator"
          subtitle="Preview plan switches, calculate exact prorated daily credits, 18% GST tax deltas, and immediate invoice charges."
          badge="PRORATION ENGINE"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="odoo-card p-6 lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Calculator size={18} className="text-[#714B67]" />
              <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Simulation Parameters
              </h3>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">
                  1. Existing Active Contract *
                </label>
                <select
                  required
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="">-- Choose Customer Subscription --</option>
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subscriptionNumber} — {s.customer.name} ({s.plan.name} - ₹{s.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">
                  2. Target Plan Upgrade / Downgrade *
                </label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="">-- Choose Target Plan Tier --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price} /{p.billingInterval}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">
                  3. Promo Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. LAUNCH20 or FLAT1000"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="btn-odoo-primary w-full py-2.5 text-xs font-bold justify-center"
              >
                {simulating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Compute Proration Delta</span>
              </button>
            </form>
          </div>

          {/* Results Preview */}
          <div className="odoo-card p-6 lg:col-span-7">
            <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-zinc-100 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Proration Breakdown Preview
            </h3>

            {result ? (
              <div className="space-y-5 text-xs animate-in fade-in duration-200">
                {/* Plan comparison pill */}
                <div className="p-4 bg-zinc-50/80 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Current Tier</span>
                    <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">{result.currentPlan.name}</p>
                    <span className="text-xs text-zinc-500 font-mono">₹{result.currentPlan.price}</span>
                  </div>
                  <ArrowRight className="text-[#714B67] dark:text-purple-300" size={20} />
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Target Tier</span>
                    <p className="font-extrabold text-[#714B67] dark:text-purple-300 text-sm mt-0.5">{result.targetPlan.name}</p>
                    <span className="text-xs text-zinc-500 font-mono">₹{result.targetPlan.price}</span>
                  </div>
                </div>

                {/* Days remaining */}
                <div className="text-xs text-zinc-500 flex justify-between px-1">
                  <span>Days remaining in current billing cycle:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                    {result.billingCycle.daysRemaining} days (out of {result.billingCycle.totalCycleDays})
                  </strong>
                </div>

                {/* Calculations Table */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                  <div className="p-3.5 flex justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <span className="text-zinc-500">Unused credit from existing plan:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      -₹{result.financials.unusedCredit.toFixed(2)}
                    </strong>
                  </div>
                  <div className="p-3.5 flex justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <span className="text-zinc-500">Prorated charge for new plan:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-bold tabular-nums">
                      ₹{result.financials.proratedNewCharge.toFixed(2)}
                    </strong>
                  </div>
                  {result.financials.discountAmount > 0 && (
                    <div className="p-3.5 flex justify-between text-emerald-600 dark:text-emerald-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <span>Promo code discount applied:</span>
                      <strong className="font-bold tabular-nums">-₹{result.financials.discountAmount.toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="p-3.5 flex justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <span className="text-zinc-500">Applicable GST (18%):</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-bold tabular-nums">
                      ₹{result.financials.taxAmount.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Immediate Due Banner */}
                <div className="p-5 rounded-xl bg-[#55364E] text-white flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-purple-200 font-bold">
                      Net Charge Due Today
                    </span>
                    <p className="text-3xl font-extrabold font-heading tabular-nums mt-0.5">
                      ₹{result.financials.immediateDueAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-purple-200">
                    <span>Next Cycle Renewal Rate:</span>
                    <p className="font-extrabold text-white text-base tabular-nums">
                      ₹{result.financials.subsequentRenewalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-zinc-400">
                <Calculator size={40} className="mx-auto mb-2 opacity-40 text-[#714B67]" />
                <p className="font-semibold text-zinc-600 dark:text-zinc-400">Proration Engine Ready</p>
                <p className="text-xs text-zinc-400 mt-0.5">Select a subscription and target tier to preview exact ledger impact.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
