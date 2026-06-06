import { useState, useEffect, createContext, useContext, createElement, ReactNode } from 'react';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  profilePicture?: string;
  assignedMill?: string;
  paNumber?: string;
  millName?: string;
  verificationStatus?: string;
  farms?: { id: string; farmName: string; location: string; barangay?: string; hectares?: number }[];
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('canetrack_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      //
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('canetrack_token', token);
    localStorage.setItem('canetrack_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('canetrack_token');
    localStorage.removeItem('canetrack_user');
    setUser(null);
  };

  return createElement(AuthContext.Provider, { value: { user, login, logout, loading } }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
