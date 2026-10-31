import React from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, LucideIcon } from 'lucide-react';

interface ControlPanelProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    href?: string;
  };
  secondaryActions?: Array<{
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    href?: string;
  }>;
  search?: {
    value: string;
    onChange: (val: string) => void;
    onSubmit?: (e: React.FormEvent) => void;
    placeholder?: string;
  };
  filter?: {
    label?: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (val: string) => void;
  };
  children?: React.ReactNode;
}

export function ControlPanel({
  title,
  subtitle,
  badge,
  primaryAction,
  secondaryActions = [],
  search,
  filter,
  children,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {/* Top Banner with Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-heading">
              {title}
            </h1>
            {badge !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {secondaryActions.map((sec, idx) => {
            const Icon = sec.icon;
            if (sec.href) {
              return (
                <Link
                  key={idx}
                  href={sec.href}
                  className="btn-odoo-secondary text-xs sm:text-sm"
                >
                  {Icon && <Icon size={15} />}
                  <span>{sec.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={sec.onClick}
                className="btn-odoo-secondary text-xs sm:text-sm"
              >
                {Icon && <Icon size={15} />}
                <span>{sec.label}</span>
              </button>
            );
          })}

          {primaryAction && (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="btn-odoo-primary text-xs sm:text-sm"
              >
                {primaryAction.icon ? <primaryAction.icon size={16} /> : <Plus size={16} />}
                <span>{primaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="btn-odoo-primary text-xs sm:text-sm"
              >
                {primaryAction.icon ? <primaryAction.icon size={16} /> : <Plus size={16} />}
                <span>{primaryAction.label}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Filter & Search Bar if configured */}
      {(search || filter || children) && (
        <div className="odoo-control-panel flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {search ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (search.onSubmit) search.onSubmit(e);
              }}
              className="relative flex-1 max-w-md"
            >
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder={search.placeholder || 'Search records...'}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F9FAFB] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#714B67] dark:focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 transition-all shadow-inner"
              />
            </form>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {filter && (
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                {filter.label && (
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                    {filter.label}:
                  </span>
                )}
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm bg-[#F9FAFB] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] dark:text-zinc-100 font-medium cursor-pointer shadow-sm"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
