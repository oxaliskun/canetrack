import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { formatWeight, formatDate, formatCurrency, resolveProfilePic } from '../lib/utils';
import { FileText, Clock, DollarSign, Plus, TrendingUp, Download, Sprout, Phone, MapPin, Eye, Wallet, Weight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge } from '../components/StatusBadge';
import { TicketDetails } from '../components/TicketDetails';
import { QuedanForm } from '../components/QuedanForm';

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
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Farmer</p>
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

export function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ kg: 0, earnings: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { isDark } = useTheme();

  const fetchData = () => {
    Promise.all([
      api.get('/tickets'),
      api.get('/expenses')
    ]).then(([ticketsRes, expRes]) => {
      const ts = ticketsRes.data.tickets;
      setTickets(ts);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthTickets = ts.filter((t: any) => new Date(t.createdAt) >= monthStart);
      const monthlyKg = monthTickets.reduce((s: number, t: any) => s + Number(t.netWeight || 0), 0);
      const monthlyEarnings = monthTickets
        .filter((t: any) => t.payment)
        .reduce((s: number, t: any) => s + Number(t.payment.netAmount || 0), 0);
      const monthlyExpenses = expRes.data.expenses
        .filter((e: any) => new Date(e.createdAt) >= monthStart)
        .reduce((s: number, e: any) => s + Number(e.amount), 0);

      setMonthlyStats({ kg: monthlyKg, earnings: monthlyEarnings, expenses: monthlyExpenses, profit: monthlyEarnings - monthlyExpenses });

      const grouped = ts.reduce((acc: any, tick: any) => {
        const date = new Date(tick.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if(!acc[date]) acc[date] = { date, earnings: 0, weight: 0 };
        acc[date].earnings += tick.payment?.netAmount || 0;
        acc[date].weight += tick.netWeight || 0;
        return acc;
      }, {});
      setChartData(Object.values(grouped).reverse());
      
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
       <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
     </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
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
        <button onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
            showCreateForm
              ? isDark ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-emerald-500 text-white hover:bg-emerald-400'
          }`}
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'New Quedan'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
         <StatCard label="Monthly Earnings" value={formatCurrency(monthlyStats.earnings)} subtitle="Accumulated payouts" icon={DollarSign} colorClass={{bg: 'bg-emerald-100', text: 'text-emerald-700'}} delay={0.1} />
         <StatCard label="Total Deliveries" value={tickets.length} subtitle="All time quedans" icon={FileText} colorClass={{bg: 'bg-blue-100', text: 'text-blue-700'}} delay={0.2} />
         <StatCard label="Pending Tickets" value={tickets.filter((t: any) => t.status === 'PENDING').length} subtitle="Awaiting processing" icon={Clock} colorClass={{bg: 'bg-orange-100', text: 'text-orange-700'}} delay={0.3} />
      </div>

      <div className="mb-2">
        <h3 className={`text-sm font-bold tracking-wide uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          This Month
        </h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <StatCard label="Total KG" value={formatWeight(monthlyStats.kg)} subtitle="Delivered this month" icon={Weight} colorClass={{bg: 'bg-violet-100', text: 'text-violet-700'}} delay={0.1} />
        <StatCard label="Earnings" value={formatCurrency(monthlyStats.earnings)} subtitle="Paid this month" icon={Wallet} colorClass={{bg: 'bg-emerald-100', text: 'text-emerald-700'}} delay={0.15} />
        <StatCard label="Expenses" value={formatCurrency(monthlyStats.expenses)} subtitle="This month" icon={Sprout} colorClass={{bg: 'bg-red-100', text: 'text-red-700'}} delay={0.2} />
        <StatCard label="Net Profit" value={formatCurrency(monthlyStats.profit)} subtitle={monthlyStats.profit >= 0 ? 'Positive' : 'Negative'} icon={TrendingUp} colorClass={{bg: monthlyStats.profit >= 0 ? 'bg-emerald-100' : 'bg-red-100', text: monthlyStats.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}} delay={0.25} />
      </div>

      {showCreateForm && (
        <div className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-extrabold text-base mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Plus className="w-5 h-5 text-emerald-500" /> New Quedan
          </h3>
          <QuedanForm onSuccess={() => { setShowCreateForm(false); fetchData(); }} />
        </div>
      )}

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
             <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-700 bg-gradient-to-r from-emerald-950/50 to-slate-900' : 'border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white'}`}>
               <h3 className={`font-extrabold tracking-tight text-sm sm:text-base lg:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h3>
               <div className={`p-2 rounded-xl border shadow-sm shrink-0 ${isDark ? 'bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-emerald-800 text-emerald-400' : 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 border-emerald-200'}`}><Plus className="w-4 h-4 sm:w-5 sm:h-5" /></div>
             </div>
             <div className="flex-1 flex flex-col gap-2 p-4">
               <button onClick={() => setShowCreateForm(true)} className={`w-full p-4 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}>
                 <FileText className="w-4 h-4 inline-block mr-2" /> Create New Quedan
               </button>
             </div>
          </motion.div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <TableWrapper title="Recent Deliveries" icon={FileText} delay={0.6}>
          <table className="w-full text-left text-xs sm:text-sm table-card-view">
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
              {tickets.map((t: any) => (
                  <tr key={t.id} className={`transition-colors group cursor-default ${isDark ? 'hover:bg-emerald-950/30 hover:text-emerald-400' : 'hover:bg-emerald-50 hover:text-emerald-900'}`}>
                    <td className={`px-4 sm:px-6 py-4 sm:py-5 font-mono text-xs sm:text-sm font-bold group-hover:text-emerald-500 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} data-label="Quedan">{t.ticketNo}</td>
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
                {tickets.length === 0 && <tr><td colSpan={7} className={`px-6 py-16 sm:py-20 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No deliveries found. Start hauling!</td></tr>}
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
