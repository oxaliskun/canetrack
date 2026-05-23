import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { formatWeight, formatDate, formatCurrency, resolveProfilePic } from '../lib/utils';
import { FileText, CheckCircle, AlertTriangle, Clock, Activity, DollarSign, Database, Plus, Users, UserPlus, TrendingUp, Printer, Bell, Download, Sprout, Shield, BarChart3, Truck, Scale, Leaf, Phone, MapPin, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge } from '../components/StatusBadge';
import { TicketDetails } from '../components/TicketDetails';
import { toast } from 'sonner';

export function StatCard({ label, value, icon: Icon, colorClass, delay = 0, subtitle }: any) {
  const { isDark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, delay, type: "spring" }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl border flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group cursor-default ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:shadow-black/30' : 'bg-white border-slate-200 hover:shadow-slate-200/50'}`}
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full ${colorClass.bg.replace('100', '400')}`} />
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10`} style={{ color: colorClass.text.replace('700', '500') }} />

      <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
        <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${colorClass.bg} ${colorClass.text} group-hover:scale-110 transition-transform shadow-sm`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        {subtitle && <p className={`text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}><TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" /> {subtitle}</p>}
      </div>
    </motion.div>
  );
}

export const TableWrapper = ({ children, delay = 0, title, icon: Icon, action }: any) => {
  const { isDark } = useTheme();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} className={`rounded-xl sm:rounded-[2rem] shadow-lg border overflow-hidden flex flex-col relative group ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-black/30 border-slate-700' : 'bg-white shadow-slate-200/40 border-slate-200'}`}>
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-800/80 to-slate-900' : 'border-slate-100 bg-gradient-to-r from-slate-50/80 to-white'}`}>
         <div className="flex items-center gap-3 flex-1 min-w-0">
            {Icon && <div className={`p-2 rounded-xl shadow-sm border shrink-0 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600' : 'bg-gradient-to-br from-slate-100 to-white border-slate-200'}`}><Icon className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} /></div>}
            <h3 className={`font-extrabold tracking-tight text-base sm:text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
         </div>
         {action && <div className="w-full sm:w-auto">{action}</div>}
      </div>
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        {children}
      </div>
    </motion.div>
  );
};

function ProfileCard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
      className={`rounded-2xl border p-5 flex flex-col gap-3 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
      onClick={() => navigate('/dashboard/profile')}
    >
      <div className={`absolute -right-8 -top-8 w-20 h-20 blur-2xl opacity-20 rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-black border-2 shrink-0 ${isDark ? 'bg-emerald-900/50 text-emerald-400 border-slate-700' : 'bg-emerald-100 text-emerald-600 border-white'}`}>
          {user.profilePicture ? (
            <img src={resolveProfilePic(user.profilePicture)} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            user.name?.charAt(0) || 'U'
          )}
        </div>
        <div className="min-w-0">
          <p className={`font-extrabold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{user.role.replace('_', ' ')}</p>
        </div>
      </div>
      {(user.contactNumber || user.address) && (
        <div className={`pt-3 border-t text-[11px] space-y-1.5 ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
          {user.contactNumber && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 shrink-0" />
              <span className="truncate">{user.contactNumber}</span>
            </div>
          )}
          {user.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{user.address}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function FarmerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState<any>({});
  const [notifications, setNotifications] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    Promise.all([
      api.get('/tickets'),
      api.get('/summary'),
      api.get('/notifications')
    ]).then(([ticketsRes, summaryRes, notifRes]) => {
      const ts = ticketsRes.data.tickets;
      setTickets(ts);

      const grouped = ts.reduce((acc: any, tick: any) => {
        const date = new Date(tick.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if(!acc[date]) acc[date] = { date, earnings: 0, weight: 0 };
        acc[date].earnings += tick.totalValue;
        acc[date].weight += tick.millWeight;
        return acc;
      }, {});
      setChartData(Object.values(grouped).reverse());
      
      setSummary(summaryRes.data);
      setNotifications(notifRes.data.notifications || []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
       <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
     </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[30%] h-[30%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />
      
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4 relative">
        <div className="min-w-0">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3 border w-max ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Status
          </div>
          <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Performance & Payouts</h1>
          <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Track your harvest earnings and delivery history.</p>
        </div>
        <div className="hidden sm:block w-full sm:w-56 lg:w-64 shrink-0">
          <ProfileCard />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
         <StatCard label="Total Earnings" value={formatCurrency(summary.totalValue || 0)} subtitle="Accumulated payouts" icon={DollarSign} colorClass={{bg: 'bg-emerald-100', text: 'text-emerald-700'}} delay={0.1} />
         <StatCard label="Total Delivered" value={formatWeight(summary.totalWeight || 0)} subtitle="Lifetime harvest weight" icon={TruckIcon} colorClass={{bg: 'bg-blue-100', text: 'text-blue-700'}} delay={0.2} />
         <StatCard label="Pending Approval" value={summary.pending || 0} subtitle="Awaiting reconciliation" icon={Clock} colorClass={{bg: 'bg-orange-100', text: 'text-orange-700'}} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start mb-6 sm:mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`lg:col-span-2 rounded-xl sm:rounded-[2rem] border shadow-sm p-4 sm:p-5 lg:p-6 h-[300px] sm:h-[350px] lg:h-[400px] flex flex-col relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-50 pointer-events-none ${isDark ? 'bg-emerald-950/50' : 'bg-emerald-50'}`} />
            <h3 className={`font-extrabold tracking-tight text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 flex items-center gap-2 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Harvest & Earnings Overview</h3>
            <div className="flex-1 w-full h-full min-h-0 relative z-10">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11}} dx={-10} tickFormatter={(val) => `$${val}`} width={50} />
                      <RechartsTooltip cursor={{stroke: isDark ? '#475569' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontFamily: 'monospace' }} formatter={(value: number) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No data available yet.</div>
                )}
           </div>
        </motion.div>

        <div className="lg:col-span-1 h-[300px] sm:h-[350px] lg:h-[400px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden flex flex-col h-full relative ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-black/30 border-slate-700' : 'bg-white shadow-slate-200/50 border-slate-200'}`}>
             <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-700 bg-gradient-to-r from-indigo-950/50 to-slate-900' : 'border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white'}`}>
               <h3 className={`font-extrabold tracking-tight text-sm sm:text-base lg:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Alerts</h3>
               <div className={`p-2 rounded-xl border shadow-sm shrink-0 ${isDark ? 'bg-gradient-to-br from-indigo-900/50 to-indigo-950/50 border-indigo-800 text-indigo-400' : 'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 border-indigo-200'}`}><Bell className="w-4 h-4 sm:w-5 sm:h-5" /></div>
             </div>
             <div className="flex-1 overflow-y-auto p-2">
               {notifications.length > 0 ? notifications.map((n: any) => (
                 <div key={n.id} className={`p-3 sm:p-4 border-b transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'}`}>
                   <p className={`text-[10px] sm:text-xs font-bold mb-1 tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(n.createdAt)}</p>
                   <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{n.message}</p>
                 </div>
               )) : (
                 <div className={`p-8 text-center flex flex-col justify-center items-center h-full ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                   <CheckCircle className={`w-10 h-10 sm:w-12 sm:h-12 mb-4 ${isDark ? 'text-emerald-800' : 'text-emerald-200'}`} />
                   <p className="font-medium">You're all caught up!</p>
                 </div>
               )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <TableWrapper title="Recent Deliveries" icon={FileText} delay={0.6}>
          <table className="w-full text-left text-xs sm:text-sm table-card-view">
            <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Ticket No</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Created</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Updated</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Net Value</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {tickets.map((t: any) => (
                  <tr key={t.id} className={`transition-colors group cursor-default ${isDark ? 'hover:bg-emerald-950/30 hover:text-emerald-400' : 'hover:bg-emerald-50 hover:text-emerald-900'}`}>
                    <td className={`px-4 sm:px-6 py-4 sm:py-5 font-mono text-xs sm:text-sm font-bold group-hover:text-emerald-500 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} data-label="Ticket">{t.ticketNo}</td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5" data-label="Created">{formatDate(t.createdAt)}</td>
                    <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Updated">{formatDate(t.updatedAt)}</td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5" data-label="Status"><StatusBadge status={t.status} /></td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 text-right" data-label="Value"><span className={`px-2 sm:px-3 py-1 font-black rounded-lg border group-hover:scale-105 transition-transform inline-block text-xs sm:text-sm ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-green-100 text-green-800 border-green-200'}`}>{formatCurrency(t.totalValue)}</span></td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 text-center" data-label="Actions">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedTicketId(t.id)} className={`p-2 rounded-xl transition-colors inline-block min-h-[36px] ${isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/30' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-100'}`} title="View Details">
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button onClick={() => {
                          const content = `CaneTrack Statement\nTicket: ${t.ticketNo}\nPlate: ${t.truckPlate}\nStatus: ${t.status}\nMill Wt: ${formatWeight(t.millWeight)}\nValue: ${formatCurrency(t.totalValue)}\nDate: ${new Date(t.createdAt).toLocaleString()}\n\n-- Retain for your records --`;
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
                {tickets.length === 0 && <tr><td colSpan={6} className={`px-6 py-16 sm:py-20 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No deliveries found. Start hauling!</td></tr>}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {selectedTicketId && (
        <TicketDetails ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}
    </div>
  );
}

function TruckIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
}

export function OperatorDashboard() {
  const [form, setForm] = useState({ truckPlate: '', farmId: '', grossWeight: '', tareWeight: '' });
  const [farms, setFarms] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);
  const [view, setView] = useState('ENCODE'); // 'ENCODE' | 'HISTORY'
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const fetchTickets = () => {
     return api.get('/tickets').then(res => {
         const tickets = res.data.tickets;
         setActiveTickets(tickets.filter((t: any) => t.status === 'PENDING' && t.operatorId === user?.userId));
         setHistoryTickets(tickets.filter((t: any) => t.operatorId === user?.userId));
     });
  };

  useEffect(() => { 
    if(!user) return;
    Promise.all([
      api.get('/farms').then(res => setFarms(res.data.farms)),
      fetchTickets()
    ]).then(() => setLoading(false));
  }, [user]);

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-blue-500/30 border-t-blue-400' : 'border-blue-500/30 border-t-blue-500'}`} />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tickets', form);
      toast.success('Ticket encoded successfully.');
      fetchTickets();
      setForm({ truckPlate: '', farmId: '', grossWeight: '', tareWeight: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to encode ticket.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-blue-950/30' : 'bg-blue-50/50'}`} />
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 relative">
        <div className="min-w-0">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3 border w-max ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Weighbridge Active
          </div>
          <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Operator Terminal</h1>
          <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Encode deliveries and manage active tickets.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="hidden sm:block w-56">
            <ProfileCard />
          </div>
          <div className={`flex p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
             <button onClick={() => setView('ENCODE')} className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[36px] ${view==='ENCODE' ? (isDark ? 'bg-slate-700 shadow-sm text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>Encode & Active</button>
             <button onClick={() => setView('HISTORY')} className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[36px] ${view==='HISTORY' ? (isDark ? 'bg-slate-700 shadow-sm text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>Ticket History</button>
          </div>
        </div>
      </div>

      {view === 'ENCODE' && (
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 lg:sticky lg:top-8">
          <form className={`p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-[2rem] border space-y-4 sm:space-y-5 lg:space-y-6 relative overflow-hidden group ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/30' : 'bg-white shadow-xl shadow-slate-200/50 border-slate-200'}`} onSubmit={handleSubmit}>
            <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-blue-500 via-blue-400 to-emerald-400" />
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-50 pointer-events-none ${isDark ? 'bg-blue-950/50' : 'bg-blue-50'}`} />
            <div className={`flex items-center justify-between pb-3 sm:pb-4 ${isDark ? 'border-slate-700' : 'border-slate-100 border-b'}`}>
              <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Encode Ticket</h3>
              <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}><Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /></div>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Truck Plate</label>
                <input required value={form.truckPlate} onChange={e=>setForm({...form, truckPlate: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm sm:text-base font-bold shadow-sm uppercase min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="XYZ-1234" />
              </div>
              <div>
                <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Farm Origin</label>
                <select required value={form.farmId} onChange={e=>setForm({...form, farmId: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm sm:text-base cursor-pointer shadow-sm font-semibold min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                  <option value="" disabled>Select a Farm...</option>
                  {farms.map((f: any) => <option key={f.id} value={f.id}>{f.farmName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross (kg)</label>
                  <input required type="number" value={form.grossWeight} onChange={e=>setForm({...form, grossWeight: e.target.value})} className={`w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm sm:text-base font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="0" />
                </div>
                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tare (kg)</label>
                  <input required type="number" value={form.tareWeight} onChange={e=>setForm({...form, tareWeight: e.target.value})} className={`w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm sm:text-base font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="0" />
                </div>
              </div>
              <div className={`border p-3 sm:p-4 rounded-xl sm:rounded-2xl flex justify-between items-center text-xs sm:text-sm ${isDark ? 'bg-gradient-to-r from-blue-950/50 to-emerald-950/50 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-100'}`}>
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Calculated Mill Weight:</span>
                <span className="font-mono font-black text-base sm:text-lg lg:text-xl text-blue-500">
                  {Math.max(0, (Number(form.grossWeight) || 0) - (Number(form.tareWeight) || 0))} kg
                </span>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-blue-600/30 text-base sm:text-lg min-h-[48px]">
               Issue Ticket
            </motion.button>
          </form>
        </motion.div>

        <div className="lg:col-span-2 relative">
            <TableWrapper title="Active Deliveries (Pending)" icon={Clock} delay={0.2}>
              <table className="w-full text-left text-xs sm:text-sm table-card-view">
                <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <tr>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Ticket</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Truck</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Created</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Mill Weight</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Status</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {activeTickets.map((t: any) => (
                    <tr key={t.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 font-mono text-blue-500 text-xs sm:text-sm font-bold" data-label="Ticket">{t.ticketNo}</td>
                      <td className={`px-4 sm:px-6 py-4 sm:py-5`} data-label="Truck"><span className={`font-mono font-bold rounded-md px-2 py-1 text-xs sm:text-sm ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>{t.truckPlate}</span></td>
                      <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Created">{formatDate(t.createdAt)}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 font-mono text-sm sm:text-base lg:text-lg font-bold" data-label="Weight">{formatWeight(t.millWeight)}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right" data-label="Status"><StatusBadge status={t.status} /></td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-center" data-label="Actions">
                        <div className="flex items-center justify-center gap-1">
                         <button onClick={() => setSelectedTicketId(t.id)} className={`p-2 rounded-xl transition-colors inline-block min-h-[36px] ${isDark ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="View Details">
                           <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                         </button>
                         <button onClick={() => {
                           const content = `CaneTrack Ticket: ${t.ticketNo}\nPlate: ${t.truckPlate}\nGross: ${t.grossWeight}kg\nTare: ${t.tareWeight}kg\nMill Weight: ${t.millWeight}kg\nDate: ${new Date(t.createdAt).toLocaleString()}\n\n-- Keep this receipt --`;
                           const printWindow = window.open('', '', 'width=400,height=600');
                           if(printWindow) {
                             printWindow.document.write(`<pre style="font-family: monospace; font-size: 14px; padding: 20px;">${content}</pre>`);
                             printWindow.document.close();
                             printWindow.focus();
                             printWindow.print();
                             printWindow.close();
                           }
                         }} className={`p-2 rounded-xl transition-colors inline-block min-h-[36px] ${isDark ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Print Receipt">
                           <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                         </button>
                        </div>
                     </td>
                    </tr>
                  ))}
                  {activeTickets.length === 0 && <tr><td colSpan={6} className={`px-6 py-16 sm:py-20 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No active deliveries.</td></tr>}
              </tbody>
             </table>
           </TableWrapper>
        </div>
      </div>
      )}

      {view === 'HISTORY' && (
         <TableWrapper title="Encoding History" icon={Database} delay={0.1}>
              <table className="w-full text-left text-xs sm:text-sm table-card-view">
               <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <tr>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Ticket</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Farm</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Created</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Updated</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Mill Weight</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {historyTickets.map((t: any) => (
                    <tr key={t.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 font-mono text-blue-500 text-xs sm:text-sm font-bold" data-label="Ticket">{t.ticketNo}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-xs sm:text-sm" data-label="Farm">{t.farm?.farmName || '-'}</td>
                      <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Created">{formatDate(t.createdAt)}</td>
                      <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Updated">{formatDate(t.updatedAt)}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 font-mono text-sm sm:text-base font-bold" data-label="Weight">{formatWeight(t.millWeight)}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5" data-label="Status"><StatusBadge status={t.status} /></td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-center" data-label="Actions">
                        <button onClick={() => setSelectedTicketId(t.id)} className={`p-2 rounded-xl transition-colors inline-block min-h-[36px] ${isDark ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="View Details">
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {historyTickets.length === 0 && <tr><td colSpan={7} className={`px-6 py-16 sm:py-20 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No encoding history found.</td></tr>}
              </tbody>
             </table>
         </TableWrapper>
      )}

      {selectedTicketId && (
        <TicketDetails ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const fetchData = async () => {
    api.get('/summary').then(res => {
       setStats(res.data);
       setLoading(false);
    });
  };
  
  useEffect(() => { fetchData(); }, []);

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-purple-500/30 border-t-purple-400' : 'border-purple-500/30 border-t-purple-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[30%] h-[30%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-purple-950/30' : 'bg-purple-50/50'}`} />
      <div className={`absolute bottom-0 left-0 w-[20%] h-[20%] rounded-full blur-[60px] pointer-events-none ${isDark ? 'bg-indigo-950/20' : 'bg-indigo-50/30'}`} />
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 relative">
        <div className="min-w-0">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3 border w-max ${isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
             <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Command Center
          </div>
          <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Global Overview</h1>
          <p className={`mt-1 sm:mt-2 text-sm sm:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time platform analytics and system health metrics.</p>
        </div>
        <div className="hidden sm:block w-56 lg:w-64 shrink-0">
          <ProfileCard />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard label="Platform Transactions" value={formatCurrency(stats.totalValue || 0)} icon={DollarSign} colorClass={{bg: 'bg-emerald-100', text: 'text-emerald-700'}} delay={0.1} />
        <StatCard label="Total Deliveries" value={stats.totalTickets || 0} icon={FileText} colorClass={{bg: 'bg-blue-100', text: 'text-blue-700'}} delay={0.2} />
        <StatCard label="Healthy Syncs" value={stats.reconciled || 0} icon={CheckCircle} colorClass={{bg: 'bg-green-100', text: 'text-green-700'}} delay={0.3} />
        <StatCard label="Active Disputes" value={stats.disputed || 0} icon={AlertTriangle} colorClass={{bg: 'bg-red-100', text: 'text-red-700'}} delay={0.4} />
      </div>

      <div className={`p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] mt-8 sm:mt-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl ${isDark ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white shadow-black/40' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white'}`}>
         <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/20 blur-[80px] sm:blur-[120px] rounded-full mix-blend-screen" />
         <div className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-emerald-500/10 blur-[60px] sm:blur-[80px] rounded-full mix-blend-screen" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-25" />

         <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold">Operations running smoothly?</h2>
            </div>
            <p className="text-slate-400 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 max-w-xl">Monitor tickets in real-time, dispute flagged variances automatically, and provision access to staff using the navigation sidebar.</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-medium">Live Analytics</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs sm:text-sm font-medium">Team Management</span>
              </div>
            </div>
         </div>
         <Database className="w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 text-slate-700 rotate-12 relative z-10 hidden md:block shrink-0" />
      </div>
    </div>
  );
}

export function ReceiverDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [refineryWeight, setRefineryWeight] = useState('');
  const [view, setView] = useState('QUEUE'); // 'QUEUE' | 'HISTORY'
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { isDark } = useTheme();

  const fetchPending = async () => {
    return api.get('/tickets?status=PENDING').then(res => setPending(res.data.tickets));
  };
  const fetchHistory = async () => {
    return api.get('/reconciliation').then(res => setHistory(res.data.records));
  }

  useEffect(() => { 
     Promise.all([fetchPending(), fetchHistory()]).then(() => setLoading(false));
  }, []);

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-orange-500/30 border-t-orange-400' : 'border-orange-500/30 border-t-orange-500'}`} />
    </div>
  );

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/reconciliation/${selectedTicket.id}`, { refineryWeight });
      if (data.flagged) {
        toast.warning(`Discrepancy detected! ${data.difference} kg variance.`);
      } else {
        toast.success('Ticket reconciled successfully.');
      }
      setSelectedTicket(null);
      setRefineryWeight('');
      fetchPending();
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reconcile ticket.');
    }
  };

  const disputedHistory = history.filter((r: any) => r.ticket.status === 'DISPUTED');

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-orange-950/30' : 'bg-orange-50/50'}`} />
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl border shadow-lg text-white shrink-0 ${isDark ? 'bg-gradient-to-br from-orange-600 to-orange-700 border-orange-800 shadow-orange-900/30' : 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-200 shadow-orange-500/20'}`}><Clock className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div className="min-w-0">
            <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Refinery Terminal</h1>
            <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Verify deliveries and reconcile weights.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="hidden sm:block w-56 shrink-0">
            <ProfileCard />
          </div>
          <div className={`flex p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
             <button onClick={() => setView('QUEUE')} className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[36px] ${view==='QUEUE' ? (isDark ? 'bg-slate-700 shadow-sm text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>Incoming Queue</button>
             <button onClick={() => setView('HISTORY')} className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[36px] ${view==='HISTORY' ? (isDark ? 'bg-slate-700 shadow-sm text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>Reconciliation History</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-start">
        <div className={`xl:col-span-3 rounded-xl sm:rounded-[2rem] border p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] relative ${isDark ? 'bg-slate-900/50 border-slate-700 shadow-black/20' : 'bg-slate-50/50 shadow-sm border-slate-200'}`}>
          {view === 'QUEUE' && (

           selectedTicket ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md mx-auto mt-4 border p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-[2rem] shadow-2xl relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-red-400" />
                <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-50 pointer-events-none ${isDark ? 'bg-orange-950/50' : 'bg-orange-50'}`} />
                <div className={`flex items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 ${isDark ? 'border-slate-700' : 'border-slate-100 border-b'}`}>
                   <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Evaluate Ticket</h3>
                   <span className={`font-mono font-black px-3 sm:px-4 py-1.5 rounded-xl border text-xs sm:text-sm ${isDark ? 'text-orange-400 bg-orange-900/30 border-orange-800' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>{selectedTicket.ticketNo}</span>
                </div>
               <form onSubmit={handleReconcile} className="space-y-5 sm:space-y-6 lg:space-y-8">
                 <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 sm:mb-3 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Refinery Received Weight (kg)</label>
                    <input type="number" required autoFocus value={refineryWeight} onChange={e=>setRefineryWeight(e.target.value)} className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-mono text-xl sm:text-2xl font-black shadow-sm min-h-[48px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="Ex: 15400" />
                 </div>

                 <div className={`p-4 sm:p-5 border flex justify-between items-center rounded-xl sm:rounded-2xl gap-2 ${isDark ? 'bg-orange-950/30 border-slate-700' : 'bg-orange-50/50 border-orange-100'}`}>
                    <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Mill Reported Weight:</span>
                    <span className={`font-mono font-black text-lg sm:text-xl lg:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatWeight(selectedTicket.millWeight)}</span>
                 </div>

                   {refineryWeight && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 sm:p-5 border flex justify-between items-center rounded-xl sm:rounded-2xl ${Math.abs(selectedTicket.millWeight - Number(refineryWeight)) > 50 ? (isDark ? 'bg-red-950/30 border-red-900' : 'bg-red-50 border-red-200') : (isDark ? 'bg-emerald-950/30 border-emerald-900' : 'bg-emerald-50 border-emerald-200')}`}>
                       <span className={`text-xs sm:text-sm font-bold ${Math.abs(selectedTicket.millWeight - Number(refineryWeight)) > 50 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>Estimated Variance:</span>
                       <span className={`font-mono font-black text-lg sm:text-xl ${Math.abs(selectedTicket.millWeight - Number(refineryWeight)) > 50 ? (isDark ? 'text-red-300' : 'text-red-700') : (isDark ? 'text-emerald-300' : 'text-emerald-700')}`}>
                         {Math.abs(selectedTicket.millWeight - Number(refineryWeight))} kg
                       </span>
                     </motion.div>
                   )}

                   <div className="flex gap-3 pt-3 sm:pt-4">
                     <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg shadow-orange-600/30 text-sm sm:text-base min-h-[48px]">Verify & Sync</button>
                     <button type="button" onClick={()=>setSelectedTicket(null)} className={`px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-colors min-h-[48px] text-sm sm:text-base ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
                   </div>
               </form>
             </motion.div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                <AnimatePresence>
                  {pending.map((t: any, i: number) => (
                    <motion.div
                      key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                      className={`p-4 sm:p-5 lg:p-6 border rounded-xl sm:rounded-[2rem] hover:shadow-xl cursor-pointer transition-all group flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-orange-800' : 'bg-white border-slate-200 hover:border-orange-300'}`}
                      onClick={()=>setSelectedTicket(t)}
                    >
                       <div>
                         <div className="flex justify-between items-start mb-5 sm:mb-6 lg:mb-8">
                            <div className={`font-mono text-xs sm:text-sm font-bold px-2 sm:px-3 py-1.5 rounded-xl border ${isDark ? 'text-orange-400 bg-orange-900/30 border-orange-800' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>{t.ticketNo}</div>
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 group-hover:bg-orange-900/50 group-hover:text-orange-400' : 'bg-slate-50 border-slate-100 group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
                               <Activity className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isDark ? 'text-slate-500 group-hover:text-orange-400' : 'text-slate-400 group-hover:text-orange-600'}`} />
                            </div>
                         </div>
                         <div className="space-y-1 mb-5 sm:mb-6 lg:mb-8">
                            <div className={`text-[10px] uppercase tracking-widest font-extrabold ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Arriving Truck Plate</div>
                            <div className={`font-mono font-bold text-base sm:text-lg inline-block px-2 sm:px-3 py-1 rounded-lg ${isDark ? 'text-white bg-slate-800' : 'text-slate-900 bg-slate-100'}`}>{t.truckPlate}</div>
                         </div>
                       </div>
                       <div className={`pt-4 sm:pt-5 flex justify-between items-end ${isDark ? 'border-slate-700 border-t' : 'border-slate-100 border-t'}`}>
                          <div className={`text-[10px] uppercase tracking-widest font-extrabold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reported Wt.</div>
                          <div className={`text-2xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatWeight(t.millWeight)}</div>
                       </div>
                    </motion.div>
                  ))}
                  {pending.length === 0 && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`col-span-full py-32 flex flex-col items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                       <div className={`w-24 h-24 shadow-sm border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-sm border-slate-100'}`}><CheckCircle className="w-12 h-12 text-emerald-500" /></div>
                       <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Queue clear.</p>
                       <p className="text-base mt-2 font-medium">No pending tickets awaiting reconciliation.</p>
                     </motion.div>
                  )}
               </AnimatePresence>
             </div>
           )
        )}

        {view === 'HISTORY' && (
           <TableWrapper title="Processed Deliveries" icon={Database} delay={0.1}>
              <table className="w-full text-left text-xs sm:text-sm table-card-view">
                <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
                  <tr>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Ticket</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Reconciled</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Resolved</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-center">Variance (kg)</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {history.map((r: any) => (
                    <tr key={r.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className={`px-4 sm:px-6 py-4 sm:py-5 font-mono font-bold max-w-[120px] sm:max-w-[150px] truncate text-xs sm:text-sm ${isDark ? 'text-orange-400' : 'text-orange-700'}`} data-label="Ticket">{r.ticket.ticketNo}</td>
                      <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Reconciled">{formatDate(r.reconciledAt)}</td>
                      <td className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} data-label="Resolved">{r.resolvedAt ? formatDate(r.resolvedAt) : '-'}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 font-mono text-center" data-label="Variance">
                        <span className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black border inline-flex items-center ${Math.abs(r.difference) > 50 ? (isDark ? 'bg-red-950/30 text-red-400 border-red-900' : 'bg-red-50 text-red-700 border-red-200') : (isDark ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}`}>
                           {r.difference > 0 ? '+' : ''}{r.difference} kg
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5" data-label="Status"><StatusBadge status={r.ticket.status} /></td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-center" data-label="Actions">
                        <button onClick={() => setSelectedTicketId(r.ticket.id)} className={`p-2 rounded-xl transition-colors inline-block min-h-[36px] ${isDark ? 'text-slate-500 hover:text-orange-400 hover:bg-orange-900/30' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`} title="View Details">
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && <tr><td colSpan={6} className={`px-6 py-16 sm:py-20 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No reconciliation history.</td></tr>}
               </tbody>
             </table>
           </TableWrapper>
        )}
        </div>

        <div className="xl:col-span-1">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden flex flex-col h-[400px] sm:h-[500px] ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/30' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
               <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                 <h3 className={`font-extrabold tracking-tight text-sm sm:text-base lg:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Discrepancy Alerts</h3>
                 <div className={`p-2 rounded-xl border shrink-0 ${isDark ? 'bg-red-900/30 text-red-400 border-red-900' : 'bg-red-50 text-red-600 border-red-100'}`}><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /></div>
               </div>
               <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                 {disputedHistory.length > 0 ? disputedHistory.map((r: any) => (
                   <div key={r.id} className={`p-3 sm:p-4 border rounded-xl sm:rounded-2xl transition hover:shadow-md ${isDark ? 'bg-red-950/30 border-red-900' : 'bg-red-50/50 border-red-100'}`}>
                     <div className="flex justify-between items-start mb-2 gap-2">
                        <span className={`font-mono font-bold text-xs sm:text-sm px-2 py-0.5 rounded border ${isDark ? 'text-red-400 bg-slate-900 border-red-900' : 'text-red-600 bg-white border-red-100'}`}>{r.ticket.ticketNo}</span>
                        <span className={`text-[10px] font-bold uppercase shrink-0 ${isDark ? 'text-red-500' : 'text-red-400'}`}>{new Date(r.createdAt).toLocaleDateString()}</span>
                     </div>
                     <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>Variance of <span className="font-bold">{Math.abs(r.difference)} kg</span> ({r.percentDiff.toFixed(2)}%). Flagged for admin review.</p>
                   </div>
                 )) : (
                   <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <CheckCircle className={`w-10 h-10 sm:w-12 sm:h-12 mb-4 ${isDark ? 'text-emerald-800' : 'text-emerald-200'}`} />
                      <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No recent discrepancies!</p>
                   </div>
                   )}
               </div>
            </motion.div>
         </div>
       </div>

      {selectedTicketId && (
        <TicketDetails ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}
     </div>
   );
}
