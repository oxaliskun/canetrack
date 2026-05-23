import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Save, AlertTriangle, Bell, Moon, Sun } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

export function Settings() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({ varianceThreshold: 50, basePricePerKg: 2.50 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({ emailAlerts: true, pushAlerts: false });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/settings').then(res => {
         if (res.data.settings) setSettings(res.data.settings);
         setLoading(false);
      }).catch(() => {
         toast.error("Failed to load settings");
         setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSaveAppPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('App preferences saved locally.');
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings', settings);
      toast.success('System settings updated globally.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to apply updates.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
     </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col mb-4">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 border w-max ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
             <SettingsIcon className="w-3.5 h-3.5" /> Configuration
          </div>
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Dark Mode Toggle Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden relative ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
          <div className="p-4 sm:p-6 lg:p-8">
            <h3 className={`font-extrabold text-base sm:text-lg lg:text-xl mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isDark ? <Moon className="w-5 h-5 text-emerald-400" /> : <Sun className="w-5 h-5 text-amber-500" />} 
              Appearance
            </h3>
            <p className={`text-sm font-medium mb-4 sm:mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choose your preferred display theme.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => isDark && toggleTheme()}
                className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${!isDark ? 'border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10' : isDark ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 ${!isDark ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Light Mode</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Clean and bright</p>
              </button>
              
              <button 
                onClick={() => !isDark && toggleTheme()}
                className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${isDark ? 'border-emerald-500 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-emerald-500/20' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'}`}>
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Dark Mode</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Emerald dark theme</p>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Personal Preferences (All Users) */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          onSubmit={handleSaveAppPreferences}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <h3 className={`font-extrabold text-base sm:text-lg lg:text-xl mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Bell className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} /> App Preferences
            </h3>
            <p className={`text-sm font-medium mb-6 sm:mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Personalize your notification and display settings.</p>
            
            <div className="space-y-4 sm:space-y-6">
               <div className={`flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="min-w-0 flex-1 pr-3">
                     <h4 className={`font-bold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Notifications</h4>
                     <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Receive daily summaries and critical alerts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={preferences.emailAlerts} onChange={e => setPreferences({...preferences, emailAlerts: e.target.checked})} />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
               </div>
               
               <div className={`flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="min-w-0 flex-1 pr-3">
                     <h4 className={`font-bold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Push Alerts</h4>
                     <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Instant browser notifications for ticket updates.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={preferences.pushAlerts} onChange={e => setPreferences({...preferences, pushAlerts: e.target.checked})} />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
               </div>
               
               <div className="pt-3 sm:pt-4 flex justify-end">
                  <button type="submit" className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold transition-all min-h-[44px] ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                     <Save className="w-4 h-4" /> Save Preferences
                  </button>
               </div>
            </div>
          </div>
        </motion.form>

        {/* Admin Global Settings */}
        {user?.role === 'ADMIN' && (
          <motion.form 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden relative ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            onSubmit={handleSaveAdmin}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500" />
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
               <div>
                 <h3 className={`font-extrabold text-base sm:text-lg lg:text-xl mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                   <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} /> Global Trade Parameters
                 </h3>
                 <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Configure rules that apply out of the box to brand new tickets and system automation.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                     <label className={`block text-sm font-extrabold mb-2 ${isDark ? 'text-emerald-400' : 'text-slate-700'}`}>Base Price (₱/kg)</label>
                     <p className={`text-xs mb-4 font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Standard compensation rate for net mill weights.</p>
                     <div className="relative">
                        <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>₱</span>
                        <input 
                          type="number" step="0.01" required
                          value={settings.basePricePerKg} 
                          onChange={e => setSettings({...settings, basePricePerKg: parseFloat(e.target.value)})}
                          className={`w-full pl-8 pr-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:ring-4 outline-none transition-all font-mono font-bold text-base sm:text-lg min-h-[44px] ${isDark ? 'bg-slate-900 border-slate-600 text-white focus:ring-emerald-500/20 focus:border-emerald-500' : 'bg-white border-slate-200 focus:ring-slate-500/10 focus:border-slate-500'}`}
                        />
                     </div>
                  </div>

                  <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${isDark ? 'bg-amber-950/20 border-amber-900/50' : 'bg-orange-50/50 border-orange-100'}`}>
                     <label className={`block text-sm font-extrabold mb-2 flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-orange-900'}`}>Variance Threshold (kg)</label>
                     <p className={`text-xs mb-4 font-medium ${isDark ? 'text-amber-600/60' : 'text-orange-600/80'}`}>Tolerance limit before a reconciliation is flagged as DISPUTED.</p>
                     <div className="relative">
                        <input 
                          type="number" required
                          value={settings.varianceThreshold}
                          onChange={e => setSettings({...settings, varianceThreshold: parseFloat(e.target.value)})}
                          className={`w-full px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:ring-4 outline-none transition-all font-mono font-bold text-base sm:text-lg min-h-[44px] ${isDark ? 'bg-slate-900 border-amber-800/50 text-amber-400 focus:ring-amber-500/20 focus:border-amber-500' : 'bg-white border-orange-200 focus:ring-orange-500/10 focus:border-orange-500 text-orange-900'}`}
                        />
                        <span className={`absolute right-5 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-amber-700' : 'text-orange-300'}`}>kg</span>
                     </div>
                  </div>
               </div>
               
               <div className="pt-4 sm:pt-6 border-t border-slate-700/50 flex justify-end">
                  <button 
                     type="submit" 
                     disabled={saving}
                     className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 min-h-[44px]"
                  >
                     <Save className="w-5 h-5" /> {saving ? 'Applying...' : 'Save Global Config'}
                  </button>
               </div>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
