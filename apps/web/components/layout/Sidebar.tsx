'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  ShieldAlert,
  Calculator,
  RefreshCw,
  UploadCloud,
  Bot,
  History,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean | ((prev: boolean) => boolean)) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean | ((prev: boolean) => boolean)) => void;
}

/**
 * Enterprise SubFlow Brandmark SVG
 * Interlocking continuous recurring-flow loops with emerald revenue pulse
 */
function SubFlowLogoMark() {
  return (
    <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#855378] via-[#6B4260] to-[#45273E] shadow-md border border-purple-300/30 group-hover:border-purple-200/60 transition-all">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="sf-grad-1" x1="6" y1="5" x2="26" y2="31" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F5EDFF" />
            <stop offset="100%" stopColor="#D8B4FE" />
          </linearGradient>
          <linearGradient id="sf-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        {/* Dynamic S-Subscription Flow Curve */}
        <path
          d="M23 10.5C23 7.5 20.2 5.5 16 5.5C11.5 5.5 8.5 7.8 8.5 11.5C8.5 15.5 13.5 16.5 17.5 18C21.5 19.5 23.5 21.5 23.5 25C23.5 28.8 20 30.5 16 30.5C11.8 30.5 8.5 28.5 8.5 25"
          stroke="url(#sf-grad-1)"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        {/* Flow Accent Nodes */}
        <circle cx="23" cy="10.5" r="2.2" fill="url(#sf-emerald)" />
        <circle cx="8.5" cy="25" r="2.2" fill="url(#sf-grad-1)" />
      </svg>
    </div>
  );
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const dashboardHref = user?.role === 'STAFF' ? '/staff/dashboard' : '/admin/dashboard';

  const mainNav = [
    { name: 'Dashboard', href: dashboardHref, icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Plans', href: '/plans', icon: Layers },
    { name: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
    { name: 'Subscriptions', href: '/subscriptions', icon: Repeat },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Discounts', href: '/discounts', icon: Percent },
  ];

  const bonusNav =
    user?.role === 'ADMIN'
      ? [
          { name: 'Revenue Leakage', href: '/leakage', icon: ShieldAlert, badge: 'Smart' },
          { name: 'Billing Simulator', href: '/simulator', icon: Calculator },
          { name: 'Recovery Center', href: '/recovery', icon: RefreshCw },
          { name: 'CSV Import Wizard', href: '/csv-import', icon: UploadCloud },
          { name: 'AI Finance Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI' },
          { name: 'Audit Trail', href: '/audit', icon: History },
        ]
      : [
          { name: 'Billing Simulator', href: '/simulator', icon: Calculator },
          { name: 'Recovery Center', href: '/recovery', icon: RefreshCw },
          { name: 'CSV Import Wizard', href: '/csv-import', icon: UploadCloud },
          { name: 'AI Finance Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI' },
        ];

  const isCollapsedView = collapsed && !mobileOpen;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#55364E] text-white transition-all duration-300 ease-in-out border-r border-[#432A3E] shadow-2xl md:shadow-lg ${
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
      } ${collapsed ? 'md:w-[72px]' : 'md:w-64'}`}
    >
      {/* Rail Expand Button (Visible when collapsed on desktop) */}
      {isCollapsedView && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden md:flex absolute -right-3 top-5 z-50 h-6 w-6 rounded-full bg-[#714B67] hover:bg-[#855378] text-white border-2 border-[#55364E] shadow-md items-center justify-center transition-all hover:scale-110 cursor-pointer"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      )}

      {/* Brand Header — Exact 64px matching TopNav */}
      <div className="flex h-16 shrink-0 items-center justify-between px-3 border-b border-[#63405C] bg-[#4C3046]">
        <Link
          href={dashboardHref}
          className="group flex items-center gap-2.5 overflow-hidden"
          title="SubFlow Enterprise"
        >
          <SubFlowLogoMark />
          <div
            className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
              isCollapsedView ? 'w-0 opacity-0 pointer-events-none' : 'w-28 opacity-100'
            }`}
          >
            <span className="font-heading text-base font-bold tracking-tight text-white leading-tight truncate">
              SubFlow
            </span>
            <span className="text-[9px] uppercase tracking-widest text-purple-200/80 font-bold leading-tight truncate">
              Odoo Enterprise
            </span>
          </div>
        </Link>

        {/* Action Buttons: Desktop Collapse & Mobile Close */}
        <div className="flex items-center">
          {/* Mobile close drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close mobile navigation"
          >
            <X size={18} />
          </button>

          {/* Desktop collapse toggle (Visible when expanded) */}
          {!isCollapsedView && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-4">
        {/* Core Operations Section */}
        <div>
          <div
            className={`transition-all duration-300 ease-in-out ${
              isCollapsedView ? 'h-0 opacity-0 overflow-hidden my-0' : 'h-5 opacity-100 mb-1 px-2.5'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60 truncate">
              Core Operations
            </p>
          </div>

          <nav className="space-y-1">
            {mainNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={isCollapsedView ? item.name : undefined}
                  className={`group relative flex items-center h-10 rounded-xl text-xs font-semibold transition-all duration-150 select-none ${
                    active
                      ? 'bg-[#714B67] text-white shadow-sm'
                      : 'text-purple-100/75 hover:bg-white/10 hover:text-white'
                  } ${isCollapsedView ? 'justify-center px-0' : 'px-2 gap-2.5'}`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-300 rounded-r-full" />
                  )}

                  {/* Uniform Icon Container — Exactly 36x36 with 20px icon */}
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg">
                    <Icon
                      size={20}
                      className={`shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-purple-300/80 group-hover:text-white'
                      }`}
                    />
                  </div>

                  {/* Smooth Text Label */}
                  <div
                    className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
                      isCollapsedView ? 'w-0 opacity-0 pointer-events-none' : 'flex-1 opacity-100'
                    }`}
                  >
                    <span className="truncate whitespace-nowrap">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section Divider when Collapsed */}
        {isCollapsedView && <div className="border-t border-[#63405C]/70 my-2 mx-1" />}

        {/* Intelligence & Tools Section */}
        <div>
          <div
            className={`transition-all duration-300 ease-in-out ${
              isCollapsedView ? 'h-0 opacity-0 overflow-hidden my-0' : 'h-5 opacity-100 mb-1 px-2.5'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60 truncate">
              Intelligence & Tools
            </p>
          </div>

          <nav className="space-y-1">
            {bonusNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={isCollapsedView ? item.name : undefined}
                  className={`group relative flex items-center h-10 rounded-xl text-xs font-semibold transition-all duration-150 select-none ${
                    active
                      ? 'bg-[#714B67] text-white shadow-sm'
                      : 'text-purple-100/75 hover:bg-white/10 hover:text-white'
                  } ${isCollapsedView ? 'justify-center px-0' : 'px-2 gap-2.5'}`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-300 rounded-r-full" />
                  )}

                  {/* Uniform Icon Container — Exactly 36x36 with 20px icon */}
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg">
                    <Icon
                      size={20}
                      className={`shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-purple-300/80 group-hover:text-white'
                      }`}
                    />
                  </div>

                  {/* Smooth Text Label with optional badge */}
                  <div
                    className={`flex items-center justify-between overflow-hidden transition-all duration-300 ease-in-out ${
                      isCollapsedView ? 'w-0 opacity-0 pointer-events-none' : 'flex-1 opacity-100'
                    }`}
                  >
                    <span className="truncate whitespace-nowrap">{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-400/30 text-purple-100 font-bold uppercase tracking-wider shrink-0 ml-2">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Customer Self-Service Shortcut */}
        <div className="pt-2 border-t border-[#63405C]">
          <Link
            href="/customer/dashboard"
            onClick={() => setMobileOpen(false)}
            title={isCollapsedView ? 'Customer Self-Service' : undefined}
            className={`group flex items-center h-10 rounded-xl text-xs font-semibold text-emerald-200 hover:bg-emerald-950/40 hover:text-emerald-100 transition-all border border-emerald-500/30 ${
              isCollapsedView ? 'justify-center px-0' : 'px-2 gap-2.5'
            }`}
          >
            <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg">
              <ExternalLink size={20} className="text-emerald-400 shrink-0" />
            </div>
            <div
              className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
                isCollapsedView ? 'w-0 opacity-0 pointer-events-none' : 'flex-1 opacity-100'
              }`}
            >
              <span className="truncate whitespace-nowrap">Customer Portal</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer User Info & Logout — Exact 64px matching TopNav */}
      <div className="h-16 shrink-0 border-t border-[#63405C] bg-[#42293C] flex items-center px-3">
        {isCollapsedView ? (
          <button
            onClick={logout}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full overflow-hidden">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[#714B67] to-[#432A3E] flex items-center justify-center text-xs font-bold text-white uppercase border border-purple-300/30 shadow-inner">
                {user?.name?.slice(0, 2) || 'AD'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.name || 'Alexander Wright'}
                </p>
                <p className="text-[10px] text-purple-300/80 truncate uppercase tracking-wider font-semibold leading-tight">
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="h-8 w-8 shrink-0 flex items-center justify-center text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
