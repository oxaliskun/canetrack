import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { Sprout, MapPin, Ruler, Archive, Edit3, Plus, X, Leaf, Search, Save } from 'lucide-react';

interface Farm {
  id: string;
  farmName: string;
  location: string;
  barangay: string | null;
  hectares: number | null;
  cropType: string | null;
  description: string | null;
  isArchived: boolean;
  ownerId: string;
  createdAt: string;
}

interface FarmForm {
  farmName: string;
  location: string;
  barangay: string;
  hectares: string;
  cropType: string;
  description: string;
}

const emptyForm: FarmForm = { farmName: '', location: '', barangay: '', hectares: '', cropType: '', description: '' };

export function FarmerFarms() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFarm, setEditFarm] = useState<Farm | null>(null);
  const [form, setForm] = useState<FarmForm>(emptyForm);
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  const fetchFarms = () => {
    api.get('/farms/mine').then(res => {
      setFarms(res.data.farms);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load farms');
      setLoading(false);
    });
  };

  useEffect(() => { fetchFarms(); }, []);

  const openAdd = () => {
    setEditFarm(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (farm: Farm) => {
    setEditFarm(farm);
    setForm({
      farmName: farm.farmName,
      location: farm.location,
      barangay: farm.barangay || '',
      hectares: farm.hectares?.toString() || '',
      cropType: farm.cropType || '',
      description: farm.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farmName.trim() || !form.location.trim()) {
      toast.error('Farm name and location are required');
      return;
    }
    try {
      if (editFarm) {
        await api.patch(`/farms/${editFarm.id}`, {
          ...form,
          hectares: form.hectares ? Number(form.hectares) : null,
        });
        toast.success('Farm updated successfully');
      } else {
        await api.post('/farms', {
          ...form,
          hectares: form.hectares ? Number(form.hectares) : null,
        });
        toast.success('Farm added successfully');
      }
      setModalOpen(false);
      fetchFarms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleArchive = async (farm: Farm) => {
    try {
      await api.patch(`/farms/${farm.id}/archive`);
      toast.success(farm.isArchived ? 'Farm restored successfully' : 'Farm archived successfully');
      fetchFarms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const activeFarms = farms.filter(f => !f.isArchived);
  const totalHectares = activeFarms.reduce((sum, f) => sum + (f.hectares || 0), 0);
  const filtered = farms.filter(f =>
    f.farmName.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase()) ||
    (f.cropType || '').toLowerCase().includes(search.toLowerCase())
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
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Farm Management
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Farms</h1>
          <p className={`mt-1 text-sm sm:text-base font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Manage your registered farm locations and details.</p>
        </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={openAdd}
            className={`inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 text-sm min-h-[44px]`}
          >
            <Plus className="w-5 h-5" /> Add Farm
          </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-emerald-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Farms</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-emerald-100 text-emerald-700`}><Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{farms.length}</p>
          <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{activeFarms.length} active</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-blue-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Area</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-blue-100 text-blue-700`}><Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalHectares.toLocaleString()}</p>
          <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>hectares total</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-purple-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Crop Varieties</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-purple-100 text-purple-700`}><Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{new Set(activeFarms.map(f => f.cropType).filter(Boolean)).size}</p>
          <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>crop types</p>
        </motion.div>
      </div>

      <div className={`flex items-center gap-3 mb-6`}>
        <div className={`flex-1 relative`}>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pl-12 pr-5 py-3.5 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
            placeholder="Search farms by name, location, or crop type..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col items-center justify-center py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <div className={`w-24 h-24 shadow-sm border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <Leaf className="w-12 h-12 text-emerald-500" />
          </div>
          <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{search ? 'No matching farms' : 'No farms registered yet'}</p>
          <p className="text-base mt-2 font-medium">Add your first farm to start tracking harvests.</p>
          {!search && <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className={`mt-6 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 text-sm`}><Plus className="w-5 h-5" /> Add Your First Farm</motion.button>}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((farm, i) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                layout
                className={`rounded-2xl sm:rounded-[2rem] border overflow-hidden group flex flex-col relative hover:shadow-xl transition-all ${farm.isArchived
                  ? (isDark ? 'bg-slate-900/50 border-slate-700 opacity-75' : 'bg-slate-50/50 border-slate-200 opacity-75')
                  : (isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/20' : 'bg-white border-slate-200 shadow-slate-200/30')}`}
              >
                <div className={`h-2 w-full bg-gradient-to-r ${farm.isArchived ? 'from-slate-500 to-slate-400' : 'from-emerald-500 to-emerald-400'}`} />
                <div className="p-4 sm:p-6 flex-1 flex flex-col relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base sm:text-lg font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{farm.farmName}</h3>
                      {farm.isArchived && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                          <Archive className="w-3 h-3" /> Archived
                        </span>
                      )}
                    </div>
                    <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                      <Sprout className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-2.5">
                      <MapPin className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{farm.location}{farm.barangay ? `, ${farm.barangay}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Ruler className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{farm.hectares ? `${farm.hectares} ha` : 'Size not set'}</span>
                    </div>
                    {farm.cropType && (
                      <div className="flex items-center gap-2.5">
                        <Leaf className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{farm.cropType}</span>
                      </div>
                    )}
                    {farm.description && (
                      <p className={`text-xs sm:text-sm mt-2 leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{farm.description}</p>
                    )}
                  </div>

                  <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className={`flex items-center justify-between text-[10px] font-semibold mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>Added {formatDate(farm.createdAt)}</span>
                      <span>Updated {formatDate(farm.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => openEdit(farm)}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-widest transition-all border min-h-[36px] ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleArchive(farm)}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-widest transition-all border min-h-[36px] ${farm.isArchived
                          ? (isDark ? 'text-emerald-400 border-emerald-800 hover:bg-emerald-950/50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50')
                          : (isDark ? 'text-orange-400 border-orange-800 hover:bg-orange-950/50' : 'text-orange-600 border-orange-200 hover:bg-orange-50')}`}
                      >
                        <Archive className="w-3.5 h-3.5" /> {farm.isArchived ? 'Restore' : 'Archive'}
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
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg rounded-2xl sm:rounded-[2rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-200/40'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                      {editFarm ? <Edit3 className="w-5 h-5 text-emerald-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{editFarm ? 'Edit Farm' : 'Add New Farm'}</h2>
                  </div>
                  <button onClick={() => setModalOpen(false)} className={`p-2 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Farm Name *</label>
                    <input required value={form.farmName} onChange={e => setForm({...form, farmName: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="e.g. Green Valley Farm" />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Location *</label>
                    <input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="e.g. Barangay San Juan" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Barangay</label>
                      <input value={form.barangay} onChange={e => setForm({...form, barangay: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="Optional" />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Size (hectares)</label>
                      <input type="number" step="0.01" min="0" value={form.hectares} onChange={e => setForm({...form, hectares: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Crop Type</label>
                    <input value={form.cropType} onChange={e => setForm({...form, cropType: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="e.g. Sugarcane, Rice" />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm resize-none min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="Optional notes about this farm..." />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px]">
                      <Save className="w-4 h-4" /> {editFarm ? 'Update Farm' : 'Save Farm'}
                    </motion.button>
                    <button type="button" onClick={() => setModalOpen(false)} className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl sm:rounded-2xl font-bold transition-colors text-sm min-h-[44px] ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
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
