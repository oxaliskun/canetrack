import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, LogOut, Users, FilePlus, Leaf, Settings, BarChart, User, Shield, Truck, CheckCircle, Sprout, Bell, Moon, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
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
           { name: 'My Performance', path: '/dashboard/farmer', icon: FileText }
        ];
      default: return [];
    }
  };

  const handleLogout = () => {
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
    <aside className={`w-[280px] border-r h-full flex flex-col relative z-20 shadow-xl ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 shadow-black/20' : 'bg-gradient-to-b from-white to-slate-50/50 border-slate-200 shadow-slate-200/20'}`}>
      <div className="p-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            CaneTrack
          </h1>
        </Link>
        <div className={`mt-10 rounded-[2rem] p-5 border shadow-sm relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-50 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'}`} />
          <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Welcome Back</p>
          <p className={`text-base font-bold truncate tracking-tight ml-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
          <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${getRoleColor()} text-white text-[10px] rounded-full shadow-md font-black uppercase tracking-widest`}>
            {getRoleIcon()}
            {role.replace('_', ' ')}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-4 flex flex-col gap-2 px-6 overflow-y-auto">
        {getLinks().map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          
          return (
            <Link 
              key={link.name} 
              to={link.path}
              onClick={() => onClose?.()}
              className={cn(
                "group flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 relative overflow-hidden",
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
              <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-slate-600" : "text-slate-400"))} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t flex flex-col gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <Link 
          to="/dashboard/profile"
          onClick={() => onClose?.()}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200",
            location.pathname === '/dashboard/profile'
              ? isDark
                ? "text-emerald-400 bg-emerald-950/50 shadow-sm border border-emerald-800/50"
                : "text-emerald-700 bg-emerald-50 shadow-sm border border-emerald-100"
              : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <User className={cn("w-5 h-5 transition-transform group-hover:scale-110", location.pathname === '/dashboard/profile' ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-slate-600" : "text-slate-400"))} />
          My Profile
        </Link>
        <Link 
          to="/dashboard/settings"
          onClick={() => onClose?.()}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200",
            location.pathname === '/dashboard/settings'
              ? isDark
                ? "text-emerald-400 bg-emerald-950/50 shadow-sm border border-emerald-800/50"
                : "text-emerald-700 bg-emerald-50 shadow-sm border border-emerald-100"
              : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Settings className={cn("w-5 h-5 transition-transform group-hover:scale-110", location.pathname === '/dashboard/settings' ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-slate-600" : "text-slate-400"))} />
          Settings
        </Link>
        
        <button 
          onClick={handleLogout}
          className={`flex w-full items-center justify-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all border border-transparent shadow-sm mt-2 ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50' : 'text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100'}`}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
