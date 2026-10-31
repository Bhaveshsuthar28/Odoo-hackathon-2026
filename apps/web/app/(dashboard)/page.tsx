'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function RootPageRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'STAFF') {
        router.replace('/staff/dashboard');
      } else if (user.role === 'CUSTOMER') {
        router.replace('/customer/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#121214] flex flex-col items-center justify-center">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#714B67] to-[#55364E] text-white flex items-center justify-center font-extrabold text-2xl font-heading shadow-md mb-4 animate-pulse">
        S
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-[#737373]">
        <Loader2 size={16} className="animate-spin text-[#714B67]" />
        Routing to your authorized SubFlow portal...
      </div>
    </div>
  );
}
