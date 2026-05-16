import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, FileText, CheckCircle, Activity, Leaf, LogIn, DollarSign, Sprout, Scale, Shield, BarChart3, Users, Clock, Award, ChevronDown } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CaneTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#financials" className="hover:text-emerald-600 transition-colors">Financials</a>
            <a href="#roles" className="hover:text-emerald-600 transition-colors">Roles</a>
            <a href="#testimonials" className="hover:text-emerald-600 transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">
              Sign In
            </Link>
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        {/* Decorative background elements */}
        <div className="absolute top-20 left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/60 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-[-10%] w-[35%] h-[35%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[30%] rounded-full bg-emerald-50/50 blur-[80px] pointer-events-none" />
        
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center relative">
          
          {/* Left Hero Text */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/80 backdrop-blur-sm text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-200/50 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Trusted by 500+ Farmers Nationwide
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-slate-900">
              Fair, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">harvest payouts</span> for everyone.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              From the sugarcane field to the refinery. Digitize your weight-bridge workflow, automate discrepancy flagging, and establish absolute trust with instant financial reconciliation.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-xl shadow-emerald-500/25 active:scale-95">
                Join our Network
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-base font-bold transition-all shadow-sm">
                <LogIn className="w-5 h-5 text-slate-400" />
                Sign In
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Transparent Pricing
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Immutable Audits
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> 24/7 Support
              </div>
            </div>
          </motion.div>

          {/* Right Hero Visuals */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:block"
          >
            {/* Background decorative image */}
            <div className="absolute inset-0 -z-10 opacity-10">
              <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1592982537447-6f29e160a3bb?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center rounded-[3rem] blur-sm" />
            </div>
            
            {/* Main Mock Card */}
            <div className="relative z-20 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Delivery #TKT-8291</h3>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">Farm: Hacienda San Jose</p>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase border border-emerald-200 tracking-wider">
                  Reconciled
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Mill Weight</span>
                  <span className="text-2xl font-black text-slate-800">15,400 <span className="text-base text-slate-500 font-semibold">kg</span></span>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Refinery</span>
                  <span className="text-2xl font-black text-slate-800">15,380 <span className="text-base text-slate-500 font-semibold">kg</span></span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-emerald-500/30">
                 <div>
                    <span className="block text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Farmer Payout</span>
                    <span className="text-3xl font-black">₱38,500.00</span>
                 </div>
                 <div className="bg-emerald-500/50 px-3 py-1.5 rounded-lg border border-emerald-400/50 backdrop-blur-sm">
                    <span className="text-xs font-bold">@ ₱2.50 / kg</span>
                 </div>
              </div>
            </div>

            {/* Floating Image element */}
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -right-12 -bottom-12 z-10 hidden md:block rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 backdrop-blur-sm"
            >
              <img src="https://images.unsplash.com/photo-1592982537447-6f29e160a3bb?auto=format&fit=crop&q=80&w=300&h=300" alt="Sugarcane field" className="w-48 h-48 object-cover" />
            </motion.div>

            {/* Floating stats badge */}
            <motion.div
               animate={{ y: [0, 8, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute -left-8 top-12 z-30 hidden lg:flex items-center gap-3 bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl border border-slate-200/50"
            >
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Monthly Deliveries</p>
                <p className="text-lg font-black text-slate-900">2,847</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Stats Bar */}
      <section className="relative z-10 py-12 bg-gradient-to-r from-emerald-600 to-emerald-500">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center text-white">
              <p className="text-4xl font-black mb-1">500+</p>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Active Farmers</p>
            </div>
            <div className="text-center text-white">
              <p className="text-4xl font-black mb-1">12K+</p>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Deliveries Tracked</p>
            </div>
            <div className="text-center text-white">
              <p className="text-4xl font-black mb-1">₱2.5M</p>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Payouts Processed</p>
            </div>
            <div className="text-center text-white">
              <p className="text-4xl font-black mb-1">99.9%</p>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="relative z-10 py-24 bg-white">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1536306281595-54745b543498?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
              <Shield className="w-4 h-4" /> Enterprise-Grade Platform
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">Everything you need to manage your harvest</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">Built to handle thousands of daily transactions ensuring zero weight loss, perfect auditing, and transparent farmer compensation.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 transition-all rounded-3xl p-8 flex flex-col group"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-slate-900">Automated Reconciliation</h3>
              <p className="text-slate-600 text-sm flex-1 leading-relaxed font-medium">
                Our engine automatically compares mill outbound weights against refinery inbound logs. Discrepancies above the threshold are instantly flagged for admin review.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 transition-all rounded-3xl p-8 flex flex-col group"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-slate-900">Transparent Payouts</h3>
              <p className="text-slate-600 text-sm flex-1 leading-relaxed font-medium">
                Live visibility into pricing. Farmers can see exactly how much their delivery is worth the moment the weight is reconciled at the refinery. No more hidden fees.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 transition-all rounded-3xl p-8 flex flex-col group"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-slate-900">Role-Based Integrity</h3>
              <p className="text-slate-600 text-sm flex-1 leading-relaxed font-medium">
                Farmers see their own data. Operators encode. Receivers double-check. Admins oversee. Zero cross-contamination of permissions or data leaks.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="roles" className="relative z-10 py-24 bg-slate-50">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1560493676-04079c3e121d?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
              <Sprout className="w-4 h-4" /> Simple Workflow
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">How CaneTrack works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">From field to payout in four simple steps.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="relative text-center"
            >
              <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-emerald-200 to-emerald-100 hidden md:block" />
              <div className="relative z-10 w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <span className="text-2xl font-black text-white">1</span>
              </div>
              <Truck className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Delivery</h3>
              <p className="text-sm text-slate-600 font-medium">Farmer delivers sugarcane to the mill weighing station.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative text-center"
            >
              <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-emerald-200 to-emerald-100 hidden md:block" />
              <div className="relative z-10 w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <span className="text-2xl font-black text-white">2</span>
              </div>
              <Scale className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Weighing</h3>
              <p className="text-sm text-slate-600 font-medium">Operator records gross and net weight on the digital ticket.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative text-center"
            >
              <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-emerald-200 to-emerald-100 hidden md:block" />
              <div className="relative z-10 w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <span className="text-2xl font-black text-white">3</span>
              </div>
              <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Reconciliation</h3>
              <p className="text-sm text-slate-600 font-medium">Receiver verifies weight at refinery and confirms match.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative text-center"
            >
              <div className="relative z-10 w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <span className="text-2xl font-black text-white">4</span>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Payout</h3>
              <p className="text-sm text-slate-600 font-medium">Farmer receives instant payout calculation based on verified weight.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="financials" className="relative z-10 py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
              <Users className="w-4 h-4" /> Built for Everyone
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">Tailored for every role</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">Each user gets a personalized dashboard designed for their specific workflow.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 transition-all rounded-3xl p-6 text-center group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Farmer</h3>
              <p className="text-sm text-slate-600 font-medium">Track deliveries, view earnings, and monitor payout history in real-time.</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50 transition-all rounded-3xl p-6 text-center group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Operator</h3>
              <p className="text-sm text-slate-600 font-medium">Encode deliveries, manage tickets, and track active shipments efficiently.</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100/50 transition-all rounded-3xl p-6 text-center group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Receiver</h3>
              <p className="text-sm text-slate-600 font-medium">Verify incoming deliveries, reconcile weights, and flag discrepancies.</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/50 transition-all rounded-3xl p-6 text-center group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Admin</h3>
              <p className="text-sm text-slate-600 font-medium">Full platform oversight, user management, reports, and dispute resolution.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-24 bg-slate-50">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
              <Award className="w-4 h-4" /> Trusted by Farmers
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">What our users say</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 text-amber-400 fill-current">
                    <svg viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 font-medium mb-6 leading-relaxed">"CaneTrack transformed how we manage our deliveries. No more guessing about payouts - everything is transparent and accurate."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">MR</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Maria Reyes</p>
                  <p className="text-xs text-slate-500">Farmer, Hacienda San Jose</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 text-amber-400 fill-current">
                    <svg viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 font-medium mb-6 leading-relaxed">"The automated reconciliation saves us hours every day. Discrepancies are caught instantly and resolved quickly."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">JC</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Juan Cruz</p>
                  <p className="text-xs text-slate-500">Operator, Central Mill</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 text-amber-400 fill-current">
                    <svg viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 font-medium mb-6 leading-relaxed">"As an admin, I have complete visibility into all operations. The reporting tools are excellent for compliance and audits."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">AS</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Ana Santos</p>
                  <p className="text-xs text-slate-500">Admin, CaneTrack HQ</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 overflow-hidden">
        {/* Background images with opacity */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-300/30 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-700/30 blur-[100px]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Leaf className="w-16 h-16 text-emerald-200 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Ready to transform your harvest management?</h2>
            <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto leading-relaxed">Join hundreds of farmers who already trust CaneTrack for transparent, accurate, and fair payouts.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-xl text-base font-bold transition-all shadow-xl active:scale-95">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500/30 backdrop-blur-sm hover:bg-emerald-500/40 text-white border border-emerald-400/50 px-8 py-4 rounded-xl text-base font-bold transition-all">
                <Clock className="w-5 h-5" />
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 text-slate-400 py-16">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-xl">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">CaneTrack</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed mb-6">A transparent, efficient, and fair platform for sugarcane farmers, operators, and administrators. Built with trust at its core.</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Secure
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Reliable
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Transparent
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#roles" className="hover:text-emerald-400 transition-colors">How It Works</a></li>
                <li><a href="#financials" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-emerald-400 transition-colors">Testimonials</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} CaneTrack Systems. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
