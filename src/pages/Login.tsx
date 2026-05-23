import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Leaf, Loader2, Mail, Lock, User, CheckCircle2, Shield, Sprout, Truck, BarChart3, Moon, Sun } from 'lucide-react';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isDark, toggleTheme } = useTheme();
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isRegistering) {
        await api.post('/auth/register', { name, email, password });
        setSuccess('Account created! Sign in to view your earnings.');
        setIsRegistering(false); setPassword('');
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        login(data.token, data.user);
        const roleMap: Record<string, string> = {
          FARMER: '/dashboard/farmer', OPERATOR: '/dashboard/operator',
          RECEIVER: '/dashboard/receiver', ADMIN: '/dashboard/admin'
        };
        navigate(roleMap[data.user.role]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex relative overflow-hidden font-sans selection:bg-emerald-200 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-800'}`}>
      {/* Decorative Background Elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-100/60'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none ${isDark ? 'bg-blue-950/30' : 'bg-blue-100/40'}`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/20' : 'bg-emerald-50/30'}`} />
      
      {/* Background image overlay */}
      <div className={`absolute inset-0 pointer-events-none ${isDark ? 'opacity-20' : 'opacity-15'}`}>
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
      </div>

      {/* Left Visual Panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between overflow-hidden m-4 rounded-[2rem] shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1592982537447-6f29e160a3bb?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center transition-transform duration-[20s] hover:scale-110"></div>
        <div className={`absolute inset-0 mix-blend-multiply ${isDark ? 'bg-gradient-to-t from-black/95 via-emerald-950/70 to-black/50' : 'bg-gradient-to-t from-emerald-950/90 via-emerald-900/60 to-black/30'}`}></div>
        
        {/* Top Logo */}
        <div className="relative z-10 p-12">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-xl">
            <Leaf className="w-8 h-8 text-emerald-400 drop-shadow-md" />
            <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">CaneTrack</span>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 p-12 pb-16 max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Trusted by 500+ Farmers
            </span>
            <h1 className="text-5xl font-extrabold mb-6 text-white leading-[1.1] drop-shadow-lg">
              Manage your harvest.<br/>
              <span className="text-emerald-300">Track your payout.</span>
            </h1>
            <p className="text-lg text-emerald-50 leading-relaxed drop-shadow">
              A transparent, friendly, and secure platform ensuring you get paid accurately for every kilogram of sugarcane you deliver.
            </p>
          </motion.div>
          
          {/* Feature badges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white font-medium">Secure Platform</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white font-medium">Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white font-medium">Delivery Tracking</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex justify-center py-12 px-6 sm:px-12 relative xl:px-24">
        <div className="absolute top-4 right-4 sm:top-8 sm:right-12 flex items-center gap-2 sm:gap-3">
          <button 
            onClick={toggleTheme}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all shadow-lg flex items-center justify-center ${isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 shadow-black/30' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-slate-200/50'}`}
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <button onClick={() => navigate('/')} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${isDark ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 shadow-black/30' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-slate-200/50'}`}>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back
          </button>
        </div>

        <div className="max-w-[420px] w-full flex flex-col justify-center mt-16 sm:mt-12 lg:mt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 sm:space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:hidden mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 sm:p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isRegistering ? 'Start right now.' : 'Welcome back.'}
              </h2>
              <p className={`mt-2 sm:mt-3 text-sm sm:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isRegistering ? "Create your client account to track your earnings." : "Sign into your account to view your deliveries."}
              </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {error && <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-red-950/30 text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-900/50 flex items-start gap-3">
                  <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-red-500" /></div>
                  {error}
                </motion.div>}
                {success && <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-emerald-950/30 text-emerald-400 p-4 rounded-2xl text-sm font-bold border border-emerald-800/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  {success}
                </motion.div>}
              </AnimatePresence>

              <div className="space-y-4">
                <AnimatePresence>
                  {isRegistering && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pb-4">
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Full Name</label>
                        <div className="relative">
                          <input type="text" required={isRegistering} className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" />
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Email address</label>
                  <div className="relative">
                    <input type="email" required className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1 pr-1">
                     <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Password</label>
                     {!isRegistering && <a href="#" className="text-xs font-bold text-emerald-500 hover:text-emerald-400">Forgot?</a>}
                  </div>
                  <div className="relative">
                    <input type="password" required className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium tracking-widest ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900 text-lg'}`} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }} 
                whileTap={{ scale: 0.98 }} 
                type="submit" 
                disabled={loading} 
                className="w-full flex justify-center items-center py-4 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-600/30 mt-6"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Create Client Account' : 'Sign In securely')}
              </motion.button>
            </form>

            <div className="text-center mt-8">
               <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                 {isRegistering ? "Already a client?" : "Are you a new farmer/client?"}{' '}
                 <button onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }} className="text-emerald-500 hover:text-emerald-400 font-bold ml-1 transition-colors underline decoration-2 underline-offset-4 decoration-emerald-800">
                   {isRegistering ? "Sign in instead" : "Create Account"}
                 </button>
               </p>
            </div>
            
            <div className={`mt-8 sm:mt-12 rounded-2xl p-4 sm:p-5 relative overflow-hidden border ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Staff & Administration</h4>
                <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Operator</span> and <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Receiver</span> accounts cannot be created here. They must be provisioned internally by an Administrator.
                </p>
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                   <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Demo Credentials</h4>
                   <ul className="text-xs font-mono space-y-1 text-slate-500">
<li>Admin: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>admin@canetrack.com</span> / canetrack2026</li>
                      <li>Operator: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>operator@canetrack.com</span> / canetrack2026</li>
                      <li>Receiver: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>receiver@canetrack.com</span> / canetrack2026</li>
                      <li>Farmer: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>farmer@canetrack.com</span> / canetrack2026</li>
                   </ul>
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
