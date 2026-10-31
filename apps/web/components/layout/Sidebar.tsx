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
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const mainNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Plans', href: '/plans', icon: Layers },
    { name: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
    { name: 'Subscriptions', href: '/subscriptions', icon: Repeat },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Discounts', href: '/discounts', icon: Percent },
  ];

  const bonusNav = [
    { name: 'Revenue Leakage', href: '/leakage', icon: ShieldAlert, badge: 'Smart' },
    { name: 'Billing Simulator', href: '/simulator', icon: Calculator },
    { name: 'Recovery Center', href: '/recovery', icon: RefreshCw },
    { name: 'CSV Import Wizard', href: '/csv-import', icon: UploadCloud },
    { name: 'AI Finance Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI' },
    { name: 'Audit Trail', href: '/audit', icon: History },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#55364E] text-white transition-all duration-300 ease-in-out border-r border-[#432A3E] shadow-2xl md:shadow-lg ${
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
      } ${collapsed ? 'md:w-16' : 'md:w-64'}`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#63405C] bg-[#4C3046]">
        {(!collapsed || mobileOpen) && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#714B67] text-white font-heading font-extrabold text-xl shadow-md border border-purple-300/30">
              S
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">SubFlow</span>
              <span className="block text-[9px] uppercase tracking-widest text-purple-200/80 font-bold">
                Odoo Enterprise
              </span>
            </div>
          </Link>
        )}
        {collapsed && !mobileOpen && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#714B67] text-white font-heading font-extrabold text-xl shadow-md">
            S
          </div>
        )}

        {/* Desktop Collapse / Mobile Close */}
        <div className="flex items-center">
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-md text-purple-200 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 text-purple-200 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {/* Core Modules */}
        <div>
          {(!collapsed || mobileOpen) && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-purple-200/60 mb-2">
              Core Operations
            </p>
          )}
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    active
                      ? 'bg-[#714B67] text-white shadow-sm'
                      : 'text-purple-100/75 hover:bg-white/10 hover:text-white'
                  }`}
                  title={collapsed && !mobileOpen ? item.name : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-300 rounded-r-full" />
                  )}
                  <Icon size={17} className={active ? 'text-white' : 'text-purple-300/80'} />
                  {(!collapsed || mobileOpen) && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Intelligence & Automation */}
        <div>
          {(!collapsed || mobileOpen) && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-purple-200/60 mb-2">
              Intelligence & Tools
            </p>
          )}
          <nav className="space-y-1">
            {bonusNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    active
                      ? 'bg-[#714B67] text-white shadow-sm'
                      : 'text-purple-100/75 hover:bg-white/10 hover:text-white'
                  }`}
                  title={collapsed && !mobileOpen ? item.name : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-300 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={active ? 'text-white' : 'text-purple-300/80'} />
                    {(!collapsed || mobileOpen) && <span>{item.name}</span>}
                  </div>
                  {(!collapsed || mobileOpen) && item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-400/30 text-purple-100 font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Customer Self-Service Portal Shortcut */}
        <div className="pt-2 border-t border-[#63405C]">
          <Link
            href="/portal"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-200 hover:bg-emerald-950/40 hover:text-emerald-100 transition-all border border-emerald-500/30"
          >
            <ExternalLink size={16} className="text-emerald-400" />
            {(!collapsed || mobileOpen) && <span>Customer Self-Service</span>}
          </Link>
        </div>
      </div>

      {/* Footer User Info */}
      <div className="p-3 border-t border-[#63405C] bg-[#42293C]">
        {(!collapsed || mobileOpen) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-[#714B67] flex items-center justify-center text-xs font-bold text-white uppercase border border-purple-300/30">
                {user?.name?.slice(0, 2) || 'AD'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Alexander Wright'}</p>
                <p className="text-[10px] text-purple-300/80 truncate uppercase tracking-wider font-semibold">
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
