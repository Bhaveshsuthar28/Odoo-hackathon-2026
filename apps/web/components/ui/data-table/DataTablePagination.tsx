'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: DataTablePaginationProps) {
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="p-3.5 sm:p-4 border-t border-[rgba(113,75,103,0.10)] bg-white/40 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#77717B] dark:text-zinc-400">
      {/* Left: Summary */}
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-[#211B24] dark:text-white font-semibold">{startRecord}</strong> to{' '}
          <strong className="text-[#211B24] dark:text-white font-semibold">{endRecord}</strong> of{' '}
          <strong className="text-[#211B24] dark:text-white font-semibold">{totalRecords}</strong> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-[rgba(113,75,103,0.14)]">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white dark:bg-zinc-800 border border-[rgba(113,75,103,0.16)] dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-[#211B24] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#714B67]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-[rgba(113,75,103,0.14)] dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(113,75,103,0.06)] text-[#211B24] dark:text-white transition-colors"
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-[rgba(113,75,103,0.14)] dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(113,75,103,0.06)] text-[#211B24] dark:text-white transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="px-3 py-1 font-semibold text-[#211B24] dark:text-white">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[rgba(113,75,103,0.14)] dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(113,75,103,0.06)] text-[#211B24] dark:text-white transition-colors"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[rgba(113,75,103,0.14)] dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(113,75,103,0.06)] text-[#211B24] dark:text-white transition-colors"
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
