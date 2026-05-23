import { useEffect, useState } from 'react';
import { History, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { TableWrapper } from '../Dashboards';
import { SearchInput } from '../../components/SearchInput';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'User Login',
  LOGOUT: 'User Logout',
  CREATE_TICKET: 'Ticket Created',
  RECONCILE_OK: 'Ticket Reconciled',
  RECONCILE_DISPUTED: 'Dispute Flagged',
  RESOLVE_DISPUTE: 'Dispute Resolved',
  CREATE_FARM: 'Farm Created',
  UPDATE_FARM: 'Farm Updated',
  ARCHIVE_FARM: 'Farm Archived',
  UNARCHIVE_FARM: 'Farm Unarchived',
  CREATE_USER: 'User Created',
  DELETE_USER: 'User Deleted',
  UPDATE_PROFILE: 'Profile Updated',
  PASSWORD_CHANGE: 'Password Changed',
  ACTIVATE_USER: 'User Activated',
  DEACTIVATE_USER: 'User Deactivated',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-emerald-400 bg-emerald-900/30 border-emerald-800',
  LOGOUT: 'text-slate-400 bg-slate-800/30 border-slate-700',
  CREATE_TICKET: 'text-blue-400 bg-blue-900/30 border-blue-800',
  RECONCILE_OK: 'text-emerald-400 bg-emerald-900/30 border-emerald-800',
  RECONCILE_DISPUTED: 'text-orange-400 bg-orange-900/30 border-orange-800',
  RESOLVE_DISPUTE: 'text-purple-400 bg-purple-900/30 border-purple-800',
  CREATE_FARM: 'text-green-400 bg-green-900/30 border-green-800',
  UPDATE_FARM: 'text-cyan-400 bg-cyan-900/30 border-cyan-800',
  ARCHIVE_FARM: 'text-rose-400 bg-rose-900/30 border-rose-800',
  UNARCHIVE_FARM: 'text-teal-400 bg-teal-900/30 border-teal-800',
  CREATE_USER: 'text-indigo-400 bg-indigo-900/30 border-indigo-800',
  DELETE_USER: 'text-red-400 bg-red-900/30 border-red-800',
  UPDATE_PROFILE: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  PASSWORD_CHANGE: 'text-pink-400 bg-pink-900/30 border-pink-800',
  ACTIVATE_USER: 'text-emerald-400 bg-emerald-900/30 border-emerald-800',
  DEACTIVATE_USER: 'text-rose-400 bg-rose-900/30 border-rose-800',
};

const ACTION_COLORS_LIGHT: Record<string, string> = {
  LOGIN: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  LOGOUT: 'text-slate-600 bg-slate-100 border-slate-200',
  CREATE_TICKET: 'text-blue-700 bg-blue-100 border-blue-200',
  RECONCILE_OK: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  RECONCILE_DISPUTED: 'text-orange-700 bg-orange-100 border-orange-200',
  RESOLVE_DISPUTE: 'text-purple-700 bg-purple-100 border-purple-200',
  CREATE_FARM: 'text-green-700 bg-green-100 border-green-200',
  UPDATE_FARM: 'text-cyan-700 bg-cyan-100 border-cyan-200',
  ARCHIVE_FARM: 'text-rose-700 bg-rose-100 border-rose-200',
  UNARCHIVE_FARM: 'text-teal-700 bg-teal-100 border-teal-200',
  CREATE_USER: 'text-indigo-700 bg-indigo-100 border-indigo-200',
  DELETE_USER: 'text-red-700 bg-red-100 border-red-200',
  UPDATE_PROFILE: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  PASSWORD_CHANGE: 'text-pink-700 bg-pink-100 border-pink-200',
  ACTIVATE_USER: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  DEACTIVATE_USER: 'text-rose-700 bg-rose-100 border-rose-200',
};

export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });
  const { isDark } = useTheme();

  const fetchLogs = async (pageOverride?: number) => {
    try {
      const currentPage = pageOverride ?? page;
      const params = new URLSearchParams();
      if (filterUser) params.set('userId', filterUser);
      if (filterAction) params.set('action', filterAction);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(currentPage));
      params.set('limit', '50');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
      setLoading(false);
    } catch {
      toast.error('Failed to load audit logs');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch {}
  };

  const fetchActions = async () => {
    try {
      const res = await api.get('/audit-logs/actions');
      setActions(res.data.actions);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchActions();
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchLogs(1);
  }, [filterUser, filterAction, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    if (page > 1 || logs.length > 0) fetchLogs(page);
  }, [page]);

  const handleResetFilters = () => {
    setFilterUser('');
    setFilterAction('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setPage(1);
  };

  if (loading && logs.length === 0) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-purple-500/30 border-t-purple-400' : 'border-purple-500/30 border-t-purple-500'}`} />
    </div>
  );

  const selectClass = `px-4 py-3 border rounded-xl text-sm font-bold outline-none focus:ring-2 cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500/20' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-purple-500/20'}`;
  const inputClass = `px-4 py-3 border rounded-xl text-sm font-bold outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500/20' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-purple-500/20'}`;
  const getActionColor = (action: string) => isDark ? (ACTION_COLORS[action] || 'text-slate-300 bg-slate-800/50 border-slate-700') : (ACTION_COLORS_LIGHT[action] || 'text-slate-700 bg-slate-100 border-slate-200');
  const getActionLabel = (action: string) => ACTION_LABELS[action] || action;

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-purple-950/30' : 'bg-purple-50/50'}`} />

      <div className="flex flex-col mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 border w-max ${isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Audit Trail
          </div>
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Activity Logs</h1>
          <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Monitor all system-wide user activity and changes.</p>
        </div>
      </div>

      <TableWrapper
        title="System Activity Log"
        icon={History}
        delay={0.1}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search logs..."
              className="w-full sm:w-56"
            />
          </div>
        }
      >
        <div className={`p-3 sm:p-4 border-b flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <Filter className={`w-4 h-4 hidden sm:block ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className={`${selectClass} w-full sm:w-44`}>
            <option value="">All Users</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className={`${selectClass} w-full sm:w-48`}>
            <option value="">All Actions</option>
            {actions.map((a: string) => (
              <option key={a} value={a}>{getActionLabel(a)}</option>
            ))}
          </select>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Calendar className={`w-4 h-4 hidden sm:block ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={`${inputClass} flex-1 sm:flex-none`} />
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={`${inputClass} flex-1 sm:flex-none`} />
            </div>
          </div>
          {(filterUser || filterAction || dateFrom || dateTo || searchTerm) && (
            <button onClick={handleResetFilters} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors min-h-[36px] ${isDark ? 'text-slate-400 border-slate-700 hover:bg-slate-700' : 'text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
              Clear Filters
            </button>
          )}
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm whitespace-nowrap table-card-view">
            <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">User</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Action</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Target</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Timestamp</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {logs.map((log: any) => (
                <tr key={log.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <td data-label="User" className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black border shrink-0 ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {log.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{log.user?.name || 'Unknown'}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{log.user?.role || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Action" className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td data-label="Target" className={`px-4 sm:px-6 py-4 sm:py-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {log.targetType ? (
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{log.targetType}</span>
                        <p className="font-mono text-xs truncate max-w-[200px]" title={log.targetId || ''}>{log.targetId || '-'}</p>
                      </div>
                    ) : (
                      <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>—</span>
                    )}
                  </td>
                  <td data-label="Timestamp" className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(log.timestamp)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className={`px-4 sm:px-6 py-12 sm:py-20 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    <div className="flex flex-col items-center gap-2">
                      <History className="w-8 h-8 sm:w-10 sm:h-10 opacity-30" />
                      No activity logs found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`p-2 rounded-xl border transition-colors disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className={`p-2 rounded-xl border transition-colors disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </TableWrapper>
    </div>
  );
}
