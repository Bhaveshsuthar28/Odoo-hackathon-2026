'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface AuthTransitionProgressProps {
  title?: string;
  subtitle?: string;
  durationMs?: number;
  icon?: 'check' | 'loading';
}

export function AuthTransitionProgress({
  title = 'Authentication Successful',
  subtitle = 'Preparing your secure workspace... Redirecting now',
  durationMs = 900,
  icon = 'check',
}: AuthTransitionProgressProps) {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs]);

  return (
    <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#1C1C1F] border border-[#E8E5E9] dark:border-[#2E2E32] shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Animated Icon */}
      <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 animate-ping opacity-60" />
        <div className="relative z-10 w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md">
          {icon === 'check' ? (
            <CheckCircle2 size={26} className="animate-in zoom-in-75 duration-300" />
          ) : (
            <Loader2 size={26} className="animate-spin text-[#714B67]" />
          )}
        </div>
      </div>

      {/* Text Info */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/60 mb-1">
          <Sparkles size={11} /> Verified Access
        </div>
        <h4 className="text-base font-extrabold text-[#242126] dark:text-white font-heading">
          {title}
        </h4>
        <p className="text-xs text-[#77727A] dark:text-[#A1A1AA]">
          {subtitle}
        </p>
      </div>

      {/* Fluid Animated Progress Bar */}
      <div className="w-full bg-[#F3EFF4] dark:bg-[#27272A] h-2 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-[#714B67] to-emerald-500 rounded-full transition-all duration-75 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
