import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { DollarSign, X, Save, Database } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { TableWrapper } from '../Dashboards';

export function AdminPricing() {
  const [variants, setVariants] = useState<any[]>([]);
  const [sugarTypes, setSugarTypes] = useState<any[]>([]);
  const [pricings, setPricings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState<{ variantId: string; sugarTypeId: string; price: number | null } | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const { isDark } = useTheme();

  const fetchAll = useCallback(async () => {
    try {
      const [vRes, stRes, pRes] = await Promise.all([
        api.get('/variants'),
        api.get('/sugar-types'),
        api.get('/pricings'),
      ]);
      setVariants(vRes.data.variants.filter((v: any) => v.isActive));
      setSugarTypes(stRes.data.sugarTypes.filter((st: any) => st.isActive));
      setPricings(pRes.data.pricings);
    } catch { toast.error('Failed to load pricing data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getPrice = (variantId: string, sugarTypeId: string): number | null => {
    const p = pricings.find((pr: any) => pr.variantId === variantId && pr.sugarTypeId === sugarTypeId && pr.isActive);
    return p ? p.pricePerKg : null;
  };

  const getPricingId = (variantId: string, sugarTypeId: string): string | null => {
    const p = pricings.find((pr: any) => pr.variantId === variantId && pr.sugarTypeId === sugarTypeId);
    return p ? p.id : null;
  };

  const handleCellClick = (variantId: string, sugarTypeId: string) => {
    const current = getPrice(variantId, sugarTypeId);
    setEditCell({ variantId, sugarTypeId, price: current });
    setPriceInput(current !== null ? String(current) : '');
  };

  const handleSavePrice = async () => {
    if (!editCell) return;
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid price'); return; }
    try {
      const existingId = getPricingId(editCell.variantId, editCell.sugarTypeId);
      if (existingId) {
        await api.patch(`/pricings/${existingId}`, { pricePerKg: price });
      } else {
        await api.post('/pricings', { variantId: editCell.variantId, sugarTypeId: editCell.sugarTypeId, pricePerKg: price });
      }
      toast.success('Price updated');
      setEditCell(null);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save price'); }
  };

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
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Pricing Configuration
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Variant Pricing</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Set price per kg for each sugarcane variant and sugar type combination.</p>
        </div>
      </div>

      <TableWrapper title="Price Matrix" icon={DollarSign} delay={0.1}>
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className={`sticky left-0 z-10 px-3 sm:px-4 py-3 text-xs font-extrabold uppercase tracking-widest border-r border-b ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  Variant \ Type
                </th>
                {sugarTypes.map(st => (
                  <th key={st.id} className={`px-3 sm:px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-center border-b min-w-[120px] ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {st.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {variants.map((v, i) => (
                <tr key={v.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                  <td className={`sticky left-0 z-10 px-3 sm:px-4 py-3 font-bold text-xs sm:text-sm border-r ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'}`}>
                    {v.name}
                  </td>
                  {sugarTypes.map(st => {
                    const price = getPrice(v.id, st.id);
                    return (
                      <td key={st.id} className="px-2 sm:px-3 py-2 text-center">
                        <button
                          onClick={() => handleCellClick(v.id, st.id)}
                          className={`w-full py-2 sm:py-2.5 px-2 rounded-xl font-mono font-bold text-sm border transition-all min-h-[40px] ${
                            price !== null
                              ? (isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/50 hover:border-emerald-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400')
                              : (isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:bg-slate-700/50 hover:border-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300')
                          }`}
                        >
                          {price !== null ? `₱${price.toFixed(2)}` : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {variants.length === 0 && (
                <tr><td colSpan={sugarTypes.length + 1} className={`text-center py-16 font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No active variants found. Add variants first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableWrapper>

      {editCell && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setEditCell(null)}
        >
          <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-200/40'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className={`font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit Price</h2>
                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {variants.find(v => v.id === editCell.variantId)?.name} &times; {sugarTypes.find(st => st.id === editCell.sugarTypeId)?.name}
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditCell(null)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Price per Kg (₱)</label>
                  <input
                    type="number" step="0.01" min="0" autoFocus
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSavePrice(); if (e.key === 'Escape') setEditCell(null); }}
                    className={`w-full px-4 py-3 border rounded-xl outline-none font-mono font-bold text-lg text-center focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSavePrice}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-600/25 min-h-[44px] flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Save
                  </motion.button>
                  <button onClick={() => setEditCell(null)} className={`px-6 py-3 rounded-xl font-bold text-sm min-h-[44px] ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Cancel</button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}