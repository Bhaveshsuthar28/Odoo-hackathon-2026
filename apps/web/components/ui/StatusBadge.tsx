import React from 'react';

export type StatusType =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'PENDING'
  | 'DRAFT'
  | 'SENT'
  | 'CONFIRMED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'PARTIAL'
  | 'OVERDUE'
  | 'FAILED'
  | 'REFUNDED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'COMPLETED'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  let dotColor = 'bg-zinc-400';

  if (['ACTIVE', 'PAID', 'COMPLETED', 'ACCEPTED', 'CONFIRMED'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
    dotColor = 'bg-emerald-500';
  } else if (['PAUSED', 'PENDING', 'PARTIAL', 'PARTIALLY_PAID', 'SENT'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
    dotColor = 'bg-amber-500';
  } else if (['OVERDUE', 'FAILED', 'CANCELLED', 'CLOSED', 'REJECTED', 'EXPIRED'].includes(norm)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
    dotColor = 'bg-rose-500';
  } else if (['DRAFT', 'QUOTATION', 'CONVERTED'].includes(norm)) {
    colorClasses = 'bg-purple-50 text-[#714B67] border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
    dotColor = 'bg-[#714B67] dark:bg-purple-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{norm.replace(/_/g, ' ')}</span>
    </span>
  );
}
