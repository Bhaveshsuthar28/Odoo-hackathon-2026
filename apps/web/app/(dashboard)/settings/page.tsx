'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard, GlassCardHeader } from '@/components/ui/cards/GlassCard';
import {
  Settings,
  Building,
  CreditCard,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Save,
  Lock,
  Mail,
  Receipt,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'organization' | 'billing' | 'security'>('organization');
  const [savedToast, setSavedToast] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('SubFlow Technologies India Pvt Ltd');
  const [billingCurrency, setBillingCurrency] = useState('INR (₹)');
  const [taxNumber, setTaxNumber] = useState('GSTIN27AABCS1429B1Z');
  const [supportEmail, setSupportEmail] = useState('support@subflow.io');
  const [gracePeriodDays, setGracePeriodDays] = useState('7');
  const [advanceBillingDays, setAdvanceBillingDays] = useState('3');
  const [maxDunningRetries, setMaxDunningRetries] = useState('3');
  const [enforceGmailOtp, setEnforceGmailOtp] = useState(true);
  const [requireStaffPassUpdate, setRequireStaffPassUpdate] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(113,75,103,0.10)] text-[#714B67] dark:text-purple-300 font-bold text-xs border border-[rgba(113,75,103,0.18)] mb-1">
              <Settings size={13} />
              <span>Platform &amp; System Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#211B24] dark:text-white tracking-tight">
              System Settings &amp; Governance
            </h1>
            <p className="text-xs sm:text-sm text-[#77717B] dark:text-zinc-400 mt-1">
              Manage enterprise billing parameters, tax IDs, subscription automation rules, and security policies.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="btn-subflow-primary text-xs shrink-0"
          >
            <Save size={15} />
            <span>Save Configuration</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-white/70 dark:bg-zinc-800 rounded-2xl border border-[rgba(113,75,103,0.14)] w-fit">
          <button
            onClick={() => setActiveTab('organization')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'organization'
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-[#77717B] hover:text-[#211B24] dark:hover:text-white'
            }`}
          >
            <Building size={14} />
            <span>Organization &amp; Tax</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'billing'
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-[#77717B] hover:text-[#211B24] dark:hover:text-white'
            }`}
          >
            <CreditCard size={14} />
            <span>Billing Automation</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-[#77717B] hover:text-[#211B24] dark:hover:text-white'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Security &amp; OTP</span>
          </button>
        </div>

        {/* Tab 1: Organization & Tax */}
        {activeTab === 'organization' && (
          <GlassCard>
            <GlassCardHeader
              title="Organization Profile & Legal Tax Information"
              subtitle="Displayed on customer invoices, payment receipts, and tax ledgers"
              icon={Building}
            />

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                  Legal Entity / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                  Base Billing Currency
                </label>
                <select
                  value={billingCurrency}
                  onChange={(e) => setBillingCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                  <option value="USD ($)">USD ($) — United States Dollar</option>
                  <option value="EUR (€)">EUR (€) — Euro</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                  GSTIN / Tax Identification
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                  Official Support &amp; Billing Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div className="sm:col-span-2 pt-4 flex justify-end">
                <button type="submit" className="btn-subflow-primary text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Tab 2: Billing Automation */}
        {activeTab === 'billing' && (
          <GlassCard>
            <GlassCardHeader
              title="Recurring Billing Engine & Dunning Rules"
              subtitle="Configure recurring subscription renewal cycles, automated invoice generation, and retry logic"
              icon={CreditCard}
            />

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                    Advance Invoice Generation
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={advanceBillingDays}
                      onChange={(e) => setAdvanceBillingDays(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    />
                    <span className="text-[#77717B] font-medium shrink-0">days before</span>
                  </div>
                  <p className="text-[11px] text-[#77717B] mt-1">Invoices created prior to renewal date</p>
                </div>

                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                    Payment Grace Period
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    />
                    <span className="text-[#77717B] font-medium shrink-0">days</span>
                  </div>
                  <p className="text-[11px] text-[#77717B] mt-1">Before subscription marks as overdue</p>
                </div>

                <div>
                  <label className="block font-bold text-[#211B24] dark:text-zinc-200 mb-1.5">
                    Maximum Automated Retries
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxDunningRetries}
                    onChange={(e) => setMaxDunningRetries(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(113,75,103,0.18)] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#211B24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                  <p className="text-[11px] text-[#77717B] mt-1">Retries via automated payment gateway</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="btn-subflow-primary text-xs">
                  Save Billing Rules
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Tab 3: Security & OTP */}
        {activeTab === 'security' && (
          <GlassCard>
            <GlassCardHeader
              title="Identity & Access Governance"
              subtitle="Enforce two-factor verification, email domain policies, and administrative safeguards"
              icon={ShieldCheck}
            />

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[rgba(113,75,103,0.06)] border border-[rgba(113,75,103,0.14)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#211B24] dark:text-white">
                      Enforce Gmail OTP for Customer Registration
                    </p>
                    <p className="text-[11px] text-[#77717B]">
                      Requires all customer signups to use a valid @gmail.com address and verify with a 6-digit OTP.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceGmailOtp}
                    onChange={(e) => setEnforceGmailOtp(e.target.checked)}
                    className="h-4 w-4 rounded text-[#714B67] focus:ring-[#714B67]"
                  />
                </div>

                <div className="pt-3 border-t border-[rgba(113,75,103,0.10)] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#211B24] dark:text-white">
                      Mandate Password Reset for Provisioned Staff
                    </p>
                    <p className="text-[11px] text-[#77717B]">
                      Forces staff to choose a new password upon their initial login with temporary admin credentials.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireStaffPassUpdate}
                    onChange={(e) => setRequireStaffPassUpdate(e.target.checked)}
                    className="h-4 w-4 rounded text-[#714B67] focus:ring-[#714B67]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="btn-subflow-primary text-xs">
                  Save Security Policies
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Saved confirmation toast */}
        {savedToast && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#211B24] text-white px-4 py-3 rounded-2xl shadow-2xl border border-purple-400/30 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 text-xs font-medium">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
