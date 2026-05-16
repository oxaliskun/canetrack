import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Save, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axiosInstance';
import { toast } from 'sonner';

export function Profile() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if(passwords.new !== passwords.confirm) {
       toast.error("New passwords do not match.");
       return;
    }
    try {
      await api.patch(`/users/${user.userId}/password`, { password: passwords.new });
      toast.success("Password updated successfully.");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />
      
      <div className="flex flex-col mb-4 relative">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border w-max ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
           <User className="w-3.5 h-3.5" /> Identity
        </div>
        <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2rem] border shadow-xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             <div className={`p-8 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex items-center gap-6">
                   <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-sm ${isDark ? 'bg-emerald-900/50 text-emerald-400 border-slate-700' : 'bg-emerald-100 text-emerald-600 border-white'}`}>
                     {user?.name?.charAt(0) || 'U'}
                   </div>
                   <div>
                      <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</h2>
                      <p className={`font-mono text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                      <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                        <ShieldCheck className="w-3 h-3" /> {user?.role.replace('_', ' ')}
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="p-8">
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Lock className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /> Security Settings</h3>
                
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className={`block text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>New Password</label>
                        <input 
                          type="password" required 
                          value={passwords.new} onChange={e=>setPasswords({...passwords, new: e.target.value})}
                          className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                     </div>
                     <div>
                        <label className={`block text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Confirm New Password</label>
                        <input 
                          type="password" required 
                          value={passwords.confirm} onChange={e=>setPasswords({...passwords, confirm: e.target.value})}
                          className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                     </div>
                   </div>
                   
                   <div className="flex justify-end pt-4">
                      <button type="submit" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}>
                         <Save className="w-4 h-4" /> Update Password
                      </button>
                   </div>
                </form>
             </div>
          </motion.div>
        </div>

        <div className="md:col-span-1">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-[2rem] border shadow-xl overflow-hidden h-full flex flex-col ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex items-center gap-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                 <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Activity className="w-5 h-5" />
                 </div>
                 <h3 className={`font-extrabold tracking-tight text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Activity Logs</h3>
              </div>
              <div className={`p-6 flex-1 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                 <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {/* Mock Activity Logs */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border relative z-10 font-black text-[10px] ${isDark ? 'border-slate-700 bg-slate-700 text-slate-400' : 'border-white bg-slate-200 text-slate-500'}`}>
                           1
                        </div>
                        <div className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                           <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Logged In</p>
                           <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Just now</p>
                        </div>
                    </div>
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border relative z-10 font-black text-[10px] ${isDark ? 'border-slate-700 bg-emerald-900/50 text-emerald-400' : 'border-white bg-emerald-100 text-emerald-500'}`}>
                           2
                        </div>
                        <div className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                           <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Viewed Dashboard</p>
                           <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>5 mins ago</p>
                        </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
