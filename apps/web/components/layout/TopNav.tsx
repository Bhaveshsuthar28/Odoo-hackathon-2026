'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import {
  Menu,
  Search,
  Bell,
  Play,
  Sun,
  Moon,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface TopNavProps {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

export function TopNav({ collapsed, mobileOpen, setMobileOpen }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [billingRunning, setBillingRunning] = useState(false);
  const [billingResult, setBillingResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const getPageInfo = () => {
    switch (pathname) {
      case '/': return { title: 'Executive Financial Dashboard', app: 'Accounting & Subscriptions' };
      case '/admin/dashboard': return { title: 'Administrator Command Center', app: 'Executive & Governance' };
      case '/staff/dashboard': return { title: 'Staff Operational Workspace', app: 'Operations & Fulfillment' };
      case '/customer/dashboard': return { title: 'Customer Self-Service Portal', app: 'Subscriber Center' };
      case '/customers': return { title: 'Customer Directory', app: 'Sales & CRM' };
      case '/products': return { title: 'Products & Variants', app: 'Inventory & Catalog' };
      case '/plans': return { title: 'Subscription Plans', app: 'Recurring Billing' };
      case '/quotations': return { title: 'Quotations & Proposals', app: 'Sales Orders' };
      case '/subscriptions': return { title: 'Subscriptions Lifecycle', app: 'Recurring Billing' };
      case '/invoices': return { title: 'Invoices & Billing', app: 'Invoicing & Ledger' };
      case '/payments': return { title: 'Payments & Reconciliation', app: 'Bank & Cash' };
      case '/discounts': return { title: 'Discount Rules & Coupons', app: 'Pricing Engine' };
      case '/leakage': return { title: 'Revenue Leakage Detector', app: 'Financial AI' };
      case '/simulator': return { title: 'Billing Simulator & Prorations', app: 'Proration Engine' };
      case '/recovery': return { title: 'Subscription Recovery Center', app: 'Automated Dunning' };
      case '/csv-import': return { title: 'CSV Data Import Wizard', app: 'Data Migration' };
      case '/ai-assistant': return { title: 'AI Finance Assistant', app: 'SubFlow Copilot' };
      case '/audit': return { title: 'Audit Logs & Governance', app: 'Security & Compliance' };
      default: return { title: 'SubFlow Enterprise', app: 'Platform' };
    }
  };

  const pageInfo = getPageInfo();

  useEffect(() => {
    const saved = localStorage.getItem('subflow_theme');
    if (saved === 'dark' || (!saved && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('subflow_theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('subflow_theme', 'dark');
      setIsDark(true);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;

    if (q.toUpperCase().startsWith('INV-')) {
      router.push(`/invoices?search=${encodeURIComponent(q)}`);
    } else if (q.toUpperCase().startsWith('SUB-')) {
      router.push(`/subscriptions?search=${encodeURIComponent(q)}`);
    } else if (q.toUpperCase().startsWith('QUO-')) {
      router.push(`/quotations?search=${encodeURIComponent(q)}`);
    } else if (pathname.includes('/invoices')) {
      router.push(`/invoices?search=${encodeURIComponent(q)}`);
    } else if (pathname.includes('/subscriptions')) {
      router.push(`/subscriptions?search=${encodeURIComponent(q)}`);
    } else if (pathname.includes('/products')) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/customers?search=${encodeURIComponent(q)}`);
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
        className={`fixed top-0 right-0 z-20 h-16 bg-white dark:bg-[#18181B] border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between px-4 sm:px-6 transition-all duration-300 ease-in-out left-0 ${
          collapsed ? 'md:left-[72px]' : 'md:left-64'
        }`}
      >
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-[#737373] hover:text-[#252525] hover:bg-black/5"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#714B67] dark:text-purple-300">
              {pageInfo.app}
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-[#252525] dark:text-white font-heading leading-tight truncate max-w-[180px] sm:max-w-xs md:max-w-none">
              {pageInfo.title}
            </h1>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global search */}
          <form onSubmit={handleGlobalSearch} className="relative hidden lg:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={14} />
            <input
              ref={searchInputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search records... (Ctrl+K)"
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-[#F8F9FA] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-md focus:outline-none focus:ring-1 focus:ring-[#714B67] dark:text-white transition-all shadow-inner"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={12} />
              </button>
            )}
          </form>

          {/* Trigger Scheduled Billing Engine Manually */}
          <button
            onClick={handleRunBilling}
            disabled={billingRunning}
            className="btn-odoo-primary text-xs py-1.5 px-3 disabled:opacity-50"
            title="Execute Recurring Billing Engine"
          >
            {billingRunning ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span className="hidden sm:inline">Billing...</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span className="hidden sm:inline">Run Billing</span>
              </>
            )}
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-[#737373] dark:text-[#A1A1AA] hover:text-[#252525] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-[#737373] dark:text-[#A1A1AA] hover:text-[#252525] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#18181B]" />
          </button>

          {/* User profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB] dark:border-[#27272A]">
            <div className="h-8 w-8 rounded-full bg-[#714B67] flex items-center justify-center text-xs font-bold text-white shadow-sm border border-purple-300/30">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
            <div className="hidden xl:block text-left">
              <span className="block text-xs font-bold text-[#252525] dark:text-white leading-tight">
                {user?.name || 'Administrator'}
              </span>
              <span className="block text-[10px] text-[#737373] dark:text-[#A1A1AA] uppercase font-bold tracking-wider">
                {user?.role || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Billing Result Modal */}
      {showResultModal && billingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18181B] rounded-xl shadow-2xl max-w-lg w-full border border-[#E5E7EB] dark:border-[#27272A] p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={22} />
                <h3 className="font-heading font-bold text-base text-[#252525] dark:text-white">
                  Recurring Billing Engine Executed
                </h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-[#737373] hover:text-[#252525] dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#F8F9FA] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46]">
                  <span className="text-[10px] text-[#737373] uppercase font-bold tracking-wider">Invoices Generated</span>
                  <p className="text-2xl font-extrabold font-heading text-[#714B67] dark:text-purple-300 mt-0.5">
                    {billingResult.invoicesGenerated}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F8F9FA] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46]">
                  <span className="text-[10px] text-[#737373] uppercase font-bold tracking-wider">Total Amount Billed</span>
                  <p className="text-2xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{billingResult.totalAmountBilled}
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#737373] dark:text-[#A1A1AA] space-y-1 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-md">
                <p>Status: <span className="font-bold text-emerald-600">{billingResult.status}</span></p>
                <p>Execution Latency: <span className="font-semibold">{billingResult.durationMs}ms</span></p>
                <p>Subscriptions Due Inspected: <span className="font-semibold">{billingResult.subscriptionsProcessed}</span></p>
              </div>

              {billingResult.generatedInvoices?.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-[#252525] dark:text-white block mb-1.5">
                    Generated Tax Invoices:
                  </span>
                  <div className="max-h-40 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#27272A] border border-[#E5E7EB] dark:border-[#27272A] rounded-lg text-xs">
                    {billingResult.generatedInvoices.map((inv: any) => (
                      <div key={inv.invoiceId} className="flex justify-between items-center p-2.5">
                        <div>
                          <span className="font-bold text-[#714B67] dark:text-purple-300">{inv.invoiceNumber}</span>
                          <span className="text-[#737373] ml-2 font-medium">({inv.customer})</span>
                        </div>
                        <span className="font-bold text-emerald-600">₹{inv.amount}</span>
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
                className="btn-odoo-primary"
              >
                Acknowledge & Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
