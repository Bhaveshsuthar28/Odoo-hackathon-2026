'use client';

import React from 'react';
import { Loader2, Inbox } from 'lucide-react';

export interface ColumnDef<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no records matching your query.',
  emptyAction,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`subflow-table-container ${className}`}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="subflow-table-head">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-[#77717B] dark:text-zinc-400 select-none ${
                    col.headerClassName || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(113,75,103,0.08)] dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 size={28} className="animate-spin text-[#714B67]" />
                    <p className="text-xs text-[#77717B] font-medium">Loading ledger data...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(113,75,103,0.06)] flex items-center justify-center text-[#714B67] dark:text-purple-300 border border-[rgba(113,75,103,0.12)] mb-1">
                      <Inbox size={24} />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[#211B24] dark:text-white">
                      {emptyTitle}
                    </h4>
                    <p className="text-xs text-[#77717B] dark:text-zinc-400">
                      {emptyMessage}
                    </p>
                    {emptyAction && <div className="mt-3">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={(row as any).id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`subflow-table-row group ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3.5 px-4 text-xs text-[#211B24] dark:text-zinc-200 align-middle ${
                        col.className || ''
                      }`}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
