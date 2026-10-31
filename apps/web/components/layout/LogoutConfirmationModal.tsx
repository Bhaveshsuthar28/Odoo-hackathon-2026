'use client';

import React from 'react';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';
import { User } from '@/lib/auth-context';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  user: User | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmationModal({
  isOpen,
  user,
  loading,
  onConfirm,
  onCancel,
}: LogoutConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      {/* Modal Card */}
      <div
        className="w-full max-w-md bg-white dark:bg-[#1C1C1F] rounded-2xl border border-[#E8E5E9] dark:border-[#2E2E32] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon + Titles */}
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/60 shadow-sm">
            <LogOut size={22} />
          </div>
          <div className="space-y-1">
            <h3
              id="logout-modal-title"
              className="text-lg font-extrabold text-[#242126] dark:text-white font-heading"
            >
              Sign Out of SubFlow
            </h3>
            <p className="text-xs text-[#77727A] dark:text-[#A1A1AA] leading-relaxed">
              Are you sure you want to end your current session? You will need to sign in again to access your workspace.
            </p>
          </div>
        </div>

        {/* User Account Info Chip */}
        {user && (
          <div className="p-3 rounded-xl bg-[#F8F7F9] dark:bg-[#242428] border border-[#E8E5E9] dark:border-[#2E2E32] flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <p className="font-bold text-[#242126] dark:text-white truncate">{user.name}</p>
              <p className="text-[11px] text-[#77727A] dark:text-[#A1A1AA] truncate">{user.email}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/50 dark:text-purple-300 border border-[#714B67]/20 uppercase shrink-0">
              {user.role}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#E8E5E9] dark:border-[#2E2E32] text-xs font-bold text-[#242126] dark:text-white hover:bg-[#F7F7F8] dark:hover:bg-[#27272A] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut size={15} />
                Yes, Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
