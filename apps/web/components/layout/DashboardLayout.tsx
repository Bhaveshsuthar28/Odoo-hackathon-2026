'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useAuth } from '@/lib/auth-context';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#121214]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <TopNav collapsed={collapsed} />

      <main
        className={`pt-20 pb-12 px-6 transition-all duration-300 min-h-screen ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
