import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import api from '../api/axiosInstance';
import { formatWeight, formatCurrency } from '../lib/utils';
import { DollarSign, TrendingUp, Wallet, Weight, Sprout, AlertTriangle, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';

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
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
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

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ kg: 0, earnings: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const isUnverified = user?.verificationStatus === 'UNVERIFIED';

  const fetchData = () => {
    Promise.all([
      api.get('/tickets'),
      api.get('/expenses'),
      api.get('/farm-expenses')
    ]).then(([ticketsRes, expRes, farmExpRes]) => {
      const ts = ticketsRes.data.tickets;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthTickets = ts.filter((t: any) => new Date(t.createdAt) >= monthStart);
      const monthlyKg = monthTickets.reduce((s: number, t: any) => s + Number(t.netWeight || 0), 0);
      const monthlyEarnings = monthTickets
        .filter((t: any) => t.payment)
        .reduce((s: number, t: any) => s + Number(t.payment.netAmount || 0), 0);
      const deliveryExp = expRes.data.expenses
        .filter((e: any) => new Date(e.createdAt) >= monthStart)
        .reduce((s: number, e: any) => s + Number(e.amount), 0);
      const farmExp = farmExpRes.data.farmExpenses
        .filter((e: any) => new Date(e.createdAt) >= monthStart)
        .reduce((s: number, e: any) => s + Number(e.amount), 0);
      const monthlyExpenses = deliveryExp + farmExp;

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

      {isUnverified && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 sm:p-6 rounded-2xl border-2 flex items-start gap-4 ${isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>Your account is unverified</h3>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-amber-300/70' : 'text-amber-700/70'}`}>Upload your documents in Profile to unlock Farms, Bagons, Quedans, and more.</p>
            <button onClick={() => navigate('/dashboard/profile')} className={`mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[36px] ${isDark ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-amber-600 text-white hover:bg-amber-500'}`}>
              Go to Profile <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3 border w-max ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Overview
        </div>
        <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Dashboard</h1>
        <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Monthly performance and earnings overview.</p>
      </motion.div>

      {!isUnverified && (
        <>
          <div className="mb-2">
            <h3 className={`text-sm font-bold tracking-wide uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              This Month
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <StatCard label="Total KG Delivered" value={formatWeight(monthlyStats.kg)} subtitle="Delivered this month" icon={Weight} colorClass={{bg: 'bg-violet-100', text: 'text-violet-700'}} delay={0.1} />
            <StatCard label="Total Earnings" value={formatCurrency(monthlyStats.earnings)} subtitle="Paid this month" icon={Wallet} colorClass={{bg: 'bg-emerald-100', text: 'text-emerald-700'}} delay={0.15} />
            <StatCard label="Total Expenses" value={formatCurrency(monthlyStats.expenses)} subtitle="Farm + delivery costs" icon={Sprout} colorClass={{bg: 'bg-red-100', text: 'text-red-700'}} delay={0.2} />
            <StatCard label="Net Profit" value={formatCurrency(monthlyStats.profit)} subtitle={monthlyStats.profit >= 0 ? 'Positive' : 'Negative'} icon={TrendingUp} colorClass={{bg: monthlyStats.profit >= 0 ? 'bg-emerald-100' : 'bg-red-100', text: monthlyStats.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}} delay={0.25} />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`rounded-xl sm:rounded-[2rem] border shadow-sm p-4 sm:p-5 lg:p-6 h-[300px] sm:h-[350px] lg:h-[400px] flex flex-col relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-50 pointer-events-none ${isDark ? 'bg-emerald-950/50' : 'bg-emerald-50'}`} />
            <h3 className={`font-extrabold tracking-tight text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 flex items-center gap-2 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Earnings Overview</h3>
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
        </>
      )}
    </div>
  );
}
