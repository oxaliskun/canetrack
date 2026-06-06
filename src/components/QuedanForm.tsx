import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { Truck, Scale, Camera, X, Eye, FlaskConical, Building2, Truck as TruckIcon, Calendar, User as UserIcon, Leaf, CheckCircle2 } from 'lucide-react';

const CANE_VARIETIES = [
  'VMC 84-524', 'Phil 93-48', 'Phil 2000-2567', 'Phil 2000-2601 (Lanas)',
  'Phil 2000-2568 (Itaas)', 'Phil 2002-0732 (Lakit)', 'Phil 2004-1481 (Latian)',
  'Phil 2005-0448 (Mamco)', 'Phil 2005-0464 (Maayon)', 'Phil 2007-0050 (Bufag)'
];

const LOAD_REMARKS = [
  { value: 'FC', label: 'Full Clean (FC)' },
  { value: 'BS', label: 'Burned Standing (BS)' },
  { value: 'BF', label: 'Burned Fallen (BF)' },
  { value: 'G', label: 'Green (G)' },
  { value: 'LO', label: 'Lateral / Others (LO)' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

export function QuedanForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({ bagonPlate: '', bagonId: '', truckId: '', farmId: '', grossWeight: '', tareWeight: '', brix: '', pol: '', sampleCollected: false, truckNumber: '', deliveryDate: todayStr(), authorizedSignatory: '', caneVariety: '', loadRemarks: '', unloadingType: '' });
  const [farms, setFarms] = useState([]);
  const [bagons, setBagons] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { isDark } = useTheme();

  const selectedTruck = trucks.find((t: any) => t.id === form.truckId) as any;
  const compatibleBagons = selectedTruck
    ? bagons.filter((b: any) => !b.isArchived && selectedTruck.compatibleTypes.split(',').includes(b.type))
    : bagons.filter((b: any) => !b.isArchived);

  useEffect(() => {
    if (!user) return;
    api.get('/farms').then(res => setFarms(res.data.farms));
    api.get('/bagon').then(res => setBagons(res.data.bagons));
    api.get('/trucks').then(res => setTrucks(res.data.trucks));
  }, [user]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []) as File[];
    const combined = [...photos, ...incoming].slice(0, 3);
    setPhotos(combined);
    setPhotoPreviews(combined.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photoPreviews[i]);
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPhotoPreviews(p => p.filter((_, idx) => idx !== i));
  };

  useEffect(() => { return () => photoPreviews.forEach(URL.revokeObjectURL); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const { data } = await api.post('/tickets', {
        bagonId: form.bagonId,
        truckId: form.truckId || undefined,
        farmId: form.farmId,
        grossWeight: form.grossWeight,
        tareWeight: form.tareWeight,
        brix: form.brix || undefined,
        pol: form.pol || undefined,
        sampleCollected: form.sampleCollected,
        truckNumber: form.truckNumber || undefined,
        deliveryDate: form.deliveryDate || undefined,
        authorizedSignatory: form.authorizedSignatory || undefined,
        caneVariety: form.caneVariety || undefined,
        loadRemarks: form.loadRemarks || undefined,
        unloadingType: form.unloadingType || undefined,
      });
      const ticketId = data.id;
      for (const photo of photos) {
        const fd = new FormData();
        fd.append('file', photo);
        const { data: uploadData } = await api.post('/upload', fd);
        await api.post('/delivery-receipts', { quedanId: ticketId, imageUrl: uploadData.url });
      }
      toast.success('Quedan encoded successfully.');
      setForm({ bagonPlate: '', bagonId: '', truckId: '', farmId: '', grossWeight: '', tareWeight: '', brix: '', pol: '', sampleCollected: false, truckNumber: '', deliveryDate: todayStr(), authorizedSignatory: '', caneVariety: '', loadRemarks: '', unloadingType: '' });
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
          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Farm Origin</label>
            <select required value={form.farmId} onChange={e => { const f = farms.find((x: any) => x.id === e.target.value) as any; setForm({...form, farmId: e.target.value, caneVariety: f?.cropType || '', authorizedSignatory: f?.owner?.name ? f.owner.name.toUpperCase() : ''}) }} className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm sm:text-base cursor-pointer shadow-sm font-semibold min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
            <option value="" disabled>Select a Farm...</option>
            {farms.map((f: any) => <option key={f.id} value={f.id}>{f.farmName}</option>)}
          </select>
          {form.farmId && (() => { const f = farms.find((f: any) => f.id === form.farmId); return f?.owner?.assignedMill ? (
            <div className={`flex items-center gap-2 mt-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium min-h-[36px] ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <Building2 className="w-3.5 h-3.5 shrink-0" /> Mill/Central: <span className="font-bold">{f.owner.assignedMill}</span>
            </div>
          ) : null})()}
        </div>

        <div>
          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Truck</label>
          <select value={form.truckId} onChange={e => { const t = trucks.find((tr: any) => tr.id === e.target.value) as any; setForm({...form, truckId: e.target.value, bagonId: '', bagonPlate: '', tareWeight: '', truckNumber: t?.plateNumber || form.truckNumber, }) } } className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm sm:text-base font-semibold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
            <option value="">— No truck selected —</option>
            {trucks.filter((t: any) => !t.isArchived).map((t: any) => <option key={t.id} value={t.id}>{t.plateNumber} — {t.driverName}</option>)}
          </select>
        </div>

        <div>
          <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trailer (Bagon)</label>
          <select required value={form.bagonId} onChange={e => { const b = bagons.find((b: any) => b.id === e.target.value); setForm({...form, bagonId: e.target.value, bagonPlate: b ? b.plateNumber : '', tareWeight: b?.tareWeight ? b.tareWeight.toString() : ''}) } } className={`w-full px-4 sm:px-5 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm sm:text-base font-semibold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
            <option value="">Select a Trailer...</option>
            {compatibleBagons.map((b: any) => <option key={b.id} value={b.id}>{b.plateNumber} ({b.type})</option>)}
          </select>
          {selectedTruck && compatibleBagons.length === 0 && (
            <div className={`flex items-center gap-2 mt-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium min-h-[36px] ${isDark ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              No compatible trailer for this truck
            </div>
          )}
          {selectedTruck && form.bagonId && !compatibleBagons.find((b: any) => b.id === form.bagonId) && (
            <div className={`flex items-center gap-2 mt-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium min-h-[36px] ${isDark ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              Incompatible: this trailer type is not supported by the selected truck
            </div>
          )}
        </div>

        <div className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 space-y-3 sm:space-y-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <TruckIcon className="w-4 h-4 text-blue-500" />
            <span className={`text-[11px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Delivery Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Truck No.</label>
              <input type="text" value={form.truckNumber} onChange={e => setForm({...form, truckNumber: e.target.value})}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                placeholder="e.g. 27065" />
            </div>
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Delivery Date *</label>
              <input required type="date" value={form.deliveryDate} onChange={e => setForm({...form, deliveryDate: e.target.value})}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
            </div>
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Authorized Signatory</label>
              <input type="text" value={form.authorizedSignatory} onChange={e => setForm({...form, authorizedSignatory: e.target.value})}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                placeholder="Sino naghatod?" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross (kg)</label>
            <input required type="number" value={form.grossWeight} onChange={e=>setForm({...form, grossWeight: e.target.value})} className={`w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm sm:text-base font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="0" />
          </div>
          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tare (kg)</label>
            <div className="relative">
              <input readOnly type="number" value={form.tareWeight} className={`w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-xl sm:rounded-2xl font-mono text-sm sm:text-base font-bold shadow-sm min-h-[44px] cursor-not-allowed opacity-80 ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'}`} placeholder="0" />
              {form.tareWeight && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">({(Number(form.tareWeight) / 1000).toFixed(2)}t)</span>}
            </div>
          </div>
        </div>
        <div className={`border p-3 sm:p-4 rounded-xl sm:rounded-2xl flex justify-between items-center text-xs sm:text-sm ${isDark ? 'bg-gradient-to-r from-blue-950/50 to-emerald-950/50 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-100'}`}>
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Net Weight:</span>
          <span className="font-mono font-black text-base sm:text-lg lg:text-xl text-blue-500">
            {Math.max(0, (Number(form.grossWeight) || 0) - (Number(form.tareWeight) || 0))} kg
          </span>
        </div>

        <div className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 space-y-3 sm:space-y-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span className={`text-[11px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cane Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cane Variety</label>
              <input list="caneVarieties" value={form.caneVariety} onChange={e => setForm({...form, caneVariety: e.target.value})}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                placeholder="Select or type variety..." />
              <datalist id="caneVarieties">
                {CANE_VARIETIES.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Load Remarks</label>
              <select value={form.loadRemarks} onChange={e => setForm({...form, loadRemarks: e.target.value})}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <option value="">— Select —</option>
                {LOAD_REMARKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Unloading Type</label>
              <div className="flex gap-2 h-full items-center pt-1">
                {['GANTRY', 'DIRECT_DUMP'].map(t => (
                  <label key={t} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-xs font-bold min-h-[44px] flex-1 ${form.unloadingType === t
                    ? isDark ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                    : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="unloadingType" value={t} checked={form.unloadingType === t} onChange={e => setForm({...form, unloadingType: e.target.value})} className="sr-only" />
                    <CheckCircle2 className={`w-3.5 h-3.5 ${form.unloadingType === t ? 'opacity-100' : 'opacity-30'}`} />
                    {t === 'GANTRY' ? 'Gantry' : 'Direct Dump'}
                  </label>
                ))}
              </div>
            </div>
          </div>
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
               <div className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl font-mono text-sm font-black shadow-sm min-h-[44px] flex items-center truncate ${isDark ? 'bg-slate-800/50 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'}`}>
                 {form.brix && Number(form.brix) > 0 ? ((Number(form.pol) || 0) / Number(form.brix) * 100).toFixed(2) + '%' : '—'}
               </div>
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
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-base font-bold">×</button>
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
