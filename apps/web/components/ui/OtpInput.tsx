'use client';

import React, { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const chars = value.split('').slice(0, length);
    const newDigits = Array(length).fill('');
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setDigits(newDigits);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Digits only

    if (!val) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      onChange(next.join(''));
      return;
    }

    // Handle single digit
    const char = val[val.length - 1];
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    onChange(next.join(''));

    // Move to next input
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        onChange(next.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;

    const next = Array(length).fill('');
    pasteData.split('').forEach((c, i) => {
      next[i] = c;
    });
    setDigits(next);
    onChange(next.join(''));

    // Focus on the next empty box or the last box
    const focusIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold font-mono bg-white dark:bg-[#1E1E22] text-[#252525] dark:text-white border-2 border-[#E5E7EB] dark:border-[#3F3F46] rounded-xl focus:outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/20 transition-all duration-200 shadow-sm disabled:opacity-50"
        />
      ))}
    </div>
  );
}
