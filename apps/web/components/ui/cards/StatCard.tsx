'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  };
  icon: LucideIcon;
  variant?: 'purple' | 'emerald' | 'amber' | 'rose' | 'blue';
  href?: string;
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  purple: {
    iconBg: 'bg-[rgba(113,75,103,0.10)] dark:bg-purple-950/50',
    iconText: 'text-[#714B67] dark:text-purple-300',
    iconBorder: 'border-[rgba(113,75,103,0.18)]',
    valText: 'text-[#211B24] dark:text-white',
    accentBorder: 'border-[rgba(113,75,103,0.20)] dark:border-[rgba(113,75,103,0.35)]',
    pillBg: 'bg-purple-50 text-[#714B67] border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-950/50',
    iconText: 'text-emerald-700 dark:text-emerald-400',
    iconBorder: 'border-emerald-500/25',
    valText: 'text-[#211B24] dark:text-white',
    accentBorder: 'border-emerald-500/25 dark:border-emerald-500/40',
    pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
  },
  amber: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-950/50',
    iconText: 'text-amber-700 dark:text-amber-400',
    iconBorder: 'border-amber-500/25',
    valText: 'text-[#211B24] dark:text-white',
    accentBorder: 'border-amber-500/25 dark:border-amber-500/40',
    pillBg: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
  },
  rose: {
    iconBg: 'bg-rose-500/10 dark:bg-rose-950/50',
    iconText: 'text-rose-700 dark:text-rose-400',
    iconBorder: 'border-rose-500/25',
    valText: 'text-[#211B24] dark:text-white',
    accentBorder: 'border-rose-500/25 dark:border-rose-500/40',
    pillBg: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
  },
  blue: {
    iconBg: 'bg-blue-500/10 dark:bg-blue-950/50',
    iconText: 'text-blue-700 dark:text-blue-400',
    iconBorder: 'border-blue-500/25',
    valText: 'text-[#211B24] dark:text-white',
    accentBorder: 'border-blue-500/25 dark:border-blue-500/40',
    pillBg: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
  },
};

export function StatCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  variant = 'purple',
  href,
  onClick,
  className = '',
}: StatCardProps) {
  const styles = variantStyles[variant];

  const cardContent = (
    <div
      className={`kpi-card group relative flex flex-col justify-between p-6 transition-colors duration-150 select-none border ${styles.accentBorder} hover:bg-[#F4EFF4] dark:hover:bg-[#1E1B22] ${className}`}
      onClick={onClick}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#77717B] dark:text-zinc-400">
          {title}
        </span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${styles.iconBg} ${styles.iconText} ${styles.iconBorder}`}
        >
          <Icon size={19} strokeWidth={2.2} />
        </div>
      </div>

      {/* Numerical value */}
      <div className="my-1">
        <p className={`text-3xl sm:text-4xl font-extrabold font-heading tracking-tight tabular-nums leading-none ${styles.valText}`}>
          {value}
        </p>
      </div>

      {/* Bottom row: Trend pill & Helper subtext */}
      <div className="mt-4 pt-3 border-t border-[rgba(113,75,103,0.12)] dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">
        {trend ? (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] border shadow-xs ${
              trend.positive !== false
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25'
            }`}
          >
            {trend.positive !== false ? (
              <ArrowUpRight size={13} strokeWidth={2.5} className="shrink-0" />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} className="shrink-0" />
            )}
            <span>{trend.value}</span>
            {trend.label && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal ml-0.5">
                {trend.label}
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        {subtext && (
          <span className="text-[11px] text-[#77717B] dark:text-zinc-400 truncate font-medium text-right">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus:outline-none focus:ring-2 focus:ring-[#714B67] rounded-[20px]">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
