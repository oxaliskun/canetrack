import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart as BarChartIcon, Download, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

export function AdminReports() {
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    // We'll mock a realistic chart data structure based on the tickets
    // In a real app we'd fetch an aggregated endpoint /api/reports
    api.get('/tickets').then(res => {
      const tickets = res.data.tickets || [];
      const grouped = tickets.reduce((acc: any, t: any) => {
        const date = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if(!acc[date]) acc[date] = { date, tickets: 0, millWeight: 0 };
        acc[date].tickets += 1;
        acc[date].millWeight += t.millWeight;
        return acc;
      }, {});
      setData(Object.values(grouped));
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load reports data');
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-green-950/30' : 'bg-green-50/50'}`} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-100 text-green-700 border-green-200'}`}>
             <BarChartIcon className="w-3.5 h-3.5" /> Analytics
          </div>
          <h1 className={`text-xl sm:text-2xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports & Analytics</h1>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl font-bold shadow-sm border transition-all min-h-[44px] ${isDark ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
           <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Export PDF
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border shadow-sm ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-base sm:text-lg font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Total Deliveries Over Time</h3>
            <div className="h-[250px] sm:h-72 w-full">
               {loading ? <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading...</div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11}} dx={-10} width={60} />
                      <Tooltip cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b' }} />
                      <Bar dataKey="tickets" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border shadow-sm ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-base sm:text-lg font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Processed Mill Weight (kg)</h3>
            <div className="h-[250px] sm:h-72 w-full">
               {loading ? <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading...</div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11}} dx={-10} width={60} />
                      <Tooltip cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b' }} />
                      <Bar dataKey="millWeight" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
         </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl mt-6 sm:mt-8 ${isDark ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800' : 'bg-slate-900'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 mix-blend-screen" />
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-xl sm:text-2xl font-extrabold mb-2">Automated Report Generation</h3>
          <p className="text-slate-400 max-w-lg leading-relaxed text-sm sm:text-base">Schedule monthly recurring financial reports sent directly to management stakeholders, including full variance breakdown and compensation audit logs.</p>
        </div>
        <button className={`relative z-10 mt-4 md:mt-0 px-5 sm:px-6 py-3 rounded-xl font-bold transition-colors shadow-lg min-h-[44px] ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>Configure Schedule</button>
      </motion.div>
    </div>
  );
}
