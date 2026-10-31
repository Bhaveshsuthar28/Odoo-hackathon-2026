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
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
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
    { name: 'Revenue Leakage', href: '/leakage', icon: ShieldAlert, badge: 'AI' },
    { name: 'Billing Simulator', href: '/simulator', icon: Calculator },
    { name: 'Recovery Center', href: '/recovery', icon: RefreshCw },
    { name: 'CSV Import Wizard', href: '/csv-import', icon: UploadCloud },
    { name: 'AI Finance Assistant', href: '/ai-assistant', icon: Bot, badge: 'Pro' },
    { name: 'Audit Trail', href: '/audit', icon: History },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#55364E] text-white transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      } border-r border-[#42293C] shadow-lg`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#63405C]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#714B67] text-white font-heading font-extrabold text-xl shadow-inner border border-purple-300/20">
              S
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">SubFlow</span>
              <span className="block text-[10px] uppercase tracking-wider text-purple-200/70 font-semibold">Enterprise</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#714B67] text-white font-heading font-extrabold text-xl">
            S
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 text-purple-200 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {/* Core Modules */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-purple-300/60 mb-2">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#714B67] text-white font-semibold shadow-sm'
                      : 'text-purple-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-purple-300'} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Competitive Features */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-purple-300/60 mb-2">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#714B67] text-white font-semibold shadow-sm'
                      : 'text-purple-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={active ? 'text-white' : 'text-purple-300'} />
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-400/30 text-purple-200 font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Customer Portal Link */}
        <div>
          <nav className="space-y-1 pt-2 border-t border-[#63405C]">
            <Link
              href="/portal"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-emerald-200 hover:bg-emerald-950/40 hover:text-emerald-100 transition-all"
              title="Customer Self-Service Portal"
            >
              <ExternalLink size={18} className="text-emerald-400" />
              {!collapsed && <span>Customer Portal</span>}
            </Link>
          </nav>
        </div>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-[#63405C] bg-[#4B2F44]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-[#714B67] flex items-center justify-center text-xs font-bold text-white uppercase border border-purple-300/30">
                {user?.name?.slice(0, 2) || 'AD'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Alexander Wright'}</p>
                <p className="text-[10px] text-purple-300 truncate uppercase tracking-wider">{user?.role || 'ADMIN'}</p>
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
