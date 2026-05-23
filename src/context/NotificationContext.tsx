import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import api from '../api/axiosInstance';

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'DISPUTE' | 'RESOLVED';
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAsUnread: async () => {},
  markAllAsRead: async () => {},
  refresh: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications?limit=20'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notifRes.data.notifications);
      setUnreadCount(countRes.data.count);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* */ }
  }, []);

  const markAsUnread = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/unread`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: false } : n))
      );
      setUnreadCount(prev => prev + 1);
    } catch { /* */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
