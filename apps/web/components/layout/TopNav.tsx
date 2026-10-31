'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import {
  Search,
  Bell,
  Play,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface TopNavProps {
  collapsed: boolean;
}

export function TopNav({ collapsed }: TopNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [billingRunning, setBillingRunning] = useState(false);
  const [billingResult, setBillingResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Executive Financial Dashboard';
      case '/customers': return 'Customer Management';
      case '/products': return 'Products & Variants';
      case '/plans': return 'Subscription Plans';
      case '/quotations': return 'Quotations & Proposals';
      case '/subscriptions': return 'Subscriptions Lifecycle';
      case '/invoices': return 'Invoices & Billing';
      case '/payments': return 'Payments & Reconciliation';
      case '/discounts': return 'Discount Rules & Coupons';
      case '/leakage': return 'Revenue Leakage Detector';
      case '/simulator': return 'Billing Simulator & Prorations';
      case '/recovery': return 'Subscription Recovery Center';
      case '/csv-import': return 'CSV Data Import Wizard';
      case '/ai-assistant': return 'SubFlow AI Finance Assistant';
      case '/audit': return 'Audit Logs & Governance';
      default: return 'SubFlow';
    }
  };

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleRunBilling = async () => {
    setBillingRunning(true);
    try {
      const res = await apiRequest('/api/billing/run', { method: 'POST' });
      if (res.success) {
        setBillingResult(res.data);
        setShowResultModal(true);
      } else {
        alert(res.message || 'Billing run failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error executing billing');
    } finally {
      setBillingRunning(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-20 h-16 bg-white dark:bg-[#18181B] border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between px-6 transition-all duration-300 ${
          collapsed ? 'left-16' : 'left-64'
        }`}
      >
        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#737373] dark:text-[#A1A1AA]">
            SubFlow /
          </span>
          <h1 className="text-base font-bold text-[#252525] dark:text-white font-heading">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Global search input */}
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={15} />
            <input
              type="text"
              placeholder="Search customers, invoices..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F8] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67] dark:text-white"
            />
          </div>

          {/* Trigger Scheduled Billing Engine Manually */}
          <button
            onClick={handleRunBilling}
            disabled={billingRunning}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white shadow-sm transition-all disabled:opacity-50"
            title="Execute Recurring Billing Engine"
          >
            {billingRunning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Running Billing...</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>Run Billing Now</span>
              </>
            )}
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-[#737373] dark:text-[#A1A1AA] hover:text-[#252525] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-[#737373] dark:text-[#A1A1AA] hover:text-[#252525] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#18181B]" />
          </button>

          {/* User profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB] dark:border-[#27272A]">
            <div className="h-8 w-8 rounded-full bg-[#714B67] flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-[#252525] dark:text-white leading-tight">
                {user?.name || 'Administrator'}
              </span>
              <span className="block text-[10px] text-[#737373] dark:text-[#A1A1AA] uppercase font-semibold">
                {user?.role || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Billing Result Modal */}
      {showResultModal && billingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-lg shadow-xl max-w-lg w-full border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Billing Execution Report
                </h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-[#737373] hover:text-[#252525] dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-[#F7F7F8] dark:bg-[#27272A]">
                  <span className="text-[11px] text-[#737373] uppercase font-semibold">Invoices Generated</span>
                  <p className="text-xl font-bold font-heading text-[#714B67] dark:text-purple-300">
                    {billingResult.invoicesGenerated}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-[#F7F7F8] dark:bg-[#27272A]">
                  <span className="text-[11px] text-[#737373] uppercase font-semibold">Total Amount Billed</span>
                  <p className="text-xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
                    ₹{billingResult.totalAmountBilled}
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#737373] dark:text-[#A1A1AA] space-y-1">
                <p>Status: <span className="font-semibold text-emerald-600">{billingResult.status}</span></p>
                <p>Execution Time: <span className="font-semibold">{billingResult.durationMs}ms</span></p>
                <p>Subscriptions Inspected: <span className="font-semibold">{billingResult.subscriptionsProcessed}</span></p>
              </div>

              {billingResult.generatedInvoices?.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-[#252525] dark:text-white block mb-1">
                    Generated Invoices:
                  </span>
                  <div className="max-h-36 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#27272A] border border-[#E5E7EB] dark:border-[#27272A] rounded-md text-xs">
                    {billingResult.generatedInvoices.map((inv: any) => (
                      <div key={inv.invoiceId} className="flex justify-between items-center p-2">
                        <div>
                          <span className="font-bold text-[#714B67] dark:text-purple-300">{inv.invoiceNumber}</span>
                          <span className="text-[#737373] ml-2">({inv.customer})</span>
                        </div>
                        <span className="font-semibold text-emerald-600">₹{inv.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E5E7EB] dark:border-[#27272A]">
              <button
                onClick={() => {
                  setShowResultModal(false);
                  window.location.reload();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-[#714B67] hover:bg-[#55364E] text-white"
              >
                Done & Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
