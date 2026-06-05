import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Search, Eye, TrendingUp, Wallet, FileText, Plus, X, Save, Trash2, Camera, Edit2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { TicketDetails } from '../../components/TicketDetails';
import { formatDate, formatCurrency } from '../../lib/utils';

export function FarmerPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [payForm, setPayForm] = useState({ quedanId: '', method: 'CASH', referenceNumber: '', pricePerKg: '', grossAmount: '', deductions: '0', notes: '' });
  const [payProof, setPayProof] = useState<File | null>(null);
  const [payProofPreview, setPayProofPreview] = useState<string | null>(null);
  const { isDark } = useTheme();

  const fetchData = async () => {
    try {
      const res = await api.get('/tickets');
      setPayments(res.data.tickets.filter((t: any) => t.payment));
      setAllTickets(res.data.tickets);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = payments.filter((t: any) =>
    t.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
    t.payment.method.toLowerCase().includes(search.toLowerCase()) ||
    (t.payment.referenceNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalGross = filtered.reduce((s: number, t: any) => s + Number(t.payment.grossAmount), 0);
  const totalDeductions = filtered.reduce((s: number, t: any) => s + Number(t.payment.deductions), 0);
  const totalNet = filtered.reduce((s: number, t: any) => s + Number(t.payment.netAmount), 0);

  const unpaidTickets = allTickets.filter((t: any) => !t.payment);

  const resetForm = () => {
    setPayForm({ quedanId: '', method: 'CASH', referenceNumber: '', pricePerKg: '', grossAmount: '', deductions: '0', notes: '' });
    setPayProof(null);
    setPayProofPreview(null);
    setEditingPayment(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (ticket: any) => {
    const p = ticket.payment;
    const netWt = Number(ticket.netWeight) || 0;
    const price = netWt > 0 ? (Number(p.grossAmount) / netWt).toFixed(2) : '';
    setEditingPayment(p);
    setPayForm({
      quedanId: ticket.id,
      method: p.method || 'CASH',
      referenceNumber: p.referenceNumber || '',
      pricePerKg: price,
      grossAmount: p.grossAmount?.toString() || '',
      deductions: p.deductions?.toString() || '0',
      notes: p.notes || '',
    });
    setPayProofPreview(null);
    setPayProof(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    }
    setPayProof(file);
    setPayProofPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(payForm.grossAmount);
    const deductions = parseFloat(payForm.deductions || '0');
    const net = gross - deductions;
    if (isNaN(gross) || gross <= 0) { toast.error('Enter a valid gross amount'); return; }
    try {
      let proofUrl = '';
      if (payProof) {
        const fd = new FormData();
        fd.append('file', payProof);
        const { data } = await api.post('/upload', fd);
        proofUrl = data.url;
      }

      if (editingPayment) {
        await api.patch(`/payments/${editingPayment.id}`, {
          method: payForm.method,
          referenceNumber: payForm.referenceNumber || null,
          grossAmount: gross,
          deductions,
          netAmount: net,
          notes: payForm.notes || null,
          ...(proofUrl ? { proofUrl } : {}),
        });
        toast.success('Payment updated successfully');
      } else {
        await api.post('/payments', {
          quedanId: payForm.quedanId,
          method: payForm.method,
          referenceNumber: payForm.referenceNumber || null,
          grossAmount: gross,
          deductions,
          netAmount: net,
          notes: payForm.notes || null,
          proofUrl: proofUrl || undefined,
        });
        await api.patch(`/tickets/${payForm.quedanId}`, { status: 'PAID' });
        toast.success('Payment recorded successfully');
      }

      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save payment');
    }
  };

  const handleDeletePayment = async (ticket: any) => {
    if (!confirm('Delete this payment record? The ticket will be reset to PENDING.')) return;
    try {
      await api.delete(`/payments/${ticket.payment.id}`);
      await api.patch(`/tickets/${ticket.id}`, { status: 'PENDING' });
      toast.success('Payment deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <div className={`absolute top-0 right-0 w-[25%] h-[25%] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-blue-950/30' : 'bg-blue-50/50'}`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 relative">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Payment Records
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Payment History</h1>
          <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Record and view payments received from the mill.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/25 transition-all min-h-[44px]">
          <Plus className="w-5 h-5" /> Record Payment
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-emerald-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Gross</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-emerald-100 text-emerald-700`}><TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalGross)}</p>
          <p className={`text-xs sm:text-sm mt-1 ml-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{filtered.length} payments</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-red-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Deductions</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-red-100 text-red-700`}><Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalDeductions)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 blur-2xl opacity-20 rounded-full bg-blue-500`} />
          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <p className={`font-extrabold text-[10px] sm:text-[11px] uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Net Earnings</p>
            <div className={`p-2 sm:p-2.5 rounded-xl bg-blue-100 text-blue-700`}><DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 text-emerald-500 truncate`}>{formatCurrency(totalNet)}</p>
        </motion.div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-3.5 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} placeholder="Search by quedan #, method, or reference..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col items-center justify-center py-16 sm:py-32 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <div className={`w-24 h-24 shadow-sm border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <DollarSign className="w-12 h-12 text-blue-500" />
          </div>
          <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>No payments yet</p>
          <p className="text-base mt-2 font-medium">Record your first payment from the mill.</p>
        </motion.div>
      ) : (
        <div className={`rounded-2xl border overflow-x-auto ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`border-b uppercase text-[10px] font-extrabold tracking-widest ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-500'}`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Quedan #</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Farm</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Date</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Method</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Gross</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Deductions</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Net</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5">Status</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {filtered.map((t: any) => (
                <tr key={t.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`font-mono font-bold text-sm truncate max-w-[130px] inline-block align-middle ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.ticketNo}</span>
                  </td>
                  <td data-label="Farm" className={`px-4 sm:px-6 py-4 sm:py-5 truncate max-w-[120px] sm:max-w-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.farm?.farmName || '-'}</td>
                  <td data-label="Date" className={`px-4 sm:px-6 py-4 sm:py-5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(t.payment.createdAt)}</td>
                  <td data-label="Method" className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{t.payment.method}</span>
                  </td>
                  <td data-label="Gross" className="px-4 sm:px-6 py-4 sm:py-5 font-mono font-bold">{formatCurrency(t.payment.grossAmount)}</td>
                  <td data-label="Deductions" className="px-4 sm:px-6 py-4 sm:py-5 font-mono font-bold text-red-500">{formatCurrency(t.payment.deductions)}</td>
                  <td data-label="Net" className="px-4 sm:px-6 py-4 sm:py-5 font-mono font-bold text-emerald-500">{formatCurrency(t.payment.netAmount)}</td>
                  <td data-label="Status" className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${t.payment.status === 'PAID' ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200') : (isDark ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-700 border-amber-200')}`}>{t.payment.status}</span>
                  </td>
                  <td data-label="Actions" className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditModal(t)} className={`p-2 rounded-xl transition-colors min-h-[36px] ${isDark ? 'text-blue-400 hover:bg-blue-950/50' : 'text-blue-600 hover:bg-blue-50'}`} title="Edit Payment"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeletePayment(t)} className={`p-2 rounded-xl transition-colors min-h-[36px] ${isDark ? 'text-red-400 hover:bg-red-950/50' : 'text-red-600 hover:bg-red-50'}`} title="Delete Payment"><Trash2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setSelectedTicketId(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all min-h-[36px] ${isDark ? 'text-blue-400 border-blue-800 hover:bg-blue-950/50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicketId && <TicketDetails ticketId={selectedTicketId} onClose={() => { setSelectedTicketId(null); fetchData(); }} />}

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setModalOpen(false); resetForm(); }}>
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg rounded-2xl sm:rounded-[2rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-200/40'}`}
              onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-500" />
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                      <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {editingPayment ? 'Edit Payment' : 'Record Payment'}
                    </h2>
                  </div>
                  <button onClick={() => { setModalOpen(false); resetForm(); }} className={`p-2 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <form onSubmit={handleRecordPayment} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quedan *</label>
                    {editingPayment ? (
                      <div className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl font-mono font-bold text-sm shadow-sm min-h-[44px] flex items-center ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>
                        {allTickets.find((t: any) => t.id === payForm.quedanId)?.ticketNo || payForm.quedanId}
                      </div>
                    ) : (
                      <select required value={payForm.quedanId} onChange={e => { const id = e.target.value; const ticket = allTickets.find((t: any) => t.id === id); const netWt = Number(ticket?.netWeight) || 0; const ppk = parseFloat(payForm.pricePerKg) || 0; setPayForm({...payForm, quedanId: id, grossAmount: ppk > 0 && netWt > 0 ? (netWt * ppk).toFixed(2) : '' }); }}
                        className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-semibold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                        <option value="">Select quedan...</option>
                        {unpaidTickets.map((t: any) => <option key={t.id} value={t.id}>{t.ticketNo} — {t.farm?.farmName || 'Unknown'}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Method *</label>
                      <select required value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})}
                        className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-semibold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="GCASH">GCash</option>
                        <option value="CHECK">Check</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reference</label>
                      <input value={payForm.referenceNumber} onChange={e => setPayForm({...payForm, referenceNumber: e.target.value})}
                        className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                        placeholder="OR # or ref" />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Price per kg (₱)</label>
                    <input type="number" step="0.01" min="0" value={payForm.pricePerKg} onChange={e => { const ppk = e.target.value; const ticket = allTickets.find((t: any) => t.id === payForm.quedanId); const netWt = Number(ticket?.netWeight) || 0; const ppkNum = parseFloat(ppk) || 0; setPayForm({...payForm, pricePerKg: ppk, grossAmount: ppkNum > 0 && netWt > 0 ? (netWt * ppkNum).toFixed(2) : payForm.grossAmount }); }}
                      className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="e.g. 2.50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross *</label>
                      <input required type="number" step="0.01" min="0" value={payForm.grossAmount} onChange={e => setPayForm({...payForm, grossAmount: e.target.value})}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Deductions</label>
                      <input type="number" step="0.01" min="0" value={payForm.deductions} onChange={e => setPayForm({...payForm, deductions: e.target.value})}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono text-sm font-bold shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border text-center text-sm font-bold ${isDark ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    Net: ₱{Math.max(0, (parseFloat(payForm.grossAmount) || 0) - (parseFloat(payForm.deductions) || 0)).toFixed(2)}
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Notes</label>
                    <textarea value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} rows={2}
                      className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm shadow-sm min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                      placeholder="Optional notes..." />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Proof of Payment</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:cursor-pointer min-h-[44px] ${isDark ? 'text-slate-300 file:bg-emerald-600 file:text-white' : 'text-slate-600 file:bg-emerald-500 file:text-white'}`} />
                    {payProofPreview && <img src={payProofPreview} alt="Proof preview" className="h-20 rounded-xl object-cover border border-emerald-500/30 mt-2" />}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-blue-600/30 text-sm flex items-center justify-center gap-2 min-h-[44px]">
                    <Save className="w-4 h-4" /> {editingPayment ? 'Update Payment' : 'Save Payment'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
