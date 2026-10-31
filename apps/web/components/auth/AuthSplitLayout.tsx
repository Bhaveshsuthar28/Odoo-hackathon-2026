'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthIllustration } from './AuthIllustration';
import { ShieldCheck, UserCheck, Users, Sparkles, Check } from 'lucide-react';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  activeRole?: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  customHeadline?: string;
  customDescription?: string;
}

export function AuthSplitLayout({
  children,
  activeRole,
  customHeadline,
  customDescription,
}: AuthSplitLayoutProps) {
  const pathname = usePathname();

  const roleNav = [
    { name: 'Customer', href: '/customer/login', role: 'CUSTOMER', icon: Users },
    { name: 'Staff', href: '/staff/login', role: 'STAFF', icon: UserCheck },
    { name: 'Admin', href: '/admin/login', role: 'ADMIN', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen w-full bg-[#EAF3F5] text-[#242126] flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Outer Card with 28px radius and soft shadow */}
      <div className="w-full max-w-[1240px] min-h-[720px] lg:min-h-[820px] bg-white rounded-[28px] border border-[#E8E5E9] shadow-[0_25px_70px_-15px_rgba(30,50,70,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* ======================================================== */}
        {/* LEFT COLUMN: BRANDING, HEADLINE & ILLUSTRATION (~55%)   */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 xl:col-span-7 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between bg-gradient-to-b from-[#FCFBFD] via-[#F8F6F9] to-[#F3EFF4] border-b lg:border-b-0 lg:border-r border-[#ECE8EF] relative overflow-hidden">
          {/* Subtle decorative background watermarks */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#714B67]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#0D9488]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* 1. Header with Logo */}
          <div className="relative z-10">
            <Link href="/login" className="inline-flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#714B67] to-[#55364E] text-white flex items-center justify-center font-heading font-extrabold text-2xl shadow-md border border-purple-300/30 group-hover:scale-105 transition-transform duration-200">
                S
              </div>
              <div>
                <span className="font-heading font-extrabold text-2xl tracking-tight text-[#242126] block leading-none">
                  SubFlow
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#714B67] mt-1 block">
                  Enterprise Cloud
                </span>
              </div>
            </Link>

            {/* Headline & Description */}
            <div className="mt-8 lg:mt-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#E8E5E9] text-[11px] font-bold text-[#714B67] shadow-sm mb-3">
                <Sparkles size={13} className="text-[#714B67]" />
                Next-Gen Recurring Billing Architecture
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-[#242126] tracking-tight leading-[1.2]">
                {customHeadline ? (
                  customHeadline
                ) : (
                  <>
                    Manage Every Subscription.{' '}
                    <span className="text-[#714B67] block">Simplify Your Business.</span>
                  </>
                )}
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-[#77727A] leading-relaxed max-w-md">
                {customDescription ||
                  'A smarter way to manage customers, recurring billing, automated tax invoicing and multi-channel payment reconciliation — all in one unified workspace.'}
              </p>
            </div>
          </div>

          {/* 2. Middle: Vector SaaS Illustration */}
          <div className="relative z-10 my-6 sm:my-8">
            <AuthIllustration />
          </div>

          {/* 3. Bottom: Value Pillars */}
          <div className="relative z-10 pt-4 border-t border-[#E8E5E9]/80 flex flex-wrap items-center justify-between gap-3 text-xs text-[#77727A]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              Recurring Billing Engine
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              Strict Role Isolation
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              Verified Gmail OTP
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: AUTHENTICATION FORM (~45%)                */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between items-center bg-white">
          {/* Top Role Selector Tabs (Only on login pages) */}
          <div className="w-full flex justify-end">
            {activeRole && (
              <div className="inline-flex items-center p-1 rounded-xl bg-[#F7F7F8] border border-[#E8E5E9] text-xs">
                {roleNav.map((item) => {
                  const isActive = activeRole === item.role;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.role}
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        isActive
                          ? 'bg-white text-[#714B67] shadow-sm border border-[#E8E5E9]'
                          : 'text-[#77727A] hover:text-[#242126]'
                      }`}
                    >
                      <Icon size={13} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Centered Form Wrapper (Max 390px) */}
          <div className="w-full max-w-[390px] my-auto py-4">
            {children}
          </div>

          {/* Footer Copyright */}
          <div className="w-full text-center pt-4 border-t border-[#F1F1F3]">
            <p className="text-[11px] text-[#77727A]">
              © 2026 SubFlow Inc. Every Subscription. Every Payment. Every Invoice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
