import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, LogOut, Users, FilePlus, Leaf, Settings, BarChart, User, Shield, Truck, CheckCircle, Sprout, Bell, Moon, Sun, History, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';
import api from '../api/axiosInstance';
import { cn } from '../lib/utils';

interface SidebarProps {
  role: string;
  userName: string;
  onClose?: () => void;
}

export function Sidebar({ role, userName, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/dashboard/admin', icon: Home },
          { name: 'Users', path: '/dashboard/admin/users', icon: Users },
          { name: 'Tickets', path: '/dashboard/admin/tickets', icon: FileText },
          { name: 'Reports', path: '/dashboard/admin/reports', icon: BarChart },
          { name: 'Activity Logs', path: '/dashboard/admin/audit-logs', icon: History },
        ];
      case 'OPERATOR':
        return [
           { name: 'Terminal', path: '/dashboard/operator', icon: Home },
        ];
      case 'RECEIVER':
        return [
           { name: 'Queue', path: '/dashboard/receiver', icon: Home },
        ];
      case 'FARMER':
        return [
           { name: 'My Performance', path: '/dashboard/farmer', icon: FileText },
           { name: 'My Farms', path: '/dashboard/farmer/farms', icon: Sprout }
        ];
      default: return [];
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4 text-purple-600" />;
      case 'OPERATOR': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'RECEIVER': return <CheckCircle className="w-4 h-4 text-orange-600" />;
      case 'FARMER': return <Sprout className="w-4 h-4 text-emerald-600" />;
      default: return null;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'ADMIN': return 'from-purple-500 to-purple-600 shadow-purple-500/20';
      case 'OPERATOR': return 'from-blue-500 to-blue-600 shadow-blue-500/20';
      case 'RECEIVER': return 'from-orange-500 to-orange-600 shadow-orange-500/20';
      case 'FARMER': return 'from-emerald-500 to-emerald-600 shadow-emerald-500/20';
      default: return 'from-emerald-500 to-emerald-600 shadow-emerald-500/20';
    }
  };

  return (
    <aside className={`w-full h-full flex flex-col relative z-20 shadow-xl ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 shadow-black/20' : 'bg-gradient-to-b from-white to-slate-50/50 border-slate-200 shadow-slate-200/20'}`}>
      {/* Mobile close button */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0 lg:hidden">
        <span className="sr-only">Navigation</span>
        <button
          onClick={onClose}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors border ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700 border-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200'}`}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-xl lg:p-2.5 lg:rounded-2xl shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
            <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <h1 className={`text-xl lg:text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            CaneTrack
          </h1>
        </Link>
        <div className={`mt-6 lg:mt-10 rounded-xl lg:rounded-[2rem] p-4 lg:p-5 border shadow-sm relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-50 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'}`} />
          <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Welcome Back</p>
          <p className={`text-sm lg:text-base font-bold truncate tracking-tight ml-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
          <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${getRoleColor()} text-white text-[10px] rounded-full shadow-md font-black uppercase tracking-widest`}>
            {getRoleIcon()}
            {role.replace('_', ' ')}
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2 lg:py-4 flex flex-col gap-1 lg:gap-2 px-3 lg:px-6 overflow-y-auto custom-scrollbar">
        {getLinks().map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => onClose?.()}
              className={cn(
                "group flex items-center gap-3 px-4 lg:px-5 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl text-sm font-bold transition-all duration-200 relative overflow-hidden min-h-[44px]",
                isActive
                  ? isDark
                    ? "text-emerald-400 bg-gradient-to-r from-emerald-950/50 to-emerald-900/30 shadow-sm border border-emerald-800/50"
                    : "text-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-50/50 shadow-sm border border-emerald-100"
                  : isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-500'}`} />}
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-slate-600" : "text-slate-400"))} />
              <span className="truncate">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`p-3 lg:p-4 border-t flex flex-col gap-1 lg:gap-2 safe-bottom ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between px-2 mb-1">
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Menu
          </span>
          <NotificationDropdown />
        </div>
        <Link
          to="/dashboard/profile"
          onClick={() => onClose?.()}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl lg:rounded-2xl text-sm font-bold transition-all duration-200 min-h-[44px]",
            location.pathname === '/dashboard/profile'
              ? isDark
                ? "text-emerald-400 bg-emerald-950/50 shadow-sm border border-emerald-800/50"
                : "text-emerald-700 bg-emerald-50 shadow-sm border border-emerald-100"
              : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <User className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", location.pathname === '/dashboard/profile' ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-slate-600" : "text-slate-400"))} />
          <span className="truncate">My Profile</span>
        </Link>
        <Link
          to="/dashboard/settings"
          onClick={() => onClose?.()}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl lg:rounded-2xl text-sm font-bold transition-all duration-200 min-h-[44px]",
            location.pathname === '/dashboard/settings'
              ? isDark
                ? "text-emerald-400 bg-emerald-950/50 shadow-sm border border-emerald-800/50"
                : "text-emerald-700 bg-emerald-50 shadow-sm border border-emerald-100"
              : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Settings className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", location.pathname === '/dashboard/settings' ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-slate-600" : "text-slate-400"))} />
          <span className="truncate">Settings</span>
        </Link>

        <Link
          to="/dashboard/activity-logs"
          onClick={() => onClose?.()}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl lg:rounded-2xl text-sm font-bold transition-all duration-200 min-h-[44px]",
            location.pathname === '/dashboard/activity-logs'
              ? isDark
                ? "text-emerald-400 bg-emerald-950/50 shadow-sm border border-emerald-800/50"
                : "text-emerald-700 bg-emerald-50 shadow-sm border border-emerald-100"
              : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <History className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", location.pathname === '/dashboard/activity-logs' ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-slate-600" : "text-slate-400"))} />
          <span className="truncate">My Activity</span>
        </Link>

        <button
          onClick={handleLogout}
          className={`flex w-full items-center justify-center gap-3 px-4 py-3 text-sm font-bold rounded-xl lg:rounded-2xl transition-all border border-transparent shadow-sm mt-1 lg:mt-2 min-h-[44px] ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50' : 'text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100'}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
