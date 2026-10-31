'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  badge?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, icon: Icon, error, badge, className, id, ...props }, ref) => {
    const inputId = id || `auth-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs font-bold text-[#242126]">
            {label}
          </label>
          {badge}
        </div>

        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77727A] pointer-events-none">
              <Icon size={16} />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full py-2.5 rounded-xl border bg-white text-xs text-[#242126] placeholder-[#9D98A1] transition-all duration-150',
              Icon ? 'pl-10 pr-3.5' : 'px-3.5',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-[#E8E5E9] hover:border-[#D5D0D7] focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/20',
              'focus:outline-none',
              className
            )}
            {...props}
          />
        </div>

        {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
