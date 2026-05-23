import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, Shield, Activity, Power, Lock, Search, UserCheck, Trash2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { TableWrapper } from '../Dashboards';
import { SearchInput } from '../../components/SearchInput';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'OPERATOR' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
      setLoading(false);
    } catch {
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       await api.post('/users', newUser);
       toast.success('User created successfully');
       setShowAddUser(false);
       setNewUser({ name: '', email: '', password: '', role: 'OPERATOR' });
       fetchUsers();
     } catch (error: any) {
       toast.error(error.response?.data?.message || 'Failed to create user.');
     }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPass = prompt("Enter new password for this user:");
    if (!newPass) return;
    try {
       await api.patch(`/users/${id}/password`, { password: newPass });
       toast.success("Password reset successfully");
    } catch {
       toast.error("Failed to reset password");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success(`User "${name}" deleted successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
     <div className="h-[60vh] flex items-center justify-center">
       <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-indigo-500/30 border-t-indigo-400' : 'border-indigo-500/30 border-t-indigo-500'}`} />
     </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Decorative background */}
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-indigo-950/30' : 'bg-indigo-50/50'}`} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
             <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Identity Management
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>User Management</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Provision, manage, and control system access.</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddUser(!showAddUser)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/25 transition-all">
           <UserPlus className="w-5 h-5" /> Provision User
        </motion.button>
      </div>

      <AnimatePresence>
        {showAddUser && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`p-8 rounded-[2rem] border shadow-xl overflow-hidden relative group ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} 
            onSubmit={handleCreateUser}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-50 pointer-events-none ${isDark ? 'bg-indigo-950/50' : 'bg-indigo-50'}`} />
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}><UserCheck className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
              <h3 className={`font-extrabold text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Create System Access Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div><label className={`block text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Name</label><input required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
               <div><label className={`block text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</label><input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
               <div><label className={`block text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label><input required type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div>
               <div>
                 <label className={`block text-xs font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Role Permissions</label>
                 <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                   <option value="OPERATOR">Operator</option><option value="RECEIVER">Receiver</option><option value="ADMIN">Admin</option>
                 </select>
               </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-600/30">Provision User</button>
              <button type="button" onClick={() => setShowAddUser(false)} className={`px-8 py-3 rounded-xl font-bold transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <TableWrapper 
         title="System Users Directory" 
         icon={Users} 
         delay={0.1}
         action={
            <SearchInput 
               value={searchTerm} 
               onChange={setSearchTerm} 
               placeholder="Search users..." 
               className="w-64"
            />
         }
      >
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
            <tr>
              <th className="px-6 py-5">Name / Email</th>
              <th className="px-6 py-5">Role</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Joined</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
            {filteredUsers.map((u: any) => (
              <tr key={u.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                <td className="px-6 py-5">
                   <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                   <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{u.email}</p>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-1.5"><Shield className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /> {u.role}</div>
                </td>
                <td className="px-6 py-5">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.isActive ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-rose-900/30 text-rose-400 border border-rose-800' : 'bg-rose-100 text-rose-700 border border-rose-200')}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                   </span>
                </td>
                <td className={`px-6 py-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(u.createdAt)}</td>
                <td className="px-6 py-5 flex items-center justify-end gap-2">
                   <button onClick={() => handleToggleStatus(u.id, u.isActive)} className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${u.isActive ? (isDark ? 'hover:bg-rose-900/30 hover:text-rose-400 border-transparent hover:border-rose-800 text-slate-500' : 'hover:bg-rose-50 hover:text-rose-600 border-transparent hover:border-rose-200 text-slate-400') : (isDark ? 'hover:bg-emerald-900/30 hover:text-emerald-400 border-transparent hover:border-emerald-800 text-slate-500' : 'hover:bg-emerald-50 hover:text-emerald-600 border-transparent hover:border-emerald-200 text-slate-400')}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
                     <Power className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleResetPassword(u.id)} className={`p-2 rounded-xl border border-transparent transition-colors ${isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/30 hover:border-indigo-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'}`} title="Reset Password">
                      <Lock className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteUser(u.id, u.name)} className={`p-2 rounded-xl border border-transparent transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30 hover:border-red-800' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200'}`} title="Delete User">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && <tr><td colSpan={5} className={`px-6 py-16 text-center text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No users found.</td></tr>}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );
}
