import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sprout, Search, TrendingUp, FileText } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { formatDate, formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export function FarmerExpenses() {
  const [deliveryExpenses, setDeliveryExpenses] = useState<any[]>([]);
  const [farmExpenses, setFarmExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  const fetchData = async () => {
    try {
      const [delRes, farmRes, catRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/farm-expenses'),
        api.get('/expense-categories'),
      ]);
      setDeliveryExpenses(delRes.data.expenses || []);
      setFarmExpenses(farmRes.data.farmExpenses || []);
      setCategories(catRes.data.categories || []);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c: any) => { m[c.id] = c.name; });
    return m;
  }, [categories]);

  const unified = useMemo(() => {
    const delivery = deliveryExpenses.map((e: any) => ({
      id: e.id,
      date: e.createdAt,
      type: 'DELIVERY' as const,
      categoryId: e.categoryId,
      amount: Number(e.amount),
      notes: e.notes || '',
      receipt: e.receipt || null,
    }));
    const farm = farmExpenses.map((e: any) => ({
      id: e.id,
      date: e.createdAt,
      type: 'FARM' as const,
      categoryId: e.categoryId,
      amount: Number(e.amount),
      notes: e.notes || '',
      receipt: e.receipt || null,
    }));
    return [...delivery, ...farm].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [deliveryExpenses, farmExpenses]);

  const filtered = unified.filter((e: any) => {
    const q = search.toLowerCase();
    return (catMap[e.categoryId] || '').toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q);
  });

  const totalExpenses = filtered.reduce((s: number, e: any) => s + e.amount, 0);
  const deliveryTotal = filtered
    .filter((e: any) => e.type === 'DELIVERY')
    .reduce((s: number, e: any) => s + e.amount, 0);
  const farmTotal = filtered
    .filter((e: any) => e.type === 'FARM')
    .reduce((s: number, e: any) => s + e.amount, 0);

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
            <Sprout className="w-3.5 h-3.5" /> Expenses
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Expenses</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track all your delivery and farm expenses in one place.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-red-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Expenses</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-red-100 text-red-700`}><TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalExpenses)}</p>
          <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{filtered.length} expenses</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-blue-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Delivery Expenses</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-blue-100 text-blue-700`}><FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(deliveryTotal)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-emerald-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Farm Expenses</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-emerald-100 text-emerald-700`}><Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(farmTotal)}</p>
        </motion.div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="Search by category or notes..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col items-center justify-center py-16 sm:py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <div className={`w-24 h-24 shadow-sm border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <Sprout className="w-12 h-12 text-emerald-500" />
          </div>
          <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No expenses found</p>
          <p className="text-base mt-2 font-medium">Expenses will appear here once recorded.</p>
        </motion.div>
      ) : (
        <div className={`rounded-2xl border overflow-x-auto ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Date</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Type</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Category</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Amount</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Notes</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {filtered.map((e: any) => (
                <tr key={`${e.type}-${e.id}`} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-xs">{formatDate(e.date)}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${e.type === 'DELIVERY'
                      ? isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200'
                      : isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className={`px-4 sm:px-6 py-4 sm:py-5 truncate max-w-[100px] sm:max-w-[160px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{catMap[e.categoryId] || 'Unknown'}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono font-bold truncate max-w-[120px]">{formatCurrency(e.amount)}</td>
                  <td className={`px-4 sm:px-6 py-4 sm:py-5 max-w-[200px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{e.notes || '-'}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                    {e.receipt ? (
                      <a href={e.receipt} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all ${isDark ? 'text-emerald-400 border-emerald-800 hover:bg-emerald-950/50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                        <FileText className="w-3.5 h-3.5" /> View
                      </a>
                    ) : (
                      <span className={`text-[10px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
