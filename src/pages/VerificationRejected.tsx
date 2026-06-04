import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import api from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { Leaf, XCircle, Upload, Loader2 } from 'lucide-react';

export function VerificationRejected() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { user, login } = useAuth();
  const reason = (location.state as any)?.reason || user?.rejectionReason || 'Your documents did not meet the requirements.';
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleResubmit = async () => {
    if (!idFile) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', idFile);
      const upRes = await api.post('/upload', fd);
      await api.post('/auth/resubmit-verification', { idImageUrl: upRes.data.url });
      if (user) login('', { ...user, verificationStatus: 'PENDING', rejectionReason: undefined });
      setDone(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Resubmission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md w-full rounded-3xl p-8 border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-emerald-100 dark:bg-emerald-900/30">
            <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className={`text-xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Resubmitted Successfully</h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your documents are under review again.</p>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/pending-verification')} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/30 shadow-lg">
            Go to Pending Verification
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md w-full rounded-3xl p-8 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-red-100 dark:bg-red-900/30">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="inline-flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <span className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>CaneTrack</span>
          </div>
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Verification Not Approved</h2>
        </div>

        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-bold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Reason:</p>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{reason}</p>
          </div>

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upload New Valid ID</label>
            <input type="file" accept="image/*"
              className={`w-full py-2.5 px-4 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-500 file:text-white hover:file:bg-emerald-400 min-h-[44px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) { setIdFile(file); setIdPreview(URL.createObjectURL(file)); }
              }} />
            {idPreview && (
              <div className="mt-2 flex items-center gap-2">
                <img src={idPreview} alt="" className="h-10 w-16 object-cover rounded-lg border border-slate-700" />
                <button type="button" onClick={() => { setIdFile(null); setIdPreview(''); }} className="text-xs text-red-400 font-bold">Remove</button>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleResubmit}
            disabled={!idFile || submitting}
            className={`w-full flex justify-center items-center py-3.5 rounded-xl font-bold transition-all shadow-lg ${!idFile || submitting ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/30'}`}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resubmit for Verification'}
          </motion.button>

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/login')} className="w-full py-3.5 rounded-xl font-bold border transition-all min-h-[44px] ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}">
            Back to Sign In
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}