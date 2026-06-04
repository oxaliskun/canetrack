import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { Leaf, Clock, XCircle, Mail } from 'lucide-react';

export function PendingVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const isRejected = (location.state as any)?.rejected;
  const rejectionReason = (location.state as any)?.reason;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md w-full rounded-3xl p-8 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isRejected ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            {isRejected ? <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" /> : <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
          </div>
          <div className="inline-flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <span className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>CaneTrack</span>
          </div>
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isRejected ? 'Verification Not Approved' : 'Verification Pending'}
          </h2>
        </div>

        {isRejected ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-bold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Reason:</p>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{rejectionReason || 'Your documents did not meet the requirements.'}</p>
            </div>
            <p className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              You can upload new documents and resubmit for verification.
            </p>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/login')} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/30 shadow-lg">
              Back to Sign In
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-900/30' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Your account is pending review. An administrator will verify your documents and approve your account.
              </p>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Mail className="w-5 h-5 text-slate-500 shrink-0" />
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                You'll receive an email once your account is approved.
              </p>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/login')} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/30 shadow-lg">
              Back to Sign In
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}