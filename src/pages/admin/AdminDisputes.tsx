import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Eye, Search, CheckCircle } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { TableWrapper } from '../Dashboards';
import { StatusBadge } from '../../components/StatusBadge';
import { TicketDetails } from '../../components/TicketDetails';
import { formatDate } from '../../lib/utils';

export function AdminDisputes() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { isDark } = useTheme();

  const fetchData = async () => {
    try {
      const res = await api.get('/tickets?status=DISPUTED');
      setTickets(res.data.tickets);
    } catch { toast.error('Failed to load disputes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = tickets.filter((t: any) =>
    t.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
    (t.farm?.farmName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.farmer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-red-950/30' : 'bg-red-50/50'}`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Dispute Resolution
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Disputed Quedans</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Review and resolve farmer-flagged disputes on quedans.</p>
        </div>
        <div className={`relative w-full sm:w-72`}>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search disputes..."
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-sm font-medium min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
        </div>
      </div>

      <TableWrapper title={`Active Disputes (${filtered.length})`} icon={AlertTriangle} delay={0.1}>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm whitespace-nowrap table-card-view">
            <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Quedan #</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Farmer</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Farm</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Date</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Reason</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {filtered.map((t: any) => (
                <tr key={t.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.ticketNo}</span>
                  </td>
                  <td data-label="Farmer" className="px-4 sm:px-6 py-4 sm:py-5">
                    <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.farmer?.name || '-'}</p>
                  </td>
                  <td data-label="Farm" className={`px-4 sm:px-6 py-4 sm:py-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.farm?.farmName || '-'}</td>
                  <td data-label="Date" className={`px-4 sm:px-6 py-4 sm:py-5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(t.createdAt)}</td>
                  <td data-label="Status" className="px-4 sm:px-6 py-4 sm:py-5"><StatusBadge status={t.status} /></td>
                  <td data-label="Reason" className={`px-4 sm:px-6 py-4 sm:py-5 text-xs max-w-[200px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.disputeNotes || '—'}</td>
                  <td data-label="Actions" className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedTicketId(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all min-h-[36px] ${isDark ? 'text-emerald-400 border-emerald-800 hover:bg-emerald-950/50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={`px-4 sm:px-6 py-16 text-center text-base ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                    <p className="font-bold text-lg">No disputes to review</p>
                    <p className="text-sm">All quedans are in good standing.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableWrapper>

      {selectedTicketId && <TicketDetails ticketId={selectedTicketId} onClose={() => { setSelectedTicketId(null); fetchData(); }} />}
    </div>
  );
}