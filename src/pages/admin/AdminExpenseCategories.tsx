import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tags, Plus, Edit3, X, Save, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { TableWrapper } from '../Dashboards';
import { SearchInput } from '../../components/SearchInput';

interface CatForm {
  name: string;
  type: string;
  description: string;
}

const emptyForm: CatForm = { name: '', type: 'DELIVERY', description: '' };

export function AdminExpenseCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const { isDark } = useTheme();

  const fetchData = async () => {
    try {
      const res = await api.get('/expense-categories');
      setCategories(res.data.categories);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditCat(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (cat: any) => { setEditCat(cat); setForm({ name: cat.name, type: cat.type, description: cat.description || '' }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.type) { toast.error('Name and type are required'); return; }
    try {
      if (editCat) {
        await api.patch(`/expense-categories/${editCat.id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/expense-categories', form);
        toast.success('Category created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleToggleActive = async (cat: any) => {
    try {
      await api.patch(`/expense-categories/${cat.id}`, { isActive: !cat.isActive });
      toast.success(cat.isActive ? 'Category deactivated' : 'Category activated');
      fetchData();
    } catch { toast.error('Operation failed'); }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    try {
      await api.delete(`/expense-categories/${cat.id}`);
      toast.success('Category deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = categories.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
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
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Expense Configuration
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Expense Categories</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage expense categories for deliveries and farm operations.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/25 transition-all min-h-[44px]">
          <Plus className="w-5 h-5" /> Add Category
        </motion.button>
      </div>

      <TableWrapper title="All Categories" icon={Tags} delay={0.1} action={
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories..." className="w-full sm:w-64" />
      }>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm whitespace-nowrap table-card-view">
            <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Name</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Type</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Description</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Created</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {filtered.map((c: any) => (
                <tr key={c.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <p className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.name}</p>
                  </td>
                  <td data-label="Type" className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.type === 'DELIVERY'
                      ? (isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200')
                      : (isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200')}`}>{c.type}</span>
                  </td>
                  <td data-label="Description" className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.description || '—'}</td>
                  <td data-label="Status" className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.isActive
                      ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200')
                      : (isDark ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-100 text-slate-500 border-slate-200')}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td data-label="Created" className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(c.createdAt)}</td>
                  <td data-label="Actions" className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <button onClick={() => openEdit(c)} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-transparent flex items-center justify-center transition-colors min-h-[36px] min-w-[36px] ${isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-800' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`} title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleActive(c)} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-transparent flex items-center justify-center transition-colors min-h-[36px] min-w-[36px] ${isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-800' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`} title={c.isActive ? 'Deactivate' : 'Activate'}>{c.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}</button>
                      <button onClick={() => handleDelete(c)} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-transparent flex items-center justify-center transition-colors min-h-[36px] min-w-[36px] ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30 hover:border-red-800' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200'}`} title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className={`px-4 sm:px-6 py-12 sm:py-16 text-center text-base sm:text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No categories found.</td></tr>}
            </tbody>
          </table>
        </div>
      </TableWrapper>

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
                      {editCat ? <Edit3 className="w-5 h-5 text-emerald-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{editCat ? 'Edit Category' : 'Add Category'}</h2>
                  </div>
                  <button onClick={() => setModalOpen(false)} className={`p-2 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Name *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="e.g. Diesel" />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Type *</label>
                    <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                      <option value="DELIVERY">Delivery</option>
                      <option value="FARM">Farm</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm resize-none min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="Optional description..." />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px]">
                      <Save className="w-4 h-4" /> {editCat ? 'Update Category' : 'Save Category'}
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