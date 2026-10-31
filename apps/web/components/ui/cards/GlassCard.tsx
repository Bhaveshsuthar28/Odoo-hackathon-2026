'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 sm:p-6 transition-colors duration-150 ${
        hoverEffect ? 'hover:bg-[#F4EFF4] dark:hover:bg-[#1E1B22]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface GlassCardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  className?: string;
}

export function GlassCardHeader({
  title,
  subtitle,
  badge,
  action,
  icon: Icon,
  className = '',
}: GlassCardHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[rgba(113,75,103,0.12)] ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[rgba(113,75,103,0.08)] text-[#714B67] dark:text-purple-300 flex items-center justify-center shrink-0 border border-[rgba(113,75,103,0.18)] shadow-sm">
            <Icon size={20} />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#211B24] dark:text-white tracking-tight">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-[#77717B] dark:text-zinc-400 mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
