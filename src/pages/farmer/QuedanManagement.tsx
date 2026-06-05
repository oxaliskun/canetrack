import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import api from '../../api/axiosInstance';
import { formatWeight, formatDate, formatCurrency } from '../../lib/utils';
import { FileText, Clock, Plus, Search, Download, Eye, DollarSign } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { TicketDetails } from '../../components/TicketDetails';
import { QuedanForm } from '../../components/QuedanForm';
import { StatCard, TableWrapper } from '../Dashboards';

export function QuedanManagement() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { isDark } = useTheme();

  const fetchData = () => {
    setLoading(true);
    api.get('/tickets').then((res) => {
      setTickets(res.data.tickets);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = tickets.filter((t: any) =>
    !search || t.ticketNo.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = tickets.filter((t: any) => t.status === 'PENDING').length;
  const paidCount = tickets.filter((t: any) => t.status === 'PAID').length;

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[30%] h-[30%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
        <div className="min-w-0">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3 border w-max ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Quedan Records
          </div>
          <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Quedan Management</h1>
          <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Create, track, and manage your delivery quedans.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg min-h-[44px] ${
            showCreateForm
              ? isDark ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-600/30'
          }`}
        >
          <Plus className="w-5 h-5" />
          {showCreateForm ? 'Cancel' : 'New Quedan'}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <StatCard label="Total Quedans" value={tickets.length} subtitle="All time" icon={FileText} colorClass={{bg: 'bg-blue-100', text: 'text-blue-700'}} delay={0.1} />
        <StatCard label="Pending" value={pendingCount} subtitle="Awaiting payment" icon={Clock} colorClass={{bg: 'bg-orange-100', text: 'text-orange-700'}} delay={0.2} />
        <StatCard label="Paid" value={paidCount} subtitle="Completed" icon={DollarSign} colorClass={{bg: 'bg-emerald-100', text: 'text-emerald-700'}} delay={0.3} />
      </div>

      {showCreateForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-extrabold text-base mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Plus className="w-5 h-5 text-emerald-500" /> New Quedan
          </h3>
          <QuedanForm onSuccess={() => { setShowCreateForm(false); fetchData(); }} />
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pl-12 pr-5 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
            placeholder="Search quedan number..." />
        </div>
      </div>

      <TableWrapper title="All Deliveries" icon={FileText} delay={0.6}>
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
            <tr>
              <th className="px-4 sm:px-6 py-4 sm:py-5">Quedan No</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5">Created</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5">Updated</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5">Mill</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Net Value</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
            {filtered.map((t: any) => (
                <tr key={t.id} className={`transition-colors group cursor-default ${isDark ? 'hover:bg-emerald-950/30 hover:text-emerald-400' : 'hover:bg-emerald-50 hover:text-emerald-900'}`}>
                  <td className={`px-4 sm:px-6 py-4 sm:py-5 font-mono text-xs sm:text-sm font-bold group-hover:text-emerald-500 truncate max-w-[130px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} data-label="Quedan">{t.ticketNo}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5" data-label="Created">{formatDate(t.createdAt)}</td>
                  <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Updated">{formatDate(t.updatedAt)}</td>
                  <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Mill">{t.farmer?.assignedMill || '—'}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5" data-label="Status"><StatusBadge status={t.status} /></td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right" data-label="Value"><span className={`px-2 sm:px-3 py-1 font-black rounded-lg border group-hover:scale-105 transition-transform inline-block text-xs sm:text-sm ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-green-100 text-green-800 border-green-200'}`}>{formatCurrency(t.payment?.netAmount || 0)}</span></td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-center" data-label="Actions">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedTicketId(t.id)} className={`p-2 rounded-xl transition-colors inline-block min-h-[36px] ${isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/30' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-100'}`} title="View Details">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button onClick={() => {
                         const content = `CaneTrack Statement\nQuedan: ${t.ticketNo}\nPlate: ${t.bagon?.plateNumber || '—'}\nStatus: ${t.status}\nNet Wt: ${formatWeight(t.netWeight || 0)}\nValue: ${formatCurrency(t.payment?.netAmount || 0)}\nDate: ${new Date(t.createdAt).toLocaleString()}\n\n-- Retain for your records --`;
                        const printWindow = window.open('', '', 'width=400,height=600');
                        if(printWindow) {
                          printWindow.document.write(`<pre style="font-family: monospace; font-size: 14px; padding: 20px;">${content}</pre>`);
                          printWindow.document.close();
                          printWindow.focus();
                          printWindow.print();
                          printWindow.close();
                        }
                       }} className={`p-2 rounded-xl transition-colors inline-block min-h-[36px] ${isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/30' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-100'}`} title="Download Receipt">
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className={`px-6 py-16 sm:py-20 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No quedans found.</td></tr>}
          </tbody>
        </table>
      </TableWrapper>

      {selectedTicketId && (
        <TicketDetails ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}
    </div>
  );
}
