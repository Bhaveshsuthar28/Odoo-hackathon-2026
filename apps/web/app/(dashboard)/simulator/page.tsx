'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calculator, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

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
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300">
              Intelligence Feature 2
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white font-heading mt-1">
            Billing Simulator & Prorations
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5">
            Preview mid-cycle plan switches, prorated credit adjustments, taxes, and exact immediate charges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="odoo-card p-6 lg:col-span-5 space-y-4">
            <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
              Simulation Parameters
            </h3>

            <form onSubmit={handleSimulate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#252525] dark:text-white">
                  1. Select Current Subscription *
                </label>
                <select
                  required
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                >
                  <option value="">-- Choose Subscription --</option>
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subscriptionNumber} — {s.customer.name} ({s.plan.name} - ₹{s.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#252525] dark:text-white">
                  2. Select Target Upgrade / Downgrade Plan *
                </label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md"
                >
                  <option value="">-- Choose New Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price} /{p.billingInterval}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#252525] dark:text-white">
                  3. Promo Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. LAUNCH20 or FLAT1000"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F8] dark:bg-[#27272A] border rounded-md uppercase font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2.5 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm flex items-center justify-center gap-2"
              >
                {simulating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Calculate Financial Impact</span>
              </button>
            </form>
          </div>

          {/* Results Preview */}
          <div className="odoo-card p-6 lg:col-span-7">
            <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white mb-4">
              Proration Breakdown Preview
            </h3>

            {result ? (
              <div className="space-y-5 text-xs animate-in fade-in duration-200">
                {/* Plan comparison pill */}
                <div className="p-4 bg-[#F7F7F8] dark:bg-[#27272A] rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#737373] uppercase font-semibold">Current Plan</span>
                    <p className="font-bold text-[#252525] dark:text-white text-sm">{result.currentPlan.name}</p>
                    <span className="text-xs text-[#737373]">₹{result.currentPlan.price}</span>
                  </div>
                  <ArrowRight className="text-[#714B67]" size={20} />
                  <div className="text-right">
                    <span className="text-[10px] text-[#737373] uppercase font-semibold">Target Plan</span>
                    <p className="font-bold text-[#714B67] dark:text-purple-300 text-sm">{result.targetPlan.name}</p>
                    <span className="text-xs text-[#737373]">₹{result.targetPlan.price}</span>
                  </div>
                </div>

                {/* Days remaining */}
                <div className="text-xs text-[#737373] flex justify-between px-1">
                  <span>Days remaining in current billing cycle:</span>
                  <strong className="text-[#252525] dark:text-white">
                    {result.billingCycle.daysRemaining} days (out of {result.billingCycle.totalCycleDays})
                  </strong>
                </div>

                {/* Calculations Table */}
                <div className="border border-[#E5E7EB] dark:border-[#27272A] rounded-md divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                  <div className="p-3 flex justify-between">
                    <span className="text-[#737373]">Unused Credit from current plan:</span>
                    <strong className="text-emerald-600 font-semibold">-₹{result.financials.unusedCredit.toFixed(2)}</strong>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#737373]">Prorated charge for new plan:</span>
                    <strong>₹{result.financials.proratedNewCharge.toFixed(2)}</strong>
                  </div>
                  {result.financials.discountAmount > 0 && (
                    <div className="p-3 flex justify-between text-emerald-600">
                      <span>Promo Discount applied:</span>
                      <strong>-₹{result.financials.discountAmount.toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="p-3 flex justify-between">
                    <span className="text-[#737373]">Applicable GST (18%):</span>
                    <strong>₹{result.financials.taxAmount.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Immediate Due Banner */}
                <div className="p-4 rounded-lg bg-[#55364E] text-white flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-purple-200 font-semibold">
                      Immediate Charge Today
                    </span>
                    <p className="text-2xl font-extrabold font-heading">
                      ₹{result.financials.immediateDueAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-purple-200">
                    <span>Subsequent Renewal Rate:</span>
                    <p className="font-bold text-white text-sm">₹{result.financials.subsequentRenewalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-[#737373]">
                <Calculator size={36} className="mx-auto mb-2 opacity-50" />
                Select subscription and target plan to simulate exact financial impact.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
