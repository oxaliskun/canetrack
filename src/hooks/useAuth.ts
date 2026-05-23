import { useState, useEffect } from 'react';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  contactNumber?: string;
  address?: string;
  profilePicture?: string;
  farms?: { id: string; farmName: string; location: string; barangay?: string; hectares?: number }[];
}

export function useAuth() {
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

  return { user, login, logout, loading };
}
