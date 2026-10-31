'use client';

import React from 'react';
import Link from 'next/link';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { ShieldCheck, UserCheck, Users, ArrowRight, Sparkles } from 'lucide-react';

export default function UniversalLoginPage() {
  const roleCards = [
    {
      title: 'Customer Portal',
      subtitle: 'Manage subscriptions, invoices & billing',
      badge: 'Verified Gmail OTP',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      href: '/customer/login',
      registerHref: '/customer/register',
      icon: Users,
      iconColor: 'bg-emerald-100/70 text-emerald-700',
    },
    {
      title: 'Staff Operations',
      subtitle: 'Quotations, customer orders & payments',
      badge: 'Internal Staff',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      href: '/staff/login',
      icon: UserCheck,
      iconColor: 'bg-amber-100/70 text-amber-700',
    },
    {
      title: 'Administrator',
      subtitle: 'Financial analytics, staff provisioning & audit',
      badge: 'Root Access',
      badgeColor: 'bg-purple-50 text-[#714B67] border-purple-200',
      href: '/admin/login',
      icon: ShieldCheck,
      iconColor: 'bg-purple-100/70 text-[#714B67]',
    },
  ];

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#714B67]/10 text-[#714B67] text-[11px] font-bold mb-2">
            <Sparkles size={12} /> Secure Multi-Role Gateway
          </div>
          <h2 className="text-2xl font-extrabold text-[#242126] font-heading tracking-tight">
            Welcome to SubFlow
          </h2>
          <p className="text-xs text-[#77727A] mt-1">
            Sign in to continue to your role-specific workspace.
          </p>
        </div>

        {/* Role Portal Cards */}
        <div className="space-y-3">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group block p-4 rounded-2xl border border-[#E8E5E9] hover:border-[#714B67] hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconColor}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#242126] group-hover:text-[#714B67] transition-colors">
                          {card.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#77727A] mt-0.5">{card.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[#9D98A1] group-hover:text-[#714B67] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Customer Self-Registration Link */}
        <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E8E5E9] text-center">
          <p className="text-xs text-[#77727A]">
            New customer subscribing for the first time?{' '}
            <Link
              href="/customer/register"
              className="font-bold text-[#714B67] hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
