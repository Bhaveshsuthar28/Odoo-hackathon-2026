'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Repeat,
  Receipt,
  CreditCard,
  User,
  ShieldCheck,
  Lock,
  Wallet,
  Sparkles,
  ShoppingBag,
  Download,
  Pause,
  Play,
  Ban,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Server,
  Zap,
  Cpu,
  Plus,
  RefreshCw,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  Building,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
} from 'lucide-react';

type SidebarTab =
  | 'subscriptions'
  | 'invoices'
  | 'payments'
  | 'security'
  | 'catalog'
  | 'wallet';

export default function CustomerDashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation state
  const [activeTab, setActiveTab] = useState<SidebarTab>('subscriptions');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [customer, setCustomer] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [catalogPlans, setCatalogPlans] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Form States
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Money Cart Top-up States
  const [topupAmount, setTopupAmount] = useState<number>(1000);
  const [topupMethod, setTopupMethod] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('UPI');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMsg, setTopupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extra Usage / Server Load State
  const [usageAmount, setUsageAmount] = useState<number>(350);
  const [usageReason, setUsageReason] = useState<string>('High Compute Burst (100k requests / 4 vCPU spike)');
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageMsg, setUsageMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pay Invoice Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [invoicePayMethod, setInvoicePayMethod] = useState<'WALLET' | 'CARD' | 'UPI'>('WALLET');
  const [payingInvoice, setPayingInvoice] = useState(false);
  const [invoicePayError, setInvoicePayError] = useState<string | null>(null);

  // Service Activation Modal States
  const [activatingItem, setActivatingItem] = useState<{ type: 'PLAN' | 'PRODUCT'; item: any } | null>(null);
  const [activationPaymentMethod, setActivationPaymentMethod] = useState<'WALLET' | 'CARD' | 'UPI'>('WALLET');
  const [activating, setActivating] = useState(false);
  const [activationMsg, setActivationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cancel Subscription Modal States
  const [cancelSub, setCancelSub] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingSub, setCancellingSub] = useState(false);

  // Filters & Search
  const [invoiceFilter, setInvoiceFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Role Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/customer/login');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'STAFF') {
        router.push('/staff/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Load all customer portal data
  async function loadCustomerData() {
    setLoading(true);
    try {
      const [cRes, sRes, iRes, pRes, wRes, catRes] = await Promise.all([
        apiRequest('/api/portal/me'),
        apiRequest('/api/portal/subscriptions'),
        apiRequest('/api/portal/invoices'),
        apiRequest('/api/portal/payments'),
        apiRequest('/api/portal/wallet'),
        apiRequest('/api/portal/catalog'),
      ]);

      if (cRes.success && cRes.data?.customer) {
        const cust = cRes.data.customer;
        setCustomer(cust);
        setPhone(cust.phone || '');
        setAddressLine1(cust.addressLine1 || '');
        setAddressLine2(cust.addressLine2 || '');
        setCity(cust.city || '');
        setStateName(cust.state || '');
        setPostalCode(cust.postalCode || '');
        setCountry(cust.country || 'India');
      }

      if (sRes.success && sRes.data) setSubscriptions(sRes.data.subscriptions || []);
      if (iRes.success && iRes.data) setInvoices(iRes.data.invoices || []);
      if (pRes.success && pRes.data) setPayments(pRes.data.payments || []);
      if (wRes.success && wRes.data) {
        setWalletBalance(Number(wRes.data.walletBalance) || 0);
        setWalletTransactions(wRes.data.transactions || []);
      }
      if (catRes.success && catRes.data) {
        setCatalogPlans(catRes.data.plans || []);
        setCatalogProducts(catRes.data.products || []);
      }
    } catch (e) {
      console.error('Failed to load customer portal data', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      loadCustomerData();
    }
  }, [user?.id, user?.role]);

  // Handle Pause Subscription
  const handlePause = async (subId: string) => {
    if (!confirm('Are you sure you want to pause this recurring subscription?')) return;
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${subId}/pause`, { method: 'POST' });
      if (res.success) {
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Resume Subscription
  const handleResume = async (subId: string) => {
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${subId}/resume`, { method: 'POST' });
      if (res.success) {
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Cancel Subscription Request
  const handleRequestCancel = async () => {
    if (!cancelSub) return;
    setCancellingSub(true);
    try {
      const res = await apiRequest(`/api/portal/subscriptions/${cancelSub.id}/request-cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason || 'Customer self-service request' }),
      });
      if (res.success) {
        setCancelSub(null);
        setCancelReason('');
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingSub(false);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await apiRequest('/api/portal/me', {
        method: 'PUT',
        body: JSON.stringify({
          phone,
          addressLine1,
          addressLine2,
          city,
          state: stateName,
          postalCode,
          country,
        }),
      });
      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Billing profile updated successfully.' });
        loadCustomerData();
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Failed to update contact info.' });
      }
    } catch (e: any) {
      setProfileMsg({ type: 'error', text: e.message || 'Failed to update details.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiRequest('/api/portal/security/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.success) {
        setSecurityMsg({ type: 'success', text: 'Password has been updated securely!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecurityMsg({ type: 'error', text: res.message || 'Failed to update password.' });
      }
    } catch (e: any) {
      setSecurityMsg({ type: 'error', text: e.message || 'Error updating password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Money Cart Top-up
  const handleTopup = async () => {
    if (topupAmount <= 0) return;
    setTopupLoading(true);
    setTopupMsg(null);
    try {
      const res = await apiRequest('/api/portal/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({
          amount: topupAmount,
          paymentMethod: topupMethod,
        }),
      });
      if (res.success) {
        setTopupMsg({ type: 'success', text: `Successfully loaded ₹${topupAmount} to your Money Cart!` });
        loadCustomerData();
      } else {
        setTopupMsg({ type: 'error', text: res.message || 'Top-up failed.' });
      }
    } catch (e: any) {
      setTopupMsg({ type: 'error', text: e.message || 'Failed to process top-up.' });
    } finally {
      setTopupLoading(false);
    }
  };

  // Handle Extra Usage / Server Load charge
  const handleChargeUsage = async () => {
    if (usageAmount <= 0) return;
    setUsageLoading(true);
    setUsageMsg(null);
    try {
      const res = await apiRequest('/api/portal/wallet/charge-usage', {
        method: 'POST',
        body: JSON.stringify({
          amount: usageAmount,
          reason: usageReason,
        }),
      });
      if (res.success) {
        setUsageMsg({ type: 'success', text: `Deducted ₹${usageAmount} from Money Cart for ${usageReason}.` });
        loadCustomerData();
      } else {
        setUsageMsg({ type: 'error', text: res.message || 'Deduction failed.' });
      }
    } catch (e: any) {
      setUsageMsg({ type: 'error', text: e.message || 'Failed to process usage charge.' });
    } finally {
      setUsageLoading(false);
    }
  };

  // Handle Pay Invoice (Supports Money Cart or Card/UPI)
  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    setPayingInvoice(true);
    setInvoicePayError(null);
    try {
      const res = await apiRequest('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: Number(selectedInvoice.outstandingAmount),
          paymentMethod: invoicePayMethod,
          note: invoicePayMethod === 'WALLET' ? 'Paid with Money Cart Balance' : 'Customer Portal direct payment',
        }),
      });
      if (res.success) {
        setSelectedInvoice(null);
        loadCustomerData();
      } else {
        setInvoicePayError(res.message || 'Payment failed.');
      }
    } catch (e: any) {
      setInvoicePayError(e.message || 'Failed to execute payment.');
    } finally {
      setPayingInvoice(false);
    }
  };

  // Handle Service Activation from Catalog
  const handleActivateService = async () => {
    if (!activatingItem) return;
    setActivating(true);
    setActivationMsg(null);
    try {
      const payload: any = {
        paymentMethod: activationPaymentMethod,
      };

      if (activatingItem.type === 'PLAN') {
        payload.planId = activatingItem.item.id;
        payload.billingInterval = activatingItem.item.billingInterval;
      } else {
        payload.productId = activatingItem.item.id;
      }

      const res = await apiRequest('/api/portal/activate-service', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setActivationMsg({ type: 'success', text: res.message || 'Service activated successfully!' });
        setTimeout(() => {
          setActivatingItem(null);
          setActiveTab('subscriptions');
          loadCustomerData();
        }, 1500);
      } else {
        setActivationMsg({ type: 'error', text: res.message || 'Failed to activate service.' });
      }
    } catch (e: any) {
      setActivationMsg({ type: 'error', text: e.message || 'Error activating service.' });
    } finally {
      setActivating(false);
    }
  };

  // Metrics
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
  const outstandingTotal = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.outstandingAmount) || 0), 0);
  const totalPaidInvoices = invoices.filter((i) => i.status === 'PAID').length;

  // Filtered Invoices
  const displayedInvoices = invoices.filter((inv) => {
    if (invoiceFilter === 'UNPAID') return inv.status !== 'PAID' && inv.status !== 'CANCELLED';
    if (invoiceFilter === 'PAID') return inv.status === 'PAID';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121214] flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-white dark:bg-[#1C1C1F] border-b border-[#E5E7EB] dark:border-[#2E2E32] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg">
            S
          </div>
          <div>
            <span className="font-extrabold text-sm text-[#252525] dark:text-white">SubFlow</span>
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Customer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800"
          >
            <Wallet size={13} />
            <span>{formatCurrency(walletBalance)}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#2E2E32] text-[#555] dark:text-white"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Modern Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#18181B] border-r border-[#E5E7EB] dark:border-[#27272A] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex flex-col gap-6 overflow-y-auto">
          {/* Logo & Portal Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/20">
                S
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base tracking-tight text-[#18181B] dark:text-white">
                    SubFlow
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    Portal
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Subscriber Self-Service</p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#71717A] hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Money Cart Floating Mini-Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-800 via-teal-800 to-zinc-900 text-white shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-emerald-200 mb-1 font-medium">
              <div className="flex items-center gap-1.5">
                <Wallet size={14} className="text-emerald-300" />
                <span>Money Cart</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Active
              </span>
            </div>
            <div className="text-2xl font-black font-heading tracking-tight mt-0.5">
              {formatCurrency(walletBalance)}
            </div>
            <p className="text-[11px] text-emerald-100/80 mt-1">Pre-paid credits for services & compute</p>
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveTab('wallet');
                  setMobileMenuOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
              >
                <Plus size={13} />
                <span>Add Money to Cart</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] dark:text-[#71717A] px-3 mb-2">
              Subscriber Menu
            </div>

            {/* 1. My Subscriptions */}
            <button
              onClick={() => {
                setActiveTab('subscriptions');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#52525B] dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Repeat size={17} />
                <span>1. My Subscriptions</span>
              </div>
              {activeSubs > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'subscriptions'
                      ? 'bg-emerald-800 text-emerald-100'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {activeSubs}
                </span>
              )}
            </button>

            {/* 2. Invoices & Receipts */}
            <button
              onClick={() => {
                setActiveTab('invoices');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'invoices'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#52525B] dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt size={17} />
                <span>2. Invoices & Receipts</span>
              </div>
              {unpaidInvoices.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'invoices' ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {unpaidInvoices.length} due
                </span>
              )}
            </button>

            {/* 3. Payment Records */}
            <button
              onClick={() => {
                setActiveTab('payments');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#52525B] dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard size={17} />
                <span>3. Payment Records</span>
              </div>
            </button>

            {/* 4. Account & Security */}
            <button
              onClick={() => {
                setActiveTab('security');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#52525B] dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={17} />
                <span>4. Account & Security</span>
              </div>
            </button>

            <div className="pt-4 text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] dark:text-[#71717A] px-3 mb-2">
              Services & Wallet
            </div>

            {/* 5. Explore Plans & Products (Marketplace) */}
            <button
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#52525B] dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={17} className="text-amber-500" />
                <span>5. Explore Plans & Products</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                Shop
              </span>
            </button>

            {/* 6. Money Cart (Wallet & Server Load) */}
            <button
              onClick={() => {
                setActiveTab('wallet');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'wallet'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#52525B] dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet size={17} />
                <span>6. Money Cart & Usage</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(walletBalance)}
              </span>
            </button>
          </nav>
        </div>

        {/* User Account Details & Logout Footer */}
        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#27272A] bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#18181B] dark:text-white truncate">{user?.name || 'Customer'}</p>
                <p className="text-[10px] text-[#71717A] truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header Summary */}
        <div className="bg-white dark:bg-[#18181B] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#27272A] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck size={15} />
              <span>Verified Customer Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-[#18181B] dark:text-white">
              {activeTab === 'subscriptions' && 'My Recurring Subscriptions'}
              {activeTab === 'invoices' && 'Invoices & Tax Receipts'}
              {activeTab === 'payments' && 'Payment & Transaction Records'}
              {activeTab === 'security' && 'Account & Security Preferences'}
              {activeTab === 'catalog' && 'Explore Plans & Products Marketplace'}
              {activeTab === 'wallet' && 'Money Cart: Credits & Server Usage'}
            </h1>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              {customer?.company ? `${customer.company} • ` : ''}
              Customer ID: {customer?.customerNumber || 'Verified Subscriber'}
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-right">
              <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                Money Cart Balance
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">
                {formatCurrency(walletBalance)}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('wallet')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Plus size={14} />
              <span>Add Money</span>
            </button>

            <button
              onClick={() => loadCustomerData()}
              className="p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* TAB 1: MY SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#71717A] mb-1 font-medium">
                  <span>Active Subscriptions</span>
                  <Repeat size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-heading text-[#18181B] dark:text-white">{activeSubs}</div>
                <div className="text-[11px] text-[#71717A] mt-1">Automatic recurring billing active</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#71717A] mb-1 font-medium">
                  <span>Paused Subscriptions</span>
                  <Pause size={16} className="text-amber-500" />
                </div>
                <div className="text-2xl font-bold font-heading text-[#18181B] dark:text-white">
                  {subscriptions.filter((s) => s.status === 'PAUSED').length}
                </div>
                <div className="text-[11px] text-[#71717A] mt-1">Can be resumed anytime</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#71717A] mb-1 font-medium">
                  <span>Explore More Services</span>
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Browse catalog</span>
                  <ChevronRight size={14} />
                </button>
                <div className="text-[11px] text-[#71717A] mt-1">Activate products directly</div>
              </div>
            </div>

            {/* Subscriptions List */}
            {subscriptions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A]">
                <Repeat size={44} className="mx-auto text-[#A1A1AA] mb-3" />
                <h3 className="text-base font-bold text-[#18181B] dark:text-white">No Active Subscriptions Yet</h3>
                <p className="text-xs text-[#71717A] mt-1 max-w-md mx-auto">
                  You do not have any active subscriptions. Visit our catalog to choose a plan and activate it instantly using your Money Cart or card.
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <Sparkles size={14} />
                  <span>Explore Available Plans</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider">
                          {sub.billingInterval} Plan
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>

                      <h3 className="text-xl font-bold font-heading text-[#18181B] dark:text-white">
                        {sub.plan?.name || 'Custom Plan'}
                      </h3>
                      <p className="text-xs text-[#71717A] mt-0.5">
                        {sub.lines?.[0]?.product?.name || 'Recurring Service Package'}
                      </p>

                      <div className="mt-4 pt-4 border-t border-[#F4F4F5] dark:border-[#27272A] grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-[11px] text-[#A1A1AA]">Price / Cycle</div>
                          <div className="font-bold text-[#18181B] dark:text-white text-sm">
                            {formatCurrency(sub.plan?.price || 0)} / {sub.billingInterval?.toLowerCase()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#A1A1AA]">Next Billing</div>
                          <div className="font-bold text-[#18181B] dark:text-white text-sm">
                            {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : 'Not Scheduled'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#A1A1AA]">Current Period</div>
                          <div className="font-medium text-[#71717A]">
                            {formatDate(sub.startDate)} - {formatDate(sub.nextBillingDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#A1A1AA]">Auto-Renew</div>
                          <div className="font-medium text-emerald-600 flex items-center gap-1">
                            {sub.autoRenew ? (
                              <>
                                <CheckCircle2 size={13} /> Enabled
                              </>
                            ) : (
                              <span className="text-rose-500">Cancelling at period end</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#F4F4F5] dark:border-[#27272A] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {sub.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handlePause(sub.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
                          >
                            <Pause size={13} />
                            <span>Pause</span>
                          </button>
                        ) : sub.status === 'PAUSED' ? (
                          <button
                            onClick={() => handleResume(sub.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                          >
                            <Play size={13} />
                            <span>Resume</span>
                          </button>
                        ) : null}

                        {sub.autoRenew && sub.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setCancelSub(sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          >
                            <Ban size={13} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveTab('invoices')}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Invoices</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVOICES & RECEIPTS */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#71717A] mb-1 font-medium">
                  <span>Settled Invoices</span>
                  <Receipt size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-heading text-[#18181B] dark:text-white">
                  {totalPaidInvoices}
                </div>
                <div className="text-[11px] text-[#71717A] mt-1">Paid in full with official receipts</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#71717A] mb-1 font-medium">
                  <span>Pending Outstanding</span>
                  <CreditCard size={16} className="text-rose-600" />
                </div>
                <div className="text-2xl font-bold font-heading text-[#18181B] dark:text-white">
                  {formatCurrency(outstandingTotal)}
                </div>
                <div className="text-[11px] text-[#71717A] mt-1">{unpaidInvoices.length} invoices awaiting payment</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#71717A] mb-1 font-medium">
                  <span>Money Cart Option</span>
                  <Wallet size={16} className="text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  1-Click Instant Settlement
                </div>
                <div className="text-[11px] text-[#71717A] mt-1">Pay invoices directly with Money Cart balance</div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <button
                  onClick={() => setInvoiceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    invoiceFilter === 'ALL'
                      ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-white shadow-sm'
                      : 'text-[#71717A]'
                  }`}
                >
                  All Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => setInvoiceFilter('UNPAID')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    invoiceFilter === 'UNPAID'
                      ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-white shadow-sm'
                      : 'text-[#71717A]'
                  }`}
                >
                  Unpaid ({unpaidInvoices.length})
                </button>
                <button
                  onClick={() => setInvoiceFilter('PAID')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    invoiceFilter === 'PAID'
                      ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-white shadow-sm'
                      : 'text-[#71717A]'
                  }`}
                >
                  Paid ({totalPaidInvoices})
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E5E7EB] dark:border-[#27272A] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] dark:bg-zinc-900/60 border-b border-[#E5E7EB] dark:border-[#27272A] text-[#71717A]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Invoice #</th>
                      <th className="py-3 px-4 font-bold">Issue Date</th>
                      <th className="py-3 px-4 font-bold">Due Date</th>
                      <th className="py-3 px-4 font-bold">Total</th>
                      <th className="py-3 px-4 font-bold">Amount Due</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
                    {displayedInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#71717A]">
                          No invoices found for this selection.
                        </td>
                      </tr>
                    ) : (
                      displayedInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold font-mono text-[#18181B] dark:text-white">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4 text-[#71717A]">{formatDate(inv.invoiceDate)}</td>
                          <td className="py-3.5 px-4 text-[#71717A]">{formatDate(inv.dueDate)}</td>
                          <td className="py-3.5 px-4 font-bold text-[#18181B] dark:text-white">
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {Number(inv.outstandingAmount) > 0 ? (
                              <span className="text-rose-600">{formatCurrency(inv.outstandingAmount)}</span>
                            ) : (
                              <span className="text-emerald-600">₹0.00</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => setSelectedInvoice(inv)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                                >
                                  <CreditCard size={12} />
                                  <span>Pay Now</span>
                                </button>
                              )}
                              <a
                                href={`/api/invoices/${inv.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#71717A] hover:text-[#18181B] dark:hover:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <Download size={12} />
                                <span>PDF</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT RECORDS */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B] dark:text-white">Settlement History</h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Complete ledger of payments settled via Money Cart, UPI, Credit Card, and Net Banking
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#A1A1AA]">Total Recorded</div>
                <div className="text-xl font-bold font-heading text-[#18181B] dark:text-white">{payments.length}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E5E7EB] dark:border-[#27272A] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] dark:bg-zinc-900/60 border-b border-[#E5E7EB] dark:border-[#27272A] text-[#71717A]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Payment #</th>
                      <th className="py-3 px-4 font-bold">Date & Time</th>
                      <th className="py-3 px-4 font-bold">Method</th>
                      <th className="py-3 px-4 font-bold">Amount</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Reference</th>
                      <th className="py-3 px-4 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#71717A]">
                          No payment records found.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold font-mono text-[#18181B] dark:text-white">
                            {p.paymentNumber}
                          </td>
                          <td className="py-3.5 px-4 text-[#71717A]">{formatDate(p.paymentDate)}</td>
                          <td className="py-3.5 px-4">
                            {p.paymentMethod === 'WALLET' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                                <Wallet size={11} /> Money Cart
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold text-[10px]">
                                <CreditCard size={11} /> {p.paymentMethod}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#18181B] dark:text-white">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#71717A] text-[11px]">{p.reference || '-'}</td>
                          <td className="py-3.5 px-4 text-[#71717A] max-w-xs truncate">{p.note || 'Service invoice settlement'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT & SECURITY */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact & Billing Information */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                  <User size={18} className="text-emerald-600" />
                  <span>Customer & Billing Profile</span>
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Update your contact details and billing address shown on tax invoices.
                </p>
              </div>

              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#71717A] mb-1">Subscriber Name</label>
                  <input
                    type="text"
                    disabled
                    value={customer?.name || user?.name || ''}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-[#E5E7EB] dark:border-[#27272A] text-[#71717A] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#71717A] mb-1">Verified Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-[#E5E7EB] dark:border-[#27272A] text-[#71717A] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#71717A] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#71717A] mb-1">Billing Address Line 1</label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Office / Street Address"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ahmedabad / Bengaluru"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] mb-1">State / Province</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="Gujarat"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="380015"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Save Contact Details</span>
                </button>
              </form>
            </div>

            {/* Password & Security Configuration */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                    <Lock size={18} className="text-emerald-600" />
                    <span>Change Account Password</span>
                  </h3>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Update your login credentials. Password must meet enterprise security standards.
                  </p>
                </div>

                {securityMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      securityMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                    }`}
                  >
                    {securityMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters with mix of cases"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#71717A] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Password requirements checklist */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-[#E5E7EB] dark:border-[#27272A] text-[11px] text-[#71717A] space-y-1">
                    <div className="font-bold text-[#18181B] dark:text-white mb-1">Security Checklist:</div>
                    <div className="flex items-center gap-1.5">
                      <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                        ✓ Minimum 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                        ✓ At least one uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                        ✓ At least one number
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {changingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    <span>Update Password</span>
                  </button>
                </form>
              </div>

              {/* Security badges card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm space-y-3">
                <div className="text-xs font-bold text-[#18181B] dark:text-white">Active Security Guardrails</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
                    <div className="font-bold">✓ 256-Bit SSL/TLS</div>
                    <div className="text-[10px] text-emerald-600">Encrypted Transport</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
                    <div className="font-bold">✓ Verified Gmail</div>
                    <div className="text-[10px] text-emerald-600">OTP Account Protected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPLORE PLANS & PRODUCTS (MARKETPLACE) */}
        {activeTab === 'catalog' && (
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-200 text-[10px] font-bold mb-2">
                  <Sparkles size={12} /> Instant Service Activation
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
                  Available Plans & Product Catalog
                </h2>
                <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                  Choose from our high-performance SaaS subscription tiers or activate add-on compute and storage
                  services immediately using your preferred method or your Money Cart balance.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-right shrink-0">
                <div className="text-[11px] text-emerald-200">Your Money Cart</div>
                <div className="text-xl font-bold font-heading">{formatCurrency(walletBalance)}</div>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="mt-1 text-[11px] text-emerald-300 underline font-semibold hover:text-white"
                >
                  Top-up balance
                </button>
              </div>
            </div>

            {/* Subscription Plans Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#18181B] dark:text-white">Recurring Subscription Plans</h3>
                  <p className="text-xs text-[#71717A]">
                    Upgrade, switch, or add new subscription tiers with automatic renewal
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {catalogPlans.map((plan) => {
                  const isAlreadyActive = subscriptions.some(
                    (s) => s.planId === plan.id && s.status === 'ACTIVE'
                  );

                  return (
                    <div
                      key={plan.id}
                      className={`p-6 rounded-2xl bg-white dark:bg-[#18181B] border transition-all flex flex-col justify-between gap-5 ${
                        isAlreadyActive
                          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-[#E5E7EB] dark:border-[#27272A] hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            {plan.billingInterval}
                          </span>
                          {isAlreadyActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 size={11} /> Current Plan
                            </span>
                          )}
                        </div>

                        <h4 className="text-lg font-bold font-heading text-[#18181B] dark:text-white">{plan.name}</h4>
                        <p className="text-xs text-[#71717A] mt-1">{plan.product?.name || 'Full SaaS Suite'}</p>

                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-2xl font-black font-heading text-[#18181B] dark:text-white">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-xs text-[#71717A]">/{plan.billingInterval?.toLowerCase()}</span>
                        </div>

                        {/* Features bullet list */}
                        <div className="mt-4 pt-4 border-t border-[#F4F4F5] dark:border-[#27272A] space-y-2 text-xs text-[#52525B] dark:text-[#A1A1AA]">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>Unlimited billing simulator access</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>Automated tax invoice generation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>Money Cart 1-click auto renewals</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>Priority 24/7 SLA subscriber support</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActivatingItem({ type: 'PLAN', item: plan })}
                        disabled={isAlreadyActive}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 ${
                          isAlreadyActive
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-[#71717A] cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isAlreadyActive ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Activate Plan</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standalone Products & Add-ons Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#18181B] dark:text-white">Products & Add-on Services</h3>
                  <p className="text-xs text-[#71717A]">
                    Activate on-demand services, dedicated compute boosts, or extra storage modules
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {catalogProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] hover:border-emerald-300 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                          {prod.type || 'SERVICE'}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          {formatCurrency(prod.basePrice || 0)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold font-heading text-[#18181B] dark:text-white">{prod.name}</h4>
                      <p className="text-xs text-[#71717A] mt-1 line-clamp-2">
                        {prod.description || 'Enterprise cloud service module ready for instant deployment.'}
                      </p>

                      {prod.variants && prod.variants.length > 0 && (
                        <div className="mt-3 text-[11px] text-[#71717A]">
                          <span className="font-bold">{prod.variants.length} tiers available</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActivatingItem({ type: 'PRODUCT', item: prod })}
                      className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={14} />
                      <span>Activate Service</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MONEY CART (WALLET & EXTRA USAGE) */}
        {activeTab === 'wallet' && (
          <div className="space-y-8">
            {/* Hero Money Cart Banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-zinc-900 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-bold text-emerald-200 mb-3">
                  <Wallet size={14} className="text-emerald-300" />
                  <span>SubFlow Pre-paid Money Cart</span>
                </div>
                <div className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Available Balance</div>
                <div className="text-4xl sm:text-5xl font-black font-heading tracking-tight mt-1">
                  {formatCurrency(walletBalance)}
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-2">
                  Your Money Cart enables zero-latency service activations, frictionless invoice auto-clearing, and
                  covers extra on-demand server compute spikes without service downtime.
                </p>
              </div>

              {/* Quick Top-up widget */}
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[320px] space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center justify-between">
                  <span>Quick Add Money</span>
                  <Plus size={14} />
                </div>

                {topupMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold ${
                      topupMsg.type === 'success' ? 'bg-emerald-500/30 text-white' : 'bg-rose-500/30 text-white'
                    }`}
                  >
                    {topupMsg.text}
                  </div>
                )}

                {/* Preset Chips */}
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2500, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        topupAmount === amt
                          ? 'bg-white text-emerald-900 shadow'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      +₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div>
                  <label className="block text-[11px] text-emerald-200 font-semibold mb-1">Custom Amount (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/15 border border-white/25 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>

                {/* Method selector */}
                <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                  {(['UPI', 'CARD', 'NET_BANKING'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTopupMethod(m)}
                      className={`py-1.5 rounded-lg text-center transition-all ${
                        topupMethod === m ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleTopup}
                  disabled={topupLoading || topupAmount <= 0}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {topupLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Add ₹{topupAmount.toLocaleString()} to Cart</span>
                </button>
              </div>
            </div>

            {/* Extra Usage / Server Load Section */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                    <Server size={18} className="text-emerald-600" />
                    <span>On-Demand Extra Usage & Server Load</span>
                  </h3>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Your Money Cart balance can directly absorb compute surges, API overages, and heavy server workloads
                    on-the-fly.
                  </p>
                </div>
              </div>

              {usageMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    usageMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                  }`}
                >
                  {usageMsg.text}
                </div>
              )}

              {/* Preset Scenario Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => {
                    setUsageAmount(350);
                    setUsageReason('High Compute Burst (100k requests / 4 vCPU spike)');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    usageAmount === 350
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-[#E5E7EB] dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Cpu size={18} className="text-emerald-600" />
                    <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300">₹350</span>
                  </div>
                  <div className="font-bold text-xs text-[#18181B] dark:text-white">Compute Spike (4 vCPU)</div>
                  <div className="text-[11px] text-[#71717A] mt-1">100k extra dynamic API requests</div>
                </div>

                <div
                  onClick={() => {
                    setUsageAmount(250);
                    setUsageReason('Bandwidth & Data Egress Surge (50 GB)');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    usageAmount === 250
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-[#E5E7EB] dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap size={18} className="text-amber-500" />
                    <span className="font-bold text-xs text-amber-600">₹250</span>
                  </div>
                  <div className="font-bold text-xs text-[#18181B] dark:text-white">Bandwidth Surge (50 GB)</div>
                  <div className="text-[11px] text-[#71717A] mt-1">High-concurrency file transfers</div>
                </div>

                <div
                  onClick={() => {
                    setUsageAmount(500);
                    setUsageReason('AI Model Inference Quota (5,000 requests)');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    usageAmount === 500
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-[#E5E7EB] dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles size={18} className="text-purple-600" />
                    <span className="font-bold text-xs text-purple-600">₹500</span>
                  </div>
                  <div className="font-bold text-xs text-[#18181B] dark:text-white">AI Inference (5k Calls)</div>
                  <div className="text-[11px] text-[#71717A] mt-1">On-demand LLM token compute</div>
                </div>
              </div>

              {/* Custom Usage Deduction Controller */}
              <div className="pt-4 border-t border-[#F4F4F5] dark:border-[#27272A] flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] font-bold text-[#71717A] mb-1">Deduction Amount (₹)</label>
                  <input
                    type="number"
                    min="10"
                    value={usageAmount}
                    onChange={(e) => setUsageAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white font-bold text-xs"
                  />
                </div>
                <div className="w-full sm:w-2/3">
                  <label className="block text-[11px] font-bold text-[#71717A] mb-1">Workload / Spikes Reason</label>
                  <input
                    type="text"
                    value={usageReason}
                    onChange={(e) => setUsageReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-white text-xs"
                  />
                </div>
                <div className="w-full sm:w-auto sm:self-end">
                  <button
                    onClick={handleChargeUsage}
                    disabled={usageLoading || usageAmount <= 0}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {usageLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    <span>Charge to Cart</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Money Cart Transaction Ledger */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#18181B] dark:text-white">Money Cart Transaction Ledger</h3>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Real-time audit log of wallet top-ups, plan activations, and usage deductions
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] dark:bg-zinc-900/60 border-b border-[#E5E7EB] dark:border-[#27272A] text-[#71717A]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Description</th>
                      <th className="py-3 px-4 font-bold">Amount</th>
                      <th className="py-3 px-4 font-bold">Balance After</th>
                      <th className="py-3 px-4 font-bold">Date & Time</th>
                      <th className="py-3 px-4 font-bold">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
                    {walletTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#71717A]">
                          No cart transactions yet. Add money to get started!
                        </td>
                      </tr>
                    ) : (
                      walletTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            {tx.type === 'TOPUP' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                                <ArrowDownLeft size={11} /> TOP-UP
                              </span>
                            ) : tx.type === 'PURCHASE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px]">
                                <ArrowUpRight size={11} /> PURCHASE
                              </span>
                            ) : tx.type === 'INVOICE_PAYMENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                                <Receipt size={11} /> INVOICE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                                <Zap size={11} /> USAGE
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#18181B] dark:text-white max-w-sm truncate">
                            {tx.description}
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {tx.type === 'TOPUP' ? (
                              <span className="text-emerald-600">+{formatCurrency(tx.amount)}</span>
                            ) : (
                              <span className="text-rose-600">-{formatCurrency(tx.amount)}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#18181B] dark:text-white">
                            {formatCurrency(tx.balanceAfter)}
                          </td>
                          <td className="py-3.5 px-4 text-[#71717A]">{formatDate(tx.createdAt)}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#A1A1AA]">{tx.reference || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: PAY INVOICE (MONEY CART OR CARD/UPI) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] dark:border-[#27272A] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#18181B] dark:text-white">Pay Invoice</h3>
                <p className="text-xs text-[#71717A]">Invoice #{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-[#71717A] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {invoicePayError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold">
                {invoicePayError}
              </div>
            )}

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] space-y-2">
              <div className="flex justify-between text-xs text-[#71717A]">
                <span>Total Due:</span>
                <span className="font-bold text-base text-[#18181B] dark:text-white">
                  {formatCurrency(selectedInvoice.outstandingAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#71717A]">
                <span>Money Cart Balance:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(walletBalance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#71717A]">Select Payment Source</label>

              {/* Money Cart Option */}
              <div
                onClick={() => setInvoicePayMethod('WALLET')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  invoicePayMethod === 'WALLET'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[#E5E7EB] dark:border-[#27272A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#18181B] dark:text-white">Money Cart Balance</div>
                    <div className="text-[11px] text-[#71717A]">Instant 1-click settlement</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600">{formatCurrency(walletBalance)}</div>
                  {Number(selectedInvoice.outstandingAmount) > walletBalance && (
                    <span className="text-[10px] text-rose-600 font-bold">Insufficient</span>
                  )}
                </div>
              </div>

              {/* UPI Option */}
              <div
                onClick={() => setInvoicePayMethod('UPI')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  invoicePayMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[#E5E7EB] dark:border-[#27272A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#18181B] dark:text-white">UPI / QR Code</div>
                    <div className="text-[11px] text-[#71717A]">Google Pay, PhonePe, Paytm</div>
                  </div>
                </div>
              </div>

              {/* Card Option */}
              <div
                onClick={() => setInvoicePayMethod('CARD')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  invoicePayMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[#E5E7EB] dark:border-[#27272A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#18181B] dark:text-white">Credit / Debit Card</div>
                    <div className="text-[11px] text-[#71717A]">Visa, MasterCard, RuPay</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayInvoice}
              disabled={
                payingInvoice ||
                (invoicePayMethod === 'WALLET' && Number(selectedInvoice.outstandingAmount) > walletBalance)
              }
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {payingInvoice ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>
                Confirm & Pay {formatCurrency(selectedInvoice.outstandingAmount)} via{' '}
                {invoicePayMethod === 'WALLET' ? 'Money Cart' : invoicePayMethod}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: ACTIVATE SERVICE FROM CATALOG */}
      {activatingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] dark:border-[#27272A] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#18181B] dark:text-white">Activate Service</h3>
                <p className="text-xs text-[#71717A]">{activatingItem.item.name}</p>
              </div>
              <button
                onClick={() => setActivatingItem(null)}
                className="p-1 rounded-lg text-[#71717A] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {activationMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  activationMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {activationMsg.text}
              </div>
            )}

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] space-y-2">
              <div className="flex justify-between text-xs text-[#71717A]">
                <span>Item:</span>
                <span className="font-bold text-[#18181B] dark:text-white">{activatingItem.item.name}</span>
              </div>
              <div className="flex justify-between text-xs text-[#71717A]">
                <span>Activation Price:</span>
                <span className="font-bold text-base text-emerald-600">
                  {formatCurrency(activatingItem.item.price || activatingItem.item.basePrice || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#71717A]">
                <span>Money Cart Available:</span>
                <span className="font-bold text-[#18181B] dark:text-white">{formatCurrency(walletBalance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#71717A]">Select Payment Method</label>

              {/* Wallet Option */}
              <div
                onClick={() => setActivationPaymentMethod('WALLET')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  activationPaymentMethod === 'WALLET'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[#E5E7EB] dark:border-[#27272A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#18181B] dark:text-white">Money Cart</div>
                    <div className="text-[11px] text-[#71717A]">Deduct directly from credits</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600">{formatCurrency(walletBalance)}</div>
                </div>
              </div>

              {/* UPI Option */}
              <div
                onClick={() => setActivationPaymentMethod('UPI')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  activationPaymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[#E5E7EB] dark:border-[#27272A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#18181B] dark:text-white">UPI / Instant Pay</div>
                  </div>
                </div>
              </div>

              {/* Card Option */}
              <div
                onClick={() => setActivationPaymentMethod('CARD')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  activationPaymentMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[#E5E7EB] dark:border-[#27272A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#18181B] dark:text-white">Credit / Debit Card</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleActivateService}
              disabled={activating}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {activating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>Confirm & Activate Service</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL SUBSCRIPTION REQUEST */}
      {cancelSub && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] dark:border-[#27272A] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-[#18181B] dark:text-white">
                Cancel Recurring Subscription
              </h3>
              <button
                onClick={() => setCancelSub(null)}
                className="p-1 rounded-lg text-[#71717A] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#71717A]">
              Are you sure you want to cancel auto-renewal for{' '}
              <strong className="text-[#18181B] dark:text-white">{cancelSub.plan?.name}</strong>? Your access will
              remain active until the end of your prepaid period.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-[#71717A] mb-1">Reason for Cancellation</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you are cancelling..."
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-[#27272A] text-xs text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelSub(null)}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-xs font-semibold text-[#71717A]"
              >
                Keep Active
              </button>
              <button
                onClick={handleRequestCancel}
                disabled={cancellingSub}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                {cancellingSub ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
