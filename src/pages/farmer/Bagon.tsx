import { useEffect, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { Truck, Plus, Edit3, Archive, X, Search, Save, Scale } from 'lucide-react';

interface BagonData {
  id: string;
  plateNumber: string;
  type: string;
  tareWeight: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BagonForm {
  plateNumber: string;
  type: string;
  tareWeight: string;
}

const tareOptions = ['1.5', '1.8', '2.0', '2.2', '2.5', '2.8', '3.0', '3.5'];

const emptyForm: BagonForm = { plateNumber: '', type: '18ft', tareWeight: '' };

export function Bagon() {
  const [bagons, setBagons] = useState<BagonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBagon, setEditBagon] = useState<BagonData | null>(null);
  const [form, setForm] = useState<BagonForm>(emptyForm);
  const [tareSelect, setTareSelect] = useState('');
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  const fetchBagons = () => {
    api.get('/bagon').then(res => {
      setBagons(res.data.bagons);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load bagons');
      setLoading(false);
    });
  };

  useEffect(() => { fetchBagons(); }, []);

  const openAdd = () => {
    setEditBagon(null);
    setForm(emptyForm);
    setTareSelect('');
    setModalOpen(true);
  };

  const openEdit = (bagon: BagonData) => {
    setEditBagon(bagon);
    const tareInTons = bagon.tareWeight ? (bagon.tareWeight / 1000).toFixed(2) : '';
    setForm({
      plateNumber: bagon.plateNumber,
      type: bagon.type,
      tareWeight: tareInTons,
    });
    setTareSelect(tareOptions.includes(tareInTons) ? tareInTons : tareInTons ? '__other__' : '');
    setModalOpen(true);
  };

  const validatePlate = (plate: string) => /^[A-Z0-9-]+$/.test(plate.toUpperCase());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const plate = form.plateNumber.toUpperCase().trim();
    if (!plate) {
      toast.error('Plate number is required');
      return;
    }
    if (!validatePlate(plate)) {
      toast.error('Plate number can only contain letters, numbers, and hyphens');
      return;
    }
    const tare = form.tareWeight ? Number(form.tareWeight) * 1000 : null; // convert tons to kg
    try {
      if (editBagon) {
        await api.patch(`/bagon/${editBagon.id}`, { plateNumber: plate, type: form.type, tareWeight: tare });
        toast.success('Bagon updated successfully');
      } else {
        await api.post('/bagon', { plateNumber: plate, type: form.type, tareWeight: tare });
        toast.success('Bagon added successfully');
      }
      setModalOpen(false);
      fetchBagons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleArchive = async (bagon: BagonData) => {
    try {
      await api.patch(`/bagon/${bagon.id}`, { isArchived: !bagon.isArchived });
      toast.success(bagon.isArchived ? 'Bagon restored successfully' : 'Bagon archived successfully');
      fetchBagons();
    } catch { toast.error('Operation failed'); }
  };

  const activeBagons = bagons.filter(t => !t.isArchived);
  const filtered = bagons.filter(t =>
    t.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[30%] h-[30%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/50'}`} />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Fleet Management
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Bagons</h1>
          <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Manage your bagons and trailer information.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 text-sm min-h-[44px]">
          <Plus className="w-5 h-5" /> Add Bagon
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-emerald-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Bagons</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-emerald-100 text-emerald-700`}><Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
           <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{bagons.length}</p>
           <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{activeBagons.length} active</p>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-blue-500`} />
           <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
             <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>14ft Bagons</p>
             <div className={`p-2 sm:p-2.5 rounded-xl bg-blue-100 text-blue-700`}><Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
           </div>
           <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeBagons.filter(t => t.type === '14ft').length}</p>
           <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>18ft: {activeBagons.filter(t => t.type === '18ft').length} &middot; 20ft: {activeBagons.filter(t => t.type === '20ft').length}</p>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-purple-500`} />
           <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
             <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tare Weight</p>
             <div className={`p-2 sm:p-2.5 rounded-xl bg-purple-100 text-purple-700`}><Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
           </div>
           <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeBagons.length ? (activeBagons.reduce((s, t) => s + (t.tareWeight || 0), 0) / activeBagons.length / 1000).toFixed(2) : 0}</p>
          <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>t avg tare</p>
        </motion.div>
      </div>

      <div className={`flex items-center gap-3 mb-6`}>
        <div className={`flex-1 relative`}>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pl-12 pr-5 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
            placeholder="Search bagons by plate or type..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <div className={`w-24 h-24 shadow-sm border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <Truck className="w-12 h-12 text-emerald-500" />
          </div>
          <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{search ? 'No matching bagons' : 'No bagons registered yet'}</p>
          <p className="text-base mt-2 font-medium">Add your first bagon to start tracking deliveries.</p>
          {!search && <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 text-sm"><Plus className="w-5 h-5" /> Add Your First Bagon</motion.button>}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((bagon, i) => (
              <motion.div key={bagon.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} layout
                className={`rounded-2xl sm:rounded-[2rem] border overflow-hidden group flex flex-col relative hover:shadow-xl transition-all ${bagon.isArchived
                  ? (isDark ? 'bg-slate-900/50 border-slate-700 opacity-75' : 'bg-slate-50/50 border-slate-200 opacity-75')
                  : (isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/20' : 'bg-white border-slate-200 shadow-slate-200/30')}`}>
                <div className={`h-2 w-full bg-gradient-to-r ${bagon.isArchived ? 'from-slate-500 to-slate-400' : 'from-emerald-500 to-emerald-400'}`} />
                <div className="p-4 sm:p-6 flex-1 flex flex-col relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base sm:text-lg font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{bagon.plateNumber}</h3>
                      <p className={`text-sm font-medium mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{bagon.type} Bagon</p>
                      {bagon.isArchived && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                          <Archive className="w-3 h-3" /> Archived
                        </span>
                      )}
                    </div>
                    <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                      <Truck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    {bagon.tareWeight != null && (
                      <div className="flex items-center gap-2.5">
                        <Scale className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{(bagon.tareWeight / 1000).toFixed(2)} t tare</span>
                      </div>
                    )}
                  </div>

                  <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className={`flex items-center justify-between text-[10px] font-semibold mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>Added {formatDate(bagon.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openEdit(bagon)}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-widest transition-all border min-h-[36px] ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleArchive(bagon)}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-widest transition-all border min-h-[36px] ${bagon.isArchived
                          ? (isDark ? 'text-emerald-400 border-emerald-800 hover:bg-emerald-950/50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50')
                          : (isDark ? 'text-orange-400 border-orange-800 hover:bg-orange-950/50' : 'text-orange-600 border-orange-200 hover:bg-orange-50')}`}>
                        <Archive className="w-3.5 h-3.5" /> {bagon.isArchived ? 'Restore' : 'Archive'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg rounded-2xl sm:rounded-[2rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-200/40'}`}
              onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                      {editBagon ? <Edit3 className="w-5 h-5 text-emerald-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{editBagon ? 'Edit Bagon' : 'Add New Bagon'}</h2>
                  </div>
                  <button onClick={() => setModalOpen(false)} className={`p-2 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Plate Number *</label>
                    <input required value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})}
                      className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] font-mono tracking-wider ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                      placeholder="ABC-1234" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Type *</label>
                      <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                        className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                        <option value="14ft">14ft</option>
                        <option value="18ft">18ft</option>
                        <option value="20ft">20ft</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tare Weight (tons)</label>
                      <select value={tareSelect} onChange={e => { const v = e.target.value; setTareSelect(v); if (v !== '__other__') setForm({...form, tareWeight: v }); }}
                        className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] appearance-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                        <option value="">— Select —</option>
                        {tareOptions.map(opt => <option key={opt} value={opt}>{opt} t</option>)}
                        <option value="__other__">Others (manual input)</option>
                      </select>
                      {tareSelect === '__other__' && (
                        <input type="number" step="0.01" min="0" value={form.tareWeight} onChange={e => setForm({...form, tareWeight: e.target.value})}
                          className={`mt-2 w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                          placeholder="e.g. 2.4" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                      className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px]">
                      <Save className="w-4 h-4" /> {editBagon ? 'Update Bagon' : 'Save Bagon'}
                    </motion.button>
                    <button type="button" onClick={() => setModalOpen(false)}
                      className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl sm:rounded-2xl font-bold transition-colors text-sm min-h-[44px] ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
