import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  icon: LucideIcon;
  color?: 'purple' | 'emerald' | 'amber' | 'rose' | 'blue' | 'teal';
  href?: string;
  onClick?: () => void;
}

const colorStyles = {
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-[#714B67] dark:text-purple-300',
    border: 'hover:border-[#714B67]/40',
    valText: 'text-[#714B67] dark:text-purple-300',
    topBar: 'bg-[#714B67]',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/40',
    valText: 'text-emerald-600 dark:text-emerald-400',
    topBar: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/40',
    valText: 'text-amber-600 dark:text-amber-400',
    topBar: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'hover:border-rose-500/40',
    valText: 'text-rose-600 dark:text-rose-400',
    topBar: 'bg-rose-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-500/40',
    valText: 'text-zinc-900 dark:text-white',
    topBar: 'bg-blue-500',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'hover:border-teal-500/40',
    valText: 'text-teal-700 dark:text-teal-300',
    topBar: 'bg-teal-500',
  },
};

export function KpiCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  color = 'purple',
  href,
  onClick,
}: KpiCardProps) {
  const styles = colorStyles[color];

  const content = (
    <div className={`odoo-kpi-card group relative flex flex-col justify-between ${styles.border}`}>
      {/* Accent top stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${styles.topBar} opacity-80`} />

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          <div className={`p-2 rounded-lg ${styles.bg} ${styles.text} transition-transform group-hover:scale-110 duration-200`}>
            <Icon size={18} />
          </div>
        </div>

        <p className={`text-3xl sm:text-4xl font-extrabold font-heading tracking-tight tabular-nums ${styles.valText}`}>
          {value}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        {trend ? (
          <div
            className={`inline-flex items-center gap-1 font-semibold ${
              trend.positive !== false
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.positive !== false ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trend.value}</span>
          </div>
        ) : subtext ? (
          <span className="text-zinc-500 dark:text-zinc-400 font-medium truncate">
            {subtext}
          </span>
        ) : null}

        {href && (
          <span className="text-zinc-400 group-hover:text-[#714B67] dark:group-hover:text-purple-300 text-[11px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            View &rarr;
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}
