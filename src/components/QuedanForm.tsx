import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { Truck, Scale, Camera, X, Eye, FlaskConical, Building2 } from 'lucide-react';

export function QuedanForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({ truckPlate: '', truckId: '', farmId: '', grossWeight: '', tareWeight: '', brix: '', pol: '', sampleCollected: false, variantId: '', sugarTypeId: '' });
  const [farms, setFarms] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [variants, setVariants] = useState([]);
  const [sugarTypes, setSugarTypes] = useState([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!user) return;
    api.get('/farms').then(res => setFarms(res.data.farms));
    api.get('/trucks').then(res => setTrucks(res.data.trucks));
    api.get('/variants').then(res => setVariants(res.data.variants));
    api.get('/sugar-types').then(res => setSugarTypes(res.data.sugarTypes));
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setPhotos(files);
    setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photoPreviews[i]);
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPhotoPreviews(p => p.filter((_, idx) => idx !== i));
  };

  useEffect(() => { return () => photoPreviews.forEach(URL.revokeObjectURL); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const { data } = await api.post('/tickets', form);
      const ticketId = data.id;
      for (const photo of photos) {
        const fd = new FormData();
        fd.append('file', photo);
        const { data: uploadData } = await api.post('/upload', fd);
        await api.post('/delivery-receipts', { quedanId: ticketId, imageUrl: uploadData.url });
      }
      toast.success('Quedan encoded successfully.');
      setForm({ truckPlate: '', truckId: '', farmId: '', grossWeight: '', tareWeight: '', brix: '', pol: '', sampleCollected: false, variantId: '', sugarTypeId: '' });
      setPhotos([]);
      setPhotoPreviews([]);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to encode ticket.');
    } finally { setUploading(false); }
  };

  return (
    <form className={`p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-[2rem] border space-y-4 sm:space-y-5 lg:space-y-6 relative overflow-hidden group ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/30' : 'bg-white shadow-xl shadow-slate-200/50 border-slate-200'}`} onSubmit={handleSubmit}>
      <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-blue-500 via-blue-400 to-emerald-400" />
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-50 pointer-events-none ${isDark ? 'bg-blue-950/50' : 'bg-blue-50'}`} />
      <div className={`flex items-center justify-between pb-3 sm:pb-4 ${isDark ? 'border-slate-700' : 'border-slate-100 border-b'}`}>
        <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Encode Ticket</h3>
        <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}><Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /></div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <div>
          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Truck Plate</label>
          <select required value={form.truckId} onChange={e => { const t = trucks.find((t: any) => t.id === e.target.value); setForm({...form, truckId: e.target.value, truckPlate: t ? t.plateNumber : ''}) } } className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm sm:text-base font-semibold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
            <option value="">Select a Truck...</option>
            {trucks.filter((t: any) => !t.isArchived).map((t: any) => <option key={t.id} value={t.id}>{t.plateNumber} - {t.make} {t.model} ({(t.capacity / 1000).toFixed(1)}t)</option>)}
          </select>
        </div>
        <div>
          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Farm Origin</label>
          <select required value={form.farmId} onChange={e=>setForm({...form, farmId: e.target.value})} className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm sm:text-base cursor-pointer shadow-sm font-semibold min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
            <option value="" disabled>Select a Farm...</option>
            {farms.map((f: any) => <option key={f.id} value={f.id}>{f.farmName}</option>)}
          </select>
          {form.farmId && (() => { const f = farms.find((f: any) => f.id === form.farmId); return f?.owner?.assignedMill ? (
            <div className={`flex items-center gap-2 mt-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium min-h-[36px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <Building2 className="w-3.5 h-3.5 shrink-0" /> Mill/Central: <span className="font-bold">{f.owner.assignedMill}</span>
            </div>
          ) : null})()}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross (kg)</label>
            <input required type="number" value={form.grossWeight} onChange={e=>setForm({...form, grossWeight: e.target.value})} className={`w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm sm:text-base font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="0" />
          </div>
          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tare (kg)</label>
            <input required type="number" value={form.tareWeight} onChange={e=>setForm({...form, tareWeight: e.target.value})} className={`w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm sm:text-base font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="0" />
          </div>
        </div>
        <div className={`border p-3 sm:p-4 rounded-xl sm:rounded-2xl flex justify-between items-center text-xs sm:text-sm ${isDark ? 'bg-gradient-to-r from-blue-950/50 to-emerald-950/50 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-100'}`}>
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Calculated Mill Weight:</span>
          <span className="font-mono font-black text-base sm:text-lg lg:text-xl text-blue-500">
            {Math.max(0, (Number(form.grossWeight) || 0) - (Number(form.tareWeight) || 0))} kg
          </span>
        </div>

        <details className={`rounded-xl sm:rounded-2xl border overflow-hidden group ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <summary className={`flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 cursor-pointer text-xs sm:text-sm font-bold select-none min-h-[44px] ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
            <span className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Quality Analysis</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </summary>
          <div className={`p-4 sm:p-5 space-y-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Brix (0–100)</label>
                <input type="number" min="0" max="100" step="0.1" value={form.brix} onChange={e => setForm({...form, brix: e.target.value})} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-mono text-sm font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="0.0" />
              </div>
              <div>
                <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pol (0–100)</label>
                <input type="number" min="0" max="100" step="0.1" value={form.pol} onChange={e => setForm({...form, pol: e.target.value})} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-mono text-sm font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="0.0" />
              </div>
            </div>
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Purity (auto-computed)</label>
              <div className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl font-mono text-sm font-black shadow-sm min-h-[44px] flex items-center ${isDark ? 'bg-slate-800/50 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'}`}>
                {form.brix && Number(form.brix) > 0 ? ((Number(form.pol) || 0) / Number(form.brix) * 100).toFixed(2) + '%' : '—'}
              </div>
            </div>
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Variety *</label>
              <select required value={form.variantId} onChange={e => setForm({...form, variantId: e.target.value})} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-sm font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                <option value="">Select variety...</option>
                {variants.filter((v: any) => v.isActive).map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sugar Type *</label>
              <select required value={form.sugarTypeId} onChange={e => setForm({...form, sugarTypeId: e.target.value})} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-sm font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                <option value="">Select sugar type...</option>
                {sugarTypes.filter((s: any) => s.isActive).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <input type="checkbox" checked={form.sampleCollected} onChange={e => setForm({...form, sampleCollected: e.target.checked})} className="w-5 h-5 rounded-lg border-2 accent-emerald-500 cursor-pointer" />
              <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sample Collected</span>
            </label>
          </div>
        </details>

        <div className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 space-y-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <label className={`flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Camera className="w-4 h-4" /> Delivery Receipt Photos ({photos.length}/3)</label>
          {photoPreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border shrink-0">
                  <img src={preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">×</button>
                </div>
              ))}
            </div>
          )}
          <input type="file" multiple accept="image/*" onChange={handleFileChange} className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:cursor-pointer min-h-[44px] ${isDark ? 'text-slate-300 file:bg-emerald-600 file:text-white' : 'text-slate-600 file:bg-emerald-500 file:text-white'}`} />
        </div>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={uploading} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-blue-600/30 text-base sm:text-lg min-h-[48px] disabled:opacity-50">
        Issue Quedan
      </motion.button>
    </form>
  );
}
