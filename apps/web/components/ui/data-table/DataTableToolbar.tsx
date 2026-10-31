'use client';

import React from 'react';
import { Search, Filter, Download, Plus } from 'lucide-react';

interface DataTableToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode;
  actions?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
  };
}

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterComponent,
  actions,
  primaryAction,
}: DataTableToolbarProps) {
  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(113,75,103,0.10)] bg-white/50 dark:bg-zinc-900/40">
      {/* Left: Search input */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77717B] dark:text-zinc-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-800 border border-[rgba(113,75,103,0.16)] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#714B67]/30 focus:border-[#714B67] text-[#211B24] dark:text-white placeholder-[#77717B] shadow-xs transition-all"
        />
      </div>

      {/* Right: Filters & Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterComponent}
        {actions}
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="btn-subflow-primary text-xs sm:text-sm"
          >
            {primaryAction.icon ? (
              <primaryAction.icon size={15} className="shrink-0" />
            ) : (
              <Plus size={15} className="shrink-0" />
            )}
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
