import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Save, Bell } from 'lucide-react';
import { toast } from 'sonner';

export function Settings() {
  const [preferences, setPreferences] = useState({ emailAlerts: true, pushAlerts: false });

  const handleSaveAppPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('App preferences saved locally.');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 border w-max bg-slate-200 text-slate-700 border-slate-300">
             <SettingsIcon className="w-3.5 h-3.5" /> Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* App Preferences */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl sm:rounded-[2rem] border shadow-xl overflow-hidden bg-white border-slate-200"
          onSubmit={handleSaveAppPreferences}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <h3 className="font-extrabold text-base sm:text-lg lg:text-xl mb-1 flex items-center gap-2 text-slate-900">
              <Bell className="w-5 h-5 text-emerald-500" /> App Preferences
            </h3>
            <p className="text-sm font-medium mb-6 sm:mb-8 text-slate-500">Personalize your notification settings.</p>
            
            <div className="space-y-4 sm:space-y-6">
               <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 border-slate-200">
                  <div className="min-w-0 flex-1 pr-3">
                     <h4 className="font-bold text-sm sm:text-base truncate text-slate-900">Email Notifications</h4>
                     <p className="text-xs text-slate-500">Receive daily summaries and critical alerts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={preferences.emailAlerts} onChange={e => setPreferences({...preferences, emailAlerts: e.target.checked})} />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
               </div>
               
               <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 border-slate-200">
                  <div className="min-w-0 flex-1 pr-3">
                     <h4 className="font-bold text-sm sm:text-base truncate text-slate-900">Push Alerts</h4>
                     <p className="text-xs text-slate-500">Instant browser notifications for ticket updates.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={preferences.pushAlerts} onChange={e => setPreferences({...preferences, pushAlerts: e.target.checked})} />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
               </div>
               
               <div className="pt-3 sm:pt-4 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold transition-all min-h-[44px] bg-slate-100 text-slate-700 hover:bg-slate-200">
                     <Save className="w-4 h-4" /> Save Preferences
                  </button>
               </div>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
