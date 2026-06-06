import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Leaf, Loader2, Mail, Lock, User, CheckCircle2, Shield, Truck, BarChart3, Phone, MapPin, Eye, EyeOff, KeyRound, X } from 'lucide-react';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attempts, setAttempts] = useState(Number(localStorage.getItem('login_attempts') || 0));
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem('lockout_until');
    if (saved && Number(saved) > Date.now()) return Number(saved);
    localStorage.removeItem('lockout_until');
    localStorage.removeItem('login_attempts');
    return null;
  });
  const [countdown, setCountdown] = useState(0);

  // Verification OTP
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [resending, setResending] = useState(false);

  // Forgot Password
  const [forgotStep, setForgotStep] = useState(0); // 0=hidden, 1=email, 2=code, 3=new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  const { isDark } = useTheme();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const state = location.state as { verified?: string } | null;
    if (state?.verified) {
      setSuccess(state.verified);
      navigate('', { replace: true, state: {} });
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('lockout_until');
    const attempts = localStorage.getItem('login_attempts');
    if (saved && Number(saved) > Date.now()) {
      setLockoutUntil(Number(saved));
      if (attempts) setAttempts(Number(attempts));
    }
  }, []);

  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
        localStorage.removeItem('lockout_until');
        localStorage.removeItem('login_attempts');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
          setError('Password must contain both letters and numbers');
          setLoading(false);
          return;
        }
        if (!/^09\d{9}$/.test(contactNumber)) {
          setError('Contact number must be 11 digits starting with 09');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { name, email, password, contactNumber, address });
        if (res.data.needsVerification) {
          setRegEmail(res.data.email);
          setShowVerification(true);
          setSuccess('Verification code sent to your email. Please check your inbox.');
        }
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        setAttempts(0); localStorage.setItem('login_attempts', '0');
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes('verify your email')) {
        setError(err.response.data.message);
        setLoading(false);
        return;
      }
      const newAttempts = attempts + 1;
      setAttempts(newAttempts); localStorage.setItem('login_attempts', String(newAttempts));
      if (newAttempts >= 3) {
        setLockoutUntil(Date.now() + 180000); localStorage.setItem('lockout_until', String(Date.now() + 180000));
        setError('Too many failed attempts. Locked out for 3 minutes.');
      } else {
        setError(err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Network error — check if the server is running' : 'Authentication failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) { setError('Please enter the verification code'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/verify-email', { email: regEmail, code: verificationCode });
      navigate('/login', { state: { verified: res.data.message } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-code', { email: regEmail });
      setSuccess('New code sent!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setError('Enter your email'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess('Reset code sent to your email.');
      setForgotStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false); setEmail(forgotEmail);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotCode || !forgotNewPassword) { setError('Fill in all fields'); return; }
    if (forgotNewPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/reset-password', { email: forgotEmail, code: forgotCode, newPassword: forgotNewPassword });
      setSuccess(res.data.message);
      setForgotStep(0);
      setForgotEmail(''); setForgotCode(''); setForgotNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
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
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between overflow-hidden m-4 rounded-[2rem] shadow-2xl h-[calc(100vh-32px)] sticky top-4">
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
      <div className="w-full lg:w-1/2 flex justify-center items-start overflow-y-auto py-8 sm:py-12 px-4 sm:px-8 lg:px-12 relative xl:px-24 h-screen">
        <div className="absolute top-3 right-3 sm:top-8 sm:right-12 flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate('/')} className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg min-h-[36px] ${isDark ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 shadow-black/30' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-slate-200/50'}`}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>

        <div className="max-w-[420px] w-full flex flex-col">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5 sm:space-y-6 lg:space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:hidden mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isRegistering ? 'Start right now.' : 'Welcome back.'}
              </h2>
              <p className={`mt-1 sm:mt-2 lg:mt-3 text-sm sm:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isRegistering ? "Create your client account to track your earnings." : "Sign into your account to view your deliveries."}
              </p>
            </div>

            {showVerification ? (
              <div className="space-y-4 sm:space-y-5">
                <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                    <Mail className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className={`text-lg font-extrabold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Verify your email</h3>
                  <p className={`text-sm font-medium mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    We sent a 6-digit code to <strong className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{regEmail}</strong>
                  </p>
                  <div className="max-w-[240px] mx-auto">
                    <input value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`w-full text-center text-2xl font-black tracking-[0.5em] px-4 py-4 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all min-h-[56px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      placeholder="000000" maxLength={6} inputMode="numeric" autoFocus />
                  </div>
                  {error && <p className="mt-4 text-sm font-bold text-red-500">{error}</p>}
                  {success && <p className="mt-4 text-sm font-bold text-emerald-500">{success}</p>}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button type="button" onClick={handleResendCode} disabled={resending} className={`text-xs font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'}`}>
                      {resending ? 'Sending...' : 'Resend code'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowVerification(false); setVerificationCode(''); setSuccess(''); setError(''); }}
                    className={`flex-1 py-3.5 rounded-xl font-bold transition-all text-sm min-h-[44px] ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                    Back
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleVerifyCode} disabled={loading || verificationCode.length < 6}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email'}
                  </motion.button>
                </div>
              </div>
            ) : (
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-3 sm:space-y-4">
                <AnimatePresence>
                  {isRegistering && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pb-3 sm:pb-4">
                        <label className={`block text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Full Name</label>
                        <div className="relative">
                          <input type="text" required={isRegistering} className={`w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium min-h-[44px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" />
                          <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isRegistering && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pb-3 sm:pb-4">
                        <label className={`block text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Contact Number</label>
                        <div className="relative">
                          <input type="tel" required={isRegistering} className={`w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium min-h-[44px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="09123456789" />
                          <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isRegistering && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pb-3 sm:pb-4">
                        <label className={`block text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Complete Address</label>
                        <div className="relative">
                          <input type="text" className={`w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium min-h-[44px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Barangay San Juan, Province" />
                          <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>



                <div>
                  <label className={`block text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Email address</label>
                  <div className="relative">
                    <input type="email" required className={`w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium min-h-[44px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required className={`w-full pl-11 sm:pl-12 pr-12 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium tracking-widest min-h-[44px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isRegistering && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div>
                        <label className={`block text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Confirm Password</label>
                        <div className="relative">
                          <input type={showConfirmPassword ? 'text' : 'password'} required={isRegistering} className={`w-full pl-11 sm:pl-12 pr-12 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium tracking-widest min-h-[44px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                          <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isRegistering && (
                  <div className="text-right -mt-1 sm:-mt-2">
                    <button type="button" onClick={() => { setForgotStep(1); setForgotEmail(email); setError(''); setSuccess(''); }} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {error && <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-red-950/30 text-red-400 p-4 rounded-xl sm:rounded-2xl text-sm font-bold border border-red-900/50 flex items-start gap-3">
                    <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-red-500" /></div>
                    {error}
                  </motion.div>}
                  {success && <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-emerald-950/30 text-emerald-400 p-4 rounded-xl sm:rounded-2xl text-sm font-bold border border-emerald-800/50 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {success}
                  </motion.div>}
                </AnimatePresence>
              </div>

              {attempts >= 2 && !isLocked && (
                <div className={`text-xs font-bold text-center ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {3 - attempts} attempt{3 - attempts > 1 ? 's' : ''} remaining before 3-minute lockout
                </div>
              )}
              <motion.button
                whileHover={isLocked ? {} : { scale: 1.01 }}
                whileTap={isLocked ? {} : { scale: 0.98 }}
                type="submit"
                disabled={loading || isLocked}
                className={`w-full flex justify-center items-center py-3.5 sm:py-4 px-4 rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg mt-4 sm:mt-6 min-h-[48px] ${isLocked
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-600/30'}`}
              >
                {isLocked ? `Locked ${countdown}s` : loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Create Client Account' : 'Sign In')}
              </motion.button>
            </form>
            )}

            <div className="text-center mt-6 sm:mt-8">
               <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                 {isRegistering ? "Already a client?" : "Are you a new farmer/client?"}{' '}
                   <button onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); setPassword(''); setConfirmPassword(''); setAttempts(0); localStorage.setItem('login_attempts', '0'); setLockoutUntil(null); localStorage.removeItem('lockout_until'); }} className="text-emerald-500 hover:text-emerald-400 font-bold ml-1 transition-colors underline decoration-2 underline-offset-4 decoration-emerald-800">
                   {isRegistering ? "Sign in instead" : "Create Account"}
                 </button>
                </p>
            </div>

            <div className={`mt-6 sm:mt-8 lg:mt-12 rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden border ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                <h4 className={`text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>For Sugarcane Farmers</h4>
                <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Create your account to track bagon deliveries, record payments, and manage your farm operations.
                </p>
            </div>
          </motion.div>

          {/* Forgot Password Overlay */}
          <AnimatePresence>
            {forgotStep > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setForgotStep(0)}>
                <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative w-full max-w-md rounded-2xl sm:rounded-[2rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-200/40'}`}
                  onClick={e => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                          <KeyRound className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {forgotStep === 1 ? 'Reset Password' : forgotStep === 2 ? 'Enter Code' : 'New Password'}
                        </h2>
                      </div>
                      <button onClick={() => setForgotStep(0)} className={`p-2 rounded-xl transition-colors ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {forgotStep === 1 && (
                      <div className="space-y-4">
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter your email to receive a reset code.</p>
                        <div>
                          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                          <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium text-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="you@example.com" />
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleForgotPassword} disabled={loading}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
                        </motion.button>
                      </div>
                    )}

                    {forgotStep === 2 && (
                      <div className="space-y-4">
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter the 6-digit code sent to your email.</p>
                        <div>
                          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Code</label>
                          <input value={forgotCode} onChange={e => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className={`w-full text-center text-2xl font-black tracking-[0.5em] px-4 py-4 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all min-h-[56px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            placeholder="000000" maxLength={6} inputMode="numeric" />
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { if (forgotCode.length === 6) setForgotStep(3); else setError('Enter the 6-digit code'); }}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px]">
                          Continue
                        </motion.button>
                        <div className="text-center">
                          <button type="button" onClick={() => { setForgotEmail(''); setForgotStep(1); }} className="text-xs font-bold text-emerald-500 hover:text-emerald-400">
                            Wrong email? Try again
                          </button>
                        </div>
                      </div>
                    )}

                    {forgotStep === 3 && (
                      <div className="space-y-4">
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter your new password.</p>
                        <div>
                          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>New Password</label>
                          <div className="relative">
                            <input type={showForgotNewPassword ? 'text' : 'password'} value={forgotNewPassword} onChange={e => setForgotNewPassword(e.target.value)}
                              className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium tracking-widest text-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                              placeholder="••••••••" />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <button type="button" onClick={() => setShowForgotNewPassword(!showForgotNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                              {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleResetPassword} disabled={loading}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
