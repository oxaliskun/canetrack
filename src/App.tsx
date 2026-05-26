import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { FarmerDashboard, OperatorDashboard, ReceiverDashboard, AdminDashboard } from './pages/Dashboards';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminTickets } from './pages/admin/AdminTickets';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { FarmerFarms } from './pages/farmer/FarmerFarms';
import { Profile } from './pages/shared/Profile';
import { Settings } from './pages/shared/Settings';
import { AuditLogs } from './pages/shared/AuditLogs';
import { SplashScreen } from './components/SplashScreen';
import { LandingPage } from './pages/LandingPage';
import { Toaster } from 'sonner';

function PrivateRoute({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (loading) return (
    <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return (
    <div className={`flex h-dvh ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'} font-sans selection:bg-emerald-500/30 relative overflow-hidden`}>
      {/* Enhanced decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className={`absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[100px] ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/40'}`} />
         <div className={`absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full blur-[80px] ${isDark ? 'bg-blue-950/20' : 'bg-blue-50/30'}`} />
         <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[50%] h-[30%] rounded-full blur-[120px] ${isDark ? 'bg-emerald-950/15' : 'bg-emerald-50/20'}`} />
         <div className={`absolute w-full h-[50vh] bg-gradient-to-b ${isDark ? 'from-emerald-950/20 to-transparent' : 'from-emerald-50/50 to-transparent'}`} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className={`fixed inset-0 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 w-72 sm:w-80 lg:w-[280px] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar role={user.role} userName={user.name} onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col h-dvh overflow-hidden relative z-10 w-full min-w-0">
        {/* Mobile top bar */}
        <div className={`lg:hidden flex items-center gap-3 px-3 py-2.5 safe-top border-b shadow-sm ${isDark ? 'bg-slate-900/80 backdrop-blur-xl border-slate-800' : 'bg-white/80 backdrop-blur-xl border-slate-200'}`}>
           <button
             onClick={() => setSidebarOpen(true)}
             className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-sm border shrink-0 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-700 text-slate-300 hover:bg-slate-700 border-slate-700' : 'bg-gradient-to-br from-slate-100 to-white text-slate-600 hover:bg-slate-200 border-slate-200'}`}
             aria-label="Open menu"
           >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
           </button>
           <div className="flex items-center gap-2 flex-1 font-extrabold tracking-tight min-w-0">
             <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-1.5 rounded-lg shadow-sm shrink-0">
               <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
             </div>
             <span className={`truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>CaneTrack</span>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 custom-scrollbar">
           {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const isLanding = globalThis.location?.pathname === '/';
  const alreadyShown = sessionStorage.getItem('splash_shown');
  const [showSplash, setShowSplash] = useState(isLanding && !alreadyShown);

  if (isLanding && !alreadyShown) {
    sessionStorage.setItem('splash_shown', '1');
  }

  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors />
      <NotificationProvider>
      {isLanding && (
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      )}
      
      {(!isLanding || !showSplash) && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard/farmer" element={
              <PrivateRoute allowedRoles={['FARMER']}>
                <FarmerDashboard />
              </PrivateRoute>
            } />
            <Route path="/dashboard/farmer/farms" element={
              <PrivateRoute allowedRoles={['FARMER']}>
                <FarmerFarms />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard/operator" element={
              <PrivateRoute allowedRoles={['OPERATOR']}>
                <OperatorDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard/receiver" element={
              <PrivateRoute allowedRoles={['RECEIVER']}>
                <ReceiverDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard/settings" element={
              <PrivateRoute allowedRoles={['ADMIN', 'OPERATOR', 'RECEIVER', 'FARMER']}>
                <Settings />
              </PrivateRoute>
            } />
            <Route path="/dashboard/profile" element={
              <PrivateRoute allowedRoles={['ADMIN', 'OPERATOR', 'RECEIVER', 'FARMER']}>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/dashboard/activity-logs" element={
              <PrivateRoute allowedRoles={['ADMIN', 'OPERATOR', 'RECEIVER', 'FARMER']}>
                <AuditLogs />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard/admin" element={
              <PrivateRoute allowedRoles={['ADMIN']}>
                <Outlet />
              </PrivateRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={
              <div className="flex items-center justify-center h-screen">
                <h1 className="text-2xl font-bold">404 - Not Found</h1>
              </div>
            } />
          </Routes>
        </BrowserRouter>
       )}
     </NotificationProvider>
     </ThemeProvider>
   );
}
