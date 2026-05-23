import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Check, RotateCcw, AlertTriangle, CheckCircle, Scale, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications, type NotificationItem } from '../context/NotificationContext';
import { cn } from '../lib/utils';

const typeConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; darkBg: string }> = {
  SUCCESS: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    darkBg: 'bg-emerald-950/50',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    darkBg: 'bg-amber-950/50',
  },
  ERROR: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    darkBg: 'bg-red-950/50',
  },
  DISPUTE: {
    icon: Scale,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    darkBg: 'bg-orange-950/50',
  },
  RESOLVED: {
    icon: CheckCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    darkBg: 'bg-blue-950/50',
  },
};

function NotificationItemRow({
  notification,
  onMarkRead,
  onMarkUnread,
}: {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
} & { key?: string }) {
  const { isDark } = useTheme();
  const config = typeConfig[notification.type] || typeConfig.SUCCESS;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-3 transition-all',
        !notification.read && (isDark ? 'bg-slate-800/40' : 'bg-emerald-50/40'),
        isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
      )}
    >
      <div className={cn('mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.bg, config.darkBg)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
          {notification.type.charAt(0) + notification.type.slice(1).toLowerCase()}
        </p>
        <p className={cn('text-xs mt-0.5 leading-relaxed break-words', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {notification.message}
        </p>
        <p className="text-[10px] mt-1 text-slate-400">
          {new Date(notification.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          })}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {notification.read ? (
          <button
            onClick={() => onMarkUnread(notification.id)}
            className={cn('p-1 rounded-md transition-colors', isDark ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600')}
            title="Mark as unread"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onMarkRead(notification.id)}
            className={cn('p-1 rounded-md transition-colors', isDark ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600')}
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const { isDark } = useTheme();
  const { notifications, unreadCount, markAsRead, markAsUnread, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.top, right: window.innerWidth - rect.right });
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={toggle}
        className={cn(
          'relative p-2.5 rounded-2xl transition-all border shadow-sm',
          open
            ? isDark
              ? 'bg-slate-800 text-emerald-400 border-emerald-800/50'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : isDark
              ? 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
              : 'bg-white/80 text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-slate-200'
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-red-500 rounded-full shadow-lg shadow-red-500/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div
            style={{ top: pos.top, right: pos.right }}
            className={cn(
              'fixed w-[calc(100vw-32px)] max-w-sm sm:w-80 rounded-2xl border shadow-2xl overflow-hidden z-[101]',
              isDark
                ? 'bg-slate-900 border-slate-700 shadow-black/30'
                : 'bg-white border-slate-200 shadow-slate-200/30'
            )}
          >
            <div className={cn('flex items-center justify-between px-5 py-4 border-b', isDark ? 'border-slate-800' : 'border-slate-100')}>
              <h3 className={cn('text-sm font-extrabold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all border',
                      isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-slate-200'
                    )}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto break-words">
              {notifications.length === 0 ? (
                <div className={cn('flex flex-col items-center justify-center py-12 px-4', isDark ? 'text-slate-600' : 'text-slate-400')}>
                  <Bell className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm font-semibold">No notifications yet</p>
                  <p className="text-xs mt-1 opacity-70">New alerts will appear here</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItemRow
                    key={n.id}
                    notification={n}
                    onMarkRead={markAsRead}
                    onMarkUnread={markAsUnread}
                  />
                ))
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
