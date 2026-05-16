import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { TableWrapper } from '../Dashboards';
import { StatusBadge } from '../../components/StatusBadge';
import { SearchInput } from '../../components/SearchInput';
import { formatWeight, formatDate, formatCurrency } from '../../lib/utils';

export function AdminTickets() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const fetchRecords = async () => {
    try {
      const res = await api.get('/reconciliation');
      setRecords(res.data.records);
      setLoading(false);
    } catch {
      toast.error('Failed to load tickets');
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleResolve = async (id: string) => {
    const notes = prompt("Enter resolution notes (optional):");
    try {
      await api.patch(`/reconciliation/${id}/resolve`, { resolutionNotes: notes || '' });
      toast.success('Dispute resolved successfully.');
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute.');
    }
  };

  const filteredRecords = records.filter((r: any) => {
    const matchesFilter = filter === 'ALL' || r.ticket.status === filter;
    const matchesSearch = r.ticket.ticketNo.toLowerCase().includes(search.toLowerCase()) || 
                          r.ticket.truckPlate.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
       <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-blue-500/30 border-t-blue-400' : 'border-blue-500/30 border-t-blue-500'}`} />
     </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-blue-950/30' : 'bg-blue-50/50'}`} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live Monitoring
          </div>
          <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Ticket & Dispute Monitor</h1>
        </div>
      </div>

      <TableWrapper 
        title="Reconciliation Audit Trail" 
        icon={Database} 
        delay={0.1}
        action={
           <div className="flex items-center gap-3">
             <SearchInput 
               value={search} 
               onChange={setSearch} 
               placeholder="Search Ticket or Plate..." 
               className="w-64"
             />
             <select 
               value={filter} 
               onChange={e => setFilter(e.target.value)}
               className={`px-4 py-3 border rounded-xl text-sm font-bold outline-none focus:ring-2 cursor-pointer h-full ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/20' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-blue-500/20'}`}
             >
                <option value="ALL">All Statuses</option>
                <option value="RECONCILED">Reconciled</option>
                <option value="DISPUTED">Disputed</option>
             </select>
           </div>
        }
      >
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
            <tr>
              <th className="px-6 py-5">Ticket Core</th>
              <th className="px-6 py-5">Weights (Mill vs Ref)</th>
              <th className="px-6 py-5 text-center">Variance (kg)</th>
              <th className="px-6 py-5">Financial Impact</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Resolution / Details</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
            {filteredRecords.map((r: any) => {
              const varianceValue = Math.abs(r.difference * r.ticket.pricePerKg); 
              return (
              <tr key={r.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                <td className="px-6 py-5">
                   <p className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{r.ticket.ticketNo}</p>
                   <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(r.createdAt)}</p>
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col gap-1 text-xs">
                      <div className={`flex justify-between w-32 pb-0.5 ${isDark ? 'border-slate-700 border-b' : 'border-slate-100 border-b'}`}><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Mill:</span><span className={`font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatWeight(r.ticket.millWeight)}</span></div>
                      <div className="flex justify-between w-32"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Ref:</span><span className={`font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatWeight(r.refineryWeight)}</span></div>
                   </div>
                </td>
                <td className="px-6 py-5 font-mono text-center">
                  <span className={`px-4 py-1.5 rounded-xl text-sm font-black border flex items-center justify-center gap-1 mx-auto w-max ${Math.abs(r.difference) > 50 ? (isDark ? 'bg-red-950/30 text-red-400 border-red-900' : 'bg-red-50 text-red-700 border-red-200') : (isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-700 border-slate-200')}`}>
                     {r.difference > 0 ? '+' : ''}{r.difference} kg <span className="opacity-50 ml-1 text-[10px] font-semibold">({r.percentDiff.toFixed(2)}%)</span>
                  </span>
                </td>
                <td className={`px-6 py-5 font-mono font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {Math.abs(r.difference) > 0 ? `₱${varianceValue.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-5"><StatusBadge status={r.ticket.status} /></td>
                <td className="px-6 py-5">
                  {r.ticket.status === 'DISPUTED' ? (
                     <button onClick={() => handleResolve(r.id)} className={`border px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-2 ${isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800 hover:bg-purple-600 hover:text-white' : 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-600 hover:text-white'}`}>
                        <AlertTriangle className="w-3.5 h-3.5" /> Resolve Overwrite
                     </button>
                  ) : (
                     <div className="flex flex-col gap-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Archived</span>
                        {r.notes && <span className={`text-xs truncate max-w-[150px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`} title={r.notes}>Note: {r.notes}</span>}
                     </div>
                  )}
                </td>
              </tr>
            )})}
            {filteredRecords.length === 0 && <tr><td colSpan={6} className={`px-6 py-20 text-center text-lg font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No tickets found matching the criteria.</td></tr>}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );
}
