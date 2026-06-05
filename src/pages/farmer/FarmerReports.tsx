import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart, FileText, DollarSign, Truck as TruckIcon, Leaf, TrendingUp, Sprout, PieChart, Search, Download, Weight, MapPin, Calendar, Eye } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLine, Line, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { formatDate, formatCurrency } from '../../lib/utils';
import { TicketDetails } from '../../components/TicketDetails';
import { toast } from 'sonner';

const tabs = [
  { id: 'deliveries', label: 'Deliveries', icon: FileText },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'expenses', label: 'Expenses', icon: Sprout },
  { id: 'profitloss', label: 'Profit/Loss', icon: TrendingUp },
  { id: 'farms', label: 'Farms', icon: Leaf },
  { id: 'bagon', label: 'Bagon', icon: TruckIcon },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
};

const formatWeight = (kg: number) => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)}t`;
  return `${kg.toFixed(1)} kg`;
};

export function FarmerReports() {
  const [activeTab, setActiveTab] = useState('deliveries');
  const [tickets, setTickets] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [farmExpenses, setFarmExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { isDark } = useTheme();

  const fetchData = async () => {
    try {
      const [ticketsRes, expRes, farmExpRes, catRes, farmsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/expenses'),
        api.get('/farm-expenses'),
        api.get('/expense-categories'),
        api.get('/farms/mine'),
      ]);
      setTickets(ticketsRes.data.tickets || []);
      setExpenses(expRes.data.expenses || []);
      setFarmExpenses(farmExpRes.data.farmExpenses || []);
      setCategories(catRes.data.categories || []);
      setFarms(farmsRes.data.farms || []);
    } catch { toast.error('Failed to load report data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c: any) => { m[c.id] = c.name; });
    return m;
  }, [categories]);

  const farmMap = useMemo(() => {
    const m: Record<string, string> = {};
    farms.forEach((f: any) => { m[f.id] = f.farmName; });
    return m;
  }, [farms]);

  /* ---- Derived data ---- */
  const deliveriesData = useMemo(() => {
    return tickets
      .filter((t: any) =>
        t.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
        (farmMap[t.farmId] || '').toLowerCase().includes(search.toLowerCase())
      )
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, search, farmMap]);

  const monthlyEarnings = useMemo(() => {
    const map: Record<string, any> = {};
    tickets.forEach((t: any) => {
      const m = new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!map[m]) map[m] = { month: m, kg: 0, gross: 0, deductions: 0, net: 0, count: 0 };
      map[m].kg += Number(t.netWeight || 0);
      map[m].count += 1;
      if (t.payment) {
        map[m].gross += Number(t.payment.grossAmount || 0);
        map[m].deductions += Number(t.payment.deductions || 0);
        map[m].net += Number(t.payment.netAmount || 0);
      }
    });
    return Object.values(map).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [tickets]);

  const allExpenses = useMemo(() => [...expenses, ...farmExpenses], [expenses, farmExpenses]);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    allExpenses.forEach((e: any) => {
      const name = catMap[e.categoryId] || 'Unknown';
      map[name] = (map[name] || 0) + Number(e.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allExpenses, catMap]);

  const expensesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    allExpenses.forEach((e: any) => {
      const m = new Date(e.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      map[m] = (map[m] || 0) + Number(e.amount);
    });
    return Object.entries(map).map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [allExpenses]);

  const profitLossData = useMemo(() => {
    const map: Record<string, any> = {};
    tickets.forEach((t: any) => {
      const m = new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!map[m]) map[m] = { month: m, earnings: 0, expenses: 0 };
      if (t.payment) map[m].earnings += Number(t.payment.netAmount || 0);
    });
    allExpenses.forEach((e: any) => {
      const m = new Date(e.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!map[m]) map[m] = { month: m, earnings: 0, expenses: 0 };
      map[m].expenses += Number(e.amount);
    });
    return Object.values(map).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [tickets, allExpenses]);

  const farmsReport = useMemo(() => {
    const map: Record<string, any> = {};
    tickets.forEach((t: any) => {
      const fid = t.farmId;
      if (!map[fid]) map[fid] = { id: fid, name: farmMap[fid] || 'Unknown', kg: 0, earnings: 0, count: 0 };
      map[fid].kg += Number(t.netWeight || 0);
      map[fid].count += 1;
      if (t.payment) map[fid].earnings += Number(t.payment.netAmount || 0);
    });
    return Object.values(map);
  }, [tickets, farmMap]);

  const bagonReport = useMemo(() => {
    const map: Record<string, any> = {};
    tickets.forEach((t: any) => {
      const plate = t.bagon?.plateNumber || 'Unknown';
      if (!map[plate]) map[plate] = { plate, trips: 0, kg: 0, farm: t.farm?.farmName || '' };
      map[plate].trips += 1;
      map[plate].kg += Number(t.netWeight || 0);
    });
    return Object.values(map);
  }, [tickets]);

  const pieColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
            <BarChart className="w-3.5 h-3.5" /> Reports
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Farm Reports</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Analyze your farm performance, earnings, and expenses.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-2 p-1.5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? isDark ? 'bg-emerald-900/50 text-emerald-400 shadow-sm' : 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* === DELIVERIES === */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          <div className={`flex items-center gap-3`}>
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className={`w-full pl-12 pr-5 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                placeholder="Search by quedan # or farm name..." />
            </div>
          </div>

          {deliveriesData.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No deliveries found</p>
            </div>
          ) : (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'} text-xs uppercase tracking-widest font-bold`}>
                      <th className="px-4 sm:px-5 py-4 text-left">Date</th>
                      <th className="px-4 sm:px-5 py-4 text-left">Quedan #</th>
                      <th className="px-4 sm:px-5 py-4 text-left">Farm</th>
                      <th className="px-4 sm:px-5 py-4 text-right">Net KG</th>
                      <th className="px-4 sm:px-5 py-4 text-center">Status</th>
                      <th className="px-4 sm:px-5 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveriesData.map((t: any) => (
                      <tr key={t.id} className={`border-t ${isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <td className="px-4 sm:px-5 py-4 font-medium whitespace-nowrap">{formatDate(t.createdAt)}</td>
                        <td className={`px-4 sm:px-5 py-4 font-mono font-bold text-xs sm:text-sm truncate max-w-[120px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t.ticketNo}</td>
                        <td className="px-4 sm:px-5 py-4 truncate max-w-[120px]">{farmMap[t.farmId] || 'Unknown'}</td>
                        <td className="px-4 sm:px-5 py-4 text-right font-mono font-bold truncate max-w-[100px]">{formatWeight(Number(t.netWeight) || 0)}</td>
                        <td className="px-4 sm:px-5 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusColors[t.status] || 'bg-slate-100 text-slate-700'}`}>{t.status}</span>
                        </td>
                        <td className="px-4 sm:px-5 py-4 text-center">
                          <button onClick={() => setSelectedTicketId(t.id)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === EARNINGS === */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {monthlyEarnings.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <DollarSign className="w-12 h-12 mb-4 opacity-50" />
              <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No earnings data yet</p>
            </div>
          ) : (
            <>
              <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'} text-xs uppercase tracking-widest font-bold`}>
                        <th className="px-4 sm:px-5 py-4 text-left">Month</th>
                        <th className="px-4 sm:px-5 py-4 text-right">Total KG</th>
                        <th className="px-4 sm:px-5 py-4 text-right">Avg Price/kg</th>
                        <th className="px-4 sm:px-5 py-4 text-right">Gross</th>
                        <th className="px-4 sm:px-5 py-4 text-right">Deductions</th>
                        <th className="px-4 sm:px-5 py-4 text-right">Net</th>
                        <th className="px-4 sm:px-5 py-4 text-right">Quedans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyEarnings.map((m: any) => (
                        <tr key={m.month} className={`border-t ${isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <td className="px-4 sm:px-5 py-4 font-bold">{m.month}</td>
                          <td className="px-4 sm:px-5 py-4 text-right font-mono truncate max-w-[100px]">{formatWeight(m.kg)}</td>
                          <td className="px-4 sm:px-5 py-4 text-right font-mono truncate max-w-[100px]">{m.kg > 0 ? formatCurrency(m.gross / m.kg) : '-'}</td>
                          <td className="px-4 sm:px-5 py-4 text-right font-mono truncate max-w-[120px]">{formatCurrency(m.gross)}</td>
                          <td className="px-4 sm:px-5 py-4 text-right font-mono text-red-500 truncate max-w-[120px]">{formatCurrency(m.deductions)}</td>
                          <td className="px-4 sm:px-5 py-4 text-right font-mono font-bold text-emerald-500 truncate max-w-[120px]">{formatCurrency(m.net)}</td>
                          <td className="px-4 sm:px-5 py-4 text-right">{m.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-extrabold text-sm mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Monthly Earnings Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBar data={monthlyEarnings}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="gross" name="Gross" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="net" name="Net" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </RechartsBar>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* === EXPENSES === */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {expensesByCategory.length === 0 && expensesByMonth.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <Sprout className="w-12 h-12 mb-4 opacity-50" />
              <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No expense data yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie chart - by category */}
              <div className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-extrabold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><PieChart className="w-4 h-4" /> By Category</h3>
                {expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {expensesByCategory.map((_: any, i: number) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-[300px] flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No expenses recorded</div>
                )}
              </div>

              {/* Bar chart - by month */}
              <div className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-extrabold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Calendar className="w-4 h-4" /> By Month</h3>
                {expensesByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBar data={expensesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="amount" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </RechartsBar>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-[300px] flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No expenses recorded</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === PROFIT/LOSS === */}
      {activeTab === 'profitloss' && (
        <div className="space-y-6">
          {profitLossData.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
              <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No data available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(() => {
                  const totalEarnings = profitLossData.reduce((s: number, r: any) => s + r.earnings, 0);
                  const totalExpenses = profitLossData.reduce((s: number, r: any) => s + r.expenses, 0);
                  const netProfit = totalEarnings - totalExpenses;
                  return (
                    <>
                      <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Earnings</p>
                        <p className="text-2xl font-black text-emerald-500 mt-1 truncate">{formatCurrency(totalEarnings)}</p>
                      </div>
                      <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Expenses</p>
                        <p className="text-2xl font-black text-red-500 mt-1 truncate">{formatCurrency(totalExpenses)}</p>
                      </div>
                      <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Net Profit</p>
                        <p className={`text-2xl font-black mt-1 truncate ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-extrabold text-sm mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Earnings vs Expenses</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsLine data={profitLossData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" name="Earnings" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                  </RechartsLine>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* === FARMS === */}
      {activeTab === 'farms' && (
        <div className="space-y-6">
          {farmsReport.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <Leaf className="w-12 h-12 mb-4 opacity-50" />
              <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No farm data yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmsReport.map((f: any) => (
                <div key={f.id} className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.farmName}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Deliveries</span>
                      <span className="font-bold">{f.count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total KG</span>
                      <span className="font-mono font-bold">{formatWeight(f.kg)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Earnings</span>
                      <span className="font-mono font-bold text-emerald-500">{formatCurrency(f.earnings)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Avg kg/delivery</span>
                      <span className="font-mono">{f.count > 0 ? formatWeight(f.kg / f.count) : '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === BAGON === */}
      {activeTab === 'bagon' && (
        <div className="space-y-6">
          {bagonReport.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              <TruckIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No bagon data yet</p>
            </div>
          ) : (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'} text-xs uppercase tracking-widest font-bold`}>
                      <th className="px-4 sm:px-5 py-4 text-left">Plate Number</th>
                      <th className="px-4 sm:px-5 py-4 text-left">Farm</th>
                      <th className="px-4 sm:px-5 py-4 text-right">Trips</th>
                      <th className="px-4 sm:px-5 py-4 text-right">Total KG</th>
                      <th className="px-4 sm:px-5 py-4 text-right">Avg kg/trip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bagonReport.map((t: any) => (
                      <tr key={t.plate} className={`border-t ${isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <td className="px-4 sm:px-5 py-4 font-mono font-bold truncate max-w-[120px]">{t.plate}</td>
                        <td className={`px-4 sm:px-5 py-4 truncate max-w-[120px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.farm}</td>
                        <td className="px-4 sm:px-5 py-4 text-right font-bold">{t.trips}</td>
                        <td className="px-4 sm:px-5 py-4 text-right font-mono font-bold truncate max-w-[100px]">{formatWeight(t.kg)}</td>
                        <td className="px-4 sm:px-5 py-4 text-right font-mono truncate max-w-[100px]">{t.trips > 0 ? formatWeight(t.kg / t.trips) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTicketId && <TicketDetails ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />}
    </div>
  );
}
