import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle, XCircle, Clock, Eye, Search, X, Leaf, Loader2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { TableWrapper } from '../Dashboards';
import { SearchInput } from '../../components/SearchInput';

interface UserDoc {
  id: string; imageUrl: string; documentType: string; status: string; createdAt: string;
}

export function AdminVerifications() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [docs, setDocs] = useState<UserDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [assignedMill, setAssignedMill] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { isDark } = useTheme();

  const fetchFarmers = async () => {
    try {
      const res = await api.get('/users');
      setFarmers(res.data.users.filter((u: any) => u.role === 'FARMER'));
    } catch { toast.error('Failed to load farmers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFarmers(); }, []);

  const openModal = async (farmer: any) => {
    setSelected(farmer);
    setDocsLoading(true);
    try {
      const res = await api.get(`/admin/documents?userId=${farmer.id}`);
      setDocs(res.data.documents);
    } catch { setDocs([]); }
    finally { setDocsLoading(false); }
    setShowApprove(false); setShowReject(false);
    setAssignedMill(''); setRejectReason('');
  };

  const handleApprove = async () => {
    if (!assignedMill.trim()) { toast.error('Please assign a mill'); return; }
    setProcessing(true);
    try {
      await api.post('/auth/verify-farmer', { userId: selected.id, action: 'approve', assignedMill: assignedMill.trim() });
      toast.success('Farmer approved successfully');
      setShowApprove(false); setSelected(null); fetchFarmers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Approval failed'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    setProcessing(true);
    try {
      await api.post('/auth/verify-farmer', { userId: selected.id, action: 'reject', rejectionReason: rejectReason.trim() });
      toast.success('Farmer rejected');
      setShowReject(false); setSelected(null); fetchFarmers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Rejection failed'); }
    finally { setProcessing(false); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: any; label: string }> = {
      VERIFIED: { color: 'emerald', icon: CheckCircle, label: 'Verified' },
      REJECTED: { color: 'red', icon: XCircle, label: 'Rejected' },
      PENDING: { color: 'amber', icon: Clock, label: 'Pending' },
    };
    const s = map[status] || map.PENDING;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-${s.color}-${isDark ? '800' : '200'} bg-${s.color}-${isDark ? '900/30' : '100'} text-${s.color}-${isDark ? '400' : '700'}`}>
        <Icon className="w-3 h-3" /> {s.label}
      </span>
    );
  };

  const filtered = farmers.filter((f: any) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verification Management
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Farmer Verifications</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Review and approve farmer registration requests.</p>
        </div>
      </div>

      <TableWrapper title="Farmers" icon={Shield} delay={0.1} action={
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search farmers..." className="w-full sm:w-64" />
      }>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm whitespace-nowrap table-card-view">
            <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Farmer</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Registered</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {filtered.map((f: any) => (
                <tr key={f.id} className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`} onClick={() => openModal(f)}>
                  <td data-label="Farmer" className="px-4 sm:px-6 py-4 sm:py-5">
                    <p className={`font-bold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.name}</p>
                    <p className={`text-xs font-mono mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{f.email}</p>
                  </td>
                  <td data-label="Status" className="px-4 sm:px-6 py-4 sm:py-5">{statusBadge(f.verificationStatus)}</td>
                  <td data-label="Registered" className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(f.createdAt)}</td>
                  <td data-label="Actions" className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                    <button className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`} title="Review">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className={`px-4 sm:px-6 py-12 sm:py-16 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No farmers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </TableWrapper>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setShowApprove(false); setShowReject(false); }}>
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-[2rem] border shadow-2xl ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}><Shield className="w-5 h-5 text-emerald-500" /></div>
                    <div>
                       <h2 className={`text-lg sm:text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selected.name}</h2>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selected.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelected(null); setShowApprove(false); setShowReject(false); }} className={`p-2 rounded-xl transition-colors ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}><X className="w-5 h-5" /></button>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl border mb-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div><p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</p><p className="font-bold mt-1">{statusBadge(selected.verificationStatus)}</p></div>
                  <div><p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contact</p><p className={`font-bold text-sm mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selected.contactNumber || 'N/A'}</p></div>
                  <div><p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Registered</p><p className={`font-bold text-sm mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(selected.createdAt)}</p></div>
                  <div><p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Assigned Mill</p><p className={`font-bold text-sm mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selected.assignedMill || 'Not set'}</p></div>
                </div>

                <h3 className={`font-extrabold text-sm uppercase tracking-widest mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Verification Documents</h3>
                {docsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                ) : docs.length === 0 ? (
                  <p className={`text-sm py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No documents uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {docs.map((d: UserDoc) => (
                      <div key={d.id} className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <img src={d.imageUrl} alt={d.documentType} className="w-full h-32 object-cover cursor-pointer" onClick={() => window.open(d.imageUrl, '_blank')} />
                        <div className="p-2 flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.documentType}</span>
                          <span className={`text-[10px] font-bold uppercase ${d.status === 'APPROVED' ? 'text-emerald-500' : d.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`}>{d.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selected.verificationStatus === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowApprove(true); setShowReject(false); }} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 min-h-[44px]">
                      <CheckCircle className="w-5 h-5" /> Approve
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowReject(true); setShowApprove(false); }} className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 min-h-[44px]">
                      <XCircle className="w-5 h-5" /> Reject
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showApprove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowApprove(false)}>
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`relative w-full max-w-md rounded-2xl sm:rounded-[2rem] border shadow-2xl p-6 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Assign Mill</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter the mill this farmer will be assigned to.</p>
              <input value={assignedMill} onChange={e => setAssignedMill(e.target.value)} placeholder="e.g. Victorias Milling Company" className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium mb-4 min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleApprove} disabled={processing} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Confirm
                </motion.button>
                <button onClick={() => setShowApprove(false)} className={`px-6 py-3.5 rounded-xl font-bold min-h-[44px] ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowReject(false)}>
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`relative w-full max-w-md rounded-2xl sm:rounded-[2rem] border shadow-2xl p-6 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Rejection Reason</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Explain why the farmer's documents are being rejected.</p>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Documents are unclear or incomplete..." className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none font-medium mb-4 resize-none min-h-[80px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReject} disabled={processing} className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />} Confirm
                </motion.button>
                <button onClick={() => setShowReject(false)} className={`px-6 py-3.5 rounded-xl font-bold min-h-[44px] ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}