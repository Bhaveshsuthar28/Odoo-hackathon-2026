'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from './api';
import { LogoutConfirmationModal } from '@/components/layout/LogoutConfirmationModal';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  customerId?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  requiresPasswordChange?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  confirmLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  confirmLogout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Read cached user from localStorage for instant render
    const cached = localStorage.getItem('subflow_user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {}
    }
    refreshUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('subflow_token', token);
    localStorage.setItem('subflow_user', JSON.stringify(userData));
    setUser(userData);
    if (userData.role === 'CUSTOMER') {
      router.push('/customer/dashboard');
    } else if (userData.role === 'STAFF') {
      router.push('/staff/dashboard');
    } else {
      router.push('/admin/dashboard');
    }
  };

  // Triggers the Logout Confirmation Modal
  const logout = () => {
    setShowLogoutModal(true);
  };

  // Executes confirmed logout with proper loader and time interval
  const confirmLogout = async () => {
    setLoggingOut(true);
    // Smooth transition interval
    await new Promise((resolve) => setTimeout(resolve, 650));
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('subflow_token');
    localStorage.removeItem('subflow_user');
    setUser(null);
    setLoggingOut(false);
    setShowLogoutModal(false);
    router.push('/login');
  };

  const cancelLogout = () => {
    if (!loggingOut) {
      setShowLogoutModal(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, confirmLogout, refreshUser }}>
      {children}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        user={user}
        loading={loggingOut}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
