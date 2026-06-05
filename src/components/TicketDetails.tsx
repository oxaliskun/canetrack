import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Clock, User, Truck, Scale, CheckCircle, FileText, Calendar, MapPin, Phone, Mail, Plus, Minus, Building2, Wallet, Camera, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
import api from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { formatWeight, formatDate } from '../lib/utils';

interface TicketDetailsProps {
  ticketId: string;
  onClose: () => void;
}

const timelineIcons: any = {
  CREATED: Clock,
  UPDATED: Clock,
};

const timelineColors: any = {
  CREATED: { dot: 'bg-blue-500', line: 'bg-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  UPDATED: { dot: 'bg-slate-500', line: 'bg-slate-300', bg: 'bg-slate-50 dark:bg-slate-950/30', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-800' },
};

function DetailRow({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon?: any }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
      {Icon && (
        <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-white text-slate-500'}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{value || '-'}</p>
      </div>
    </div>
  );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon?: any }) {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
        {Icon && <Icon className="w-4 h-4" />}
      </div>
      <h3 className={`font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    </div>
  );
}

export function TicketDetails({ ticketId, onClose }: TicketDetailsProps) {
  const [ticket, setTicket] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [expForm, setExpForm] = useState({ categoryId: '', amount: '', notes: '' });
  const [expPhoto, setExpPhoto] = useState<File | null>(null);
  const [expPhotoPreview, setExpPhotoPreview] = useState<string | null>(null);
  const [showExpForm, setShowExpForm] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({ method: 'BANK_TRANSFER', referenceNumber: '', grossAmount: '', deductions: '0', notes: '' });
  const [payProof, setPayProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const { user } = useAuth();
  const totalExp = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const isLocked = ticket?.status === 'PAID';
  const profitLoss = ticket?.payment ? Number(ticket.payment.netAmount) - totalExp : null;

  useEffect(() => {
    Promise.all([
      api.get(`/tickets/${ticketId}`).then(res => { setTicket(res.data.ticket); setTimeline(res.data.timeline || []); }),
      api.get(`/expenses?quedanId=${ticketId}`).then(res => setExpenses(res.data.expenses)),
      api.get('/expense-categories').then(res => setCategories(res.data.categories.filter((c: any) => c.isActive)))
    ]).then(() => setLoading(false)).catch(() => setLoading(false));
  }, [ticketId]);

  const handleExpPhotoSelect = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    }
    setExpPhoto(file);
    setExpPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.categoryId || !expForm.amount) return;
    try {
      let receiptUrl = '';
      if (expPhoto) {
        const fd = new FormData();
        fd.append('file', expPhoto);
        const { data } = await api.post('/upload', fd);
        receiptUrl = data.url;
      }
      await api.post('/expenses', { quedanId: ticketId, categoryId: expForm.categoryId, amount: Number(expForm.amount), notes: expForm.notes, receiptUrl });
      const res = await api.get(`/expenses?quedanId=${ticketId}`);
      setExpenses(res.data.expenses);
      setExpForm({ categoryId: '', amount: '', notes: '' });
      setExpPhoto(null);
      setExpPhotoPreview(null);
      setShowExpForm(false);
      toast.success('Expense added');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to add expense'); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Expense deleted');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const handleProcessPayment = async () => {
    if (!payForm.method) { toast.error('Select a payment method'); return; }
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
      await api.post('/payments', {
        quedanId: ticketId, method: payForm.method, referenceNumber: payForm.referenceNumber || undefined,
        grossAmount: gross, deductions, netAmount: net, notes: payForm.notes || undefined, proofUrl: proofUrl || undefined
      });
      await api.patch(`/tickets/${ticketId}`, { status: 'PAID' });
      toast.success('Payment processed successfully');
      setShowPaymentModal(false);
      setPayForm({ method: 'BANK_TRANSFER', referenceNumber: '', grossAmount: '', deductions: '0', notes: '' });
      setPayProof(null);
      const res = await api.get(`/tickets/${ticketId}`);
      setTicket(res.data.ticket);
      setTimeline(res.data.timeline || []);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to process payment'); }
  };

  const handlePrint = () => {
    if (!ticket) return;

    const printContent = `<!DOCTYPE html>
<html>
<head><title>CaneTrack - Quedan ${ticket.ticketNo}</title>
<style>
  @page { margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 0; }
  .print-container { max-width: 800px; margin: 0 auto; }
  .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #10b981; margin-bottom: 24px; }
  .header h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
  .header .subtitle { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
  .ticket-no { font-size: 32px; font-weight: 900; font-family: 'Courier New', monospace; color: #059669; margin: 8px 0; letter-spacing: 1px; }
  .status { display: inline-block; padding: 4px 16px; border-radius: 100px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; border: 1.5px solid; }
  .status.PAID { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
  .status.PENDING { background: #fefce8; color: #d97706; border-color: #fde68a; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #10b981; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
  .field { margin-bottom: 6px; }
  .field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
  .field-value { font-size: 14px; font-weight: 600; color: #1e293b; }
  .weight-highlight { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
  .weight-highlight .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .weight-highlight .row.total { border-top: 2px solid #10b981; margin-top: 6px; padding-top: 8px; font-weight: 800; }
  .info-group { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
  .info-group h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #10b981; margin-bottom: 8px; }
  .footer { text-align: center; padding-top: 20px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #94a3b8; margin-top: 24px; }
</style></head>
<body>
<div class="print-container">
  <div class="header">
    <div class="subtitle">CaneTrack Weighbridge Receipt</div>
    <div class="ticket-no">${ticket.ticketNo}</div>
    <div class="status ${ticket.status}">${ticket.status}</div>
  </div>

  <div class="section">
    <div class="section-title">Weights Summary</div>
    <div class="weight-highlight">
      <div class="row"><span class="field-label">Gross Weight</span><span class="field-value">${formatWeight(ticket.grossWeight)}</span></div>
      <div class="row"><span class="field-label">Tare Weight</span><span class="field-value">${formatWeight(ticket.tareWeight)}</span></div>
      <div class="row total"><span>Net Weight</span><span>${formatWeight(ticket.netWeight)}</span></div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-group">
      <h4>Bagon Information</h4>
      <div class="field"><div class="field-label">Plate Number</div><div class="field-value">${ticket.bagon?.plateNumber || '-'}</div></div>
      <div class="field"><div class="field-label">Farm Origin</div><div class="field-value">${ticket.farm?.farmName || '-'}</div></div>
      <div class="field"><div class="field-label">Farm Location</div><div class="field-value">${ticket.farm?.location || '-'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Timestamps</div>
    <div class="grid-2">
    <div class="info-group">
      <h4>Created</h4>
      <div class="field-value">${new Date(ticket.createdAt).toLocaleString()}</div>
    </div>
    <div class="info-group">
      <h4>Updated</h4>
      <div class="field-value">${new Date(ticket.updatedAt).toLocaleString()}</div>
    </div>
    </div>
  </div>
  </div>

  <div class="grid-2">
    <div class="info-group">
      <h4>Farmer</h4>
      <div class="field"><div class="field-value">${ticket.farm?.owner?.name || '-'}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${ticket.farm?.owner?.email || '-'}</div></div>
      <div class="field"><div class="field-label">Contact</div><div class="field-value">${ticket.farm?.owner?.contactNumber || '-'}</div></div>
    </div>
    <div class="info-group">
      <h4>Operator</h4>
      <div class="field"><div class="field-value">${ticket.farmer?.name || '-'}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${ticket.farmer?.email || '-'}</div></div>
      <div class="field"><div class="field-label">Contact</div><div class="field-value">${ticket.farmer?.contactNumber || '-'}</div></div>
    </div>
  </div>

  ${ticket.notes ? `<div class="info-group" style="margin-bottom: 16px;"><h4>Notes & Remarks</h4><div class="field-value">${ticket.notes}</div></div>` : ''}

  ${timeline.length > 0 ? `
  <div class="section">
    <div class="section-title">Activity Timeline</div>
    ${timeline.map((e: any) => `
    <div class="timeline-item">
      <div class="field-value">${e.label}: ${e.description} — ${new Date(e.date).toLocaleString()}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    CaneTrack v1.0 &bull; This is a computer-generated receipt &bull; ${new Date().toLocaleString()}
  </div>
</div>
</body></html>`;

    const printWindow = window.open('', '', 'width=800,height=700');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <>
    <AnimatePresence>
      {ticketId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/70' : 'bg-slate-900/50'}`} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-4xl rounded-[2rem] border shadow-2xl overflow-hidden my-8 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-black/40' : 'bg-white border-slate-200'}`}
            onClick={e => e.stopPropagation()}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className={`w-10 h-10 border-4 rounded-full animate-spin ${isDark ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-500/30 border-t-emerald-500'}`} />
              </div>
            ) : ticket ? (
              <>
                {/* Header */}
                <div className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-slate-50 to-white'}`}>
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500`} />
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl border shadow-sm ${isDark ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 border-emerald-800' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'}`}>
                        <FileText className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className={`font-black text-2xl sm:text-3xl tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.ticketNo}</h2>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {ticket.farm?.farmName || 'Unknown Farm'} &bull; {ticket.bagon?.plateNumber || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket?.status !== 'PAID' && (
                        <button onClick={() => { setPayForm({ method: 'BANK_TRANSFER', referenceNumber: '', grossAmount: '', deductions: '0', notes: '' }); setShowPaymentModal(true); }}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all shadow-sm ${isDark ? 'bg-blue-950/30 border-blue-800 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}>
                          <DollarSign className="w-4 h-4" /> Record Payment
                        </button>
                      )}
                      <button
                        onClick={handlePrint}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        <Printer className="w-4 h-4" /> Print
                      </button>
                      <button
                        onClick={onClose}
                        className={`p-2.5 rounded-xl transition-colors border ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-12rem)]">
                  {/* Weights Section */}
                  <div>
                    <SectionTitle title="Weights" icon={Scale} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <DetailRow label="Gross Weight" value={formatWeight(ticket.grossWeight)} icon={Plus} />
                      <DetailRow label="Tare Weight" value={formatWeight(ticket.tareWeight)} icon={Minus} />
                      <DetailRow label="Net Weight" value={formatWeight(ticket.netWeight)} icon={Scale} />
                      <DetailRow
                        label="Status"
                        value={ticket.status}
                        icon={ticket.status === 'PAID' ? CheckCircle : Clock}
                      />
                    </div>
                  </div>

                  {/* Key Parties */}
                  <div>
                    <SectionTitle title="Key Parties" icon={User} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className={`p-5 rounded-2xl border relative overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Farmer</span>
                        </div>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.farm?.owner?.name || ticket.farm?.ownerId || '-'}</p>
                        {ticket.farm?.owner?.email && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs">
                            <Mail className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.farm.owner.email}</span>
                          </div>
                        )}
                        {ticket.farm?.owner?.contactNumber && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <Phone className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.farm.owner.contactNumber}</span>
                          </div>
                        )}
                        {ticket.farm?.owner?.address && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <MapPin className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={`truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ticket.farm.owner.address}</span>
                          </div>
                        )}
                        {ticket.farm?.owner?.assignedMill && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <Building2 className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Mill: <strong>{ticket.farm.owner.assignedMill}</strong></span>
                          </div>
                        )}
                        <p className={`text-[10px] mt-3 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Farm: {ticket.farm?.farmName || '-'} {ticket.farm?.location ? `(${ticket.farm.location})` : ''}
                        </p>
                      </div>

                      <div className={`p-5 rounded-2xl border relative overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bagon</span>
                        </div>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.bagon?.plateNumber || '-'}</p>
                        {ticket.bagon?.type && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ticket.bagon.type} Bagon</p>
                        )}
                      </div>

                      <div className={`p-5 rounded-2xl border relative overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operator</span>
                        </div>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.farmer?.name || '-'}</p>
                        {ticket.farmer?.email && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs">
                            <Mail className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.farmer.email}</span>
                          </div>
                        )}
                        {ticket.farmer?.contactNumber && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <Phone className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.farmer.contactNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <SectionTitle title="Important Dates" icon={Calendar} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailRow label="Created" value={formatDate(ticket.createdAt)} icon={Clock} />
                      <DetailRow label="Updated" value={formatDate(ticket.updatedAt)} icon={Clock} />
                    </div>
                  </div>

                  {/* Notes */}
                  {ticket.notes && (
                    <div>
                      <SectionTitle title="Notes & Remarks" icon={FileText} />
                      <div className={`p-5 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{ticket.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Expenses */}
                  <div>
                    <SectionTitle title={`Delivery Expenses (${expenses.length})`} icon={Wallet} />
                    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      {expenses.length > 0 && (
                        <div className="divide-y">
                          {expenses.map((exp: any) => (
                            <div key={exp.id} className={`flex items-center justify-between px-4 sm:px-5 py-3 text-sm ${isDark ? 'divide-slate-700 hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{exp.category?.name}</span>
                                <span className={`font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>₱{Number(exp.amount).toFixed(2)}</span>
                                {exp.notes && <span className={`text-xs truncate hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{exp.notes}</span>}
                                {exp.receiptUrl && <button type="button" onClick={() => setLightboxUrl(exp.receiptUrl)} className="shrink-0"><img src={exp.receiptUrl} alt="Receipt" className="w-7 h-7 rounded-lg object-cover border border-blue-500/30 hover:border-blue-500 transition-colors" /></button>}
                              </div>
                              <button onClick={() => handleDeleteExpense(exp.id)} disabled={isLocked} className={`p-1.5 rounded-lg shrink-0 transition-colors ${isLocked ? 'text-slate-600 cursor-not-allowed' : isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} title={isLocked ? 'Locked' : 'Delete'}><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center justify-between px-4 sm:px-5 py-3 text-sm font-bold border-t ${isDark ? 'border-slate-700 bg-slate-800/50 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
                        <span>Total Expenses</span>
                        <span className="font-mono">₱{totalExp.toFixed(2)}</span>
                      </div>
                    </div>
                    {isLocked ? (
                      <div className={`mt-3 p-3 rounded-xl border text-center text-sm font-medium ${isDark ? 'border-slate-700 bg-slate-800/50 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                        Expenses are locked — quedan is paid.
                      </div>
                    ) : showExpForm ? (
                      <form onSubmit={handleAddExpense} className={`mt-3 p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                        <select required value={expForm.categoryId} onChange={e => setExpForm({...expForm, categoryId: e.target.value})} className={`w-full px-4 py-2.5 border rounded-xl outline-none text-sm font-medium min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                          <option value="">Select category...</option>
                          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                          <input required type="number" step="0.01" min="0" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: e.target.value})} placeholder="Amount" className={`w-full px-4 py-2.5 border rounded-xl outline-none text-sm font-mono font-bold min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                          <input type="file" accept="image/*" onChange={e => handleExpPhotoSelect(e.target.files?.[0] || null)} className={`w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:cursor-pointer min-h-[44px] ${isDark ? 'text-slate-300 file:bg-emerald-600 file:text-white' : 'text-slate-600 file:bg-emerald-500 file:text-white'}`} />
                        </div>
                        {expPhotoPreview && <img src={expPhotoPreview} alt="Receipt preview" className="h-20 rounded-xl object-cover border border-emerald-500/30" />}
                        <input value={expForm.notes} onChange={e => setExpForm({...expForm, notes: e.target.value})} placeholder="Notes (optional)" className={`w-full px-4 py-2.5 border rounded-xl outline-none text-sm font-medium min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-600/25 min-h-[44px]"><Plus className="w-4 h-4 inline mr-1" /> Add Expense</motion.button>
                          <button type="button" onClick={() => { setShowExpForm(false); setExpForm({ categoryId: '', amount: '', notes: '' }); setExpPhoto(null); setExpPhotoPreview(null); }} className={`px-5 py-2.5 rounded-xl font-bold text-sm min-h-[44px] ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Cancel</button>
                        </div>
                      </form>
                    ) : !isLocked && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowExpForm(true)} className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-600/25 min-h-[44px]"><Plus className="w-4 h-4" /> Add Expense</motion.button>
                    )}
                  </div>

                  {/* Payment Info */}
                  {ticket.payment && (
                    <div>
                      <SectionTitle title="Payment" icon={DollarSign} />
                      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className={`px-5 py-4 space-y-2 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                          <div className="flex justify-between text-sm"><span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Method</span><span className="font-bold">{ticket.payment.method}</span></div>
                          {ticket.payment.referenceNumber && <div className="flex justify-between text-sm"><span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reference</span><span className="font-mono font-bold">{ticket.payment.referenceNumber}</span></div>}
                          <div className="flex justify-between text-sm"><span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross</span><span className="font-mono font-bold">₱{Number(ticket.payment.grossAmount).toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm"><span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Deductions</span><span className="font-mono font-bold text-red-500">-₱{Number(ticket.payment.deductions).toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2"><span>Net Paid</span><span className="font-mono text-emerald-500">₱{Number(ticket.payment.netAmount).toFixed(2)}</span></div>
                          {totalExp > 0 && <div className="flex justify-between text-sm"><span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Expenses</span><span className="font-mono font-bold text-red-500">-₱{totalExp.toFixed(2)}</span></div>}
                          {profitLoss !== null && (
                            <div className={`flex justify-between text-sm font-bold border-t pt-2 mt-2 ${profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              <span>Profit / Loss</span>
                              <span className="font-mono">{profitLoss >= 0 ? '+' : ''}₱{profitLoss.toFixed(2)}</span>
                            </div>
                          )}
                          {ticket.payment.notes && <div className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ticket.payment.notes}</div>}
                          {ticket.payment.proofUrl && (
                            <button type="button" onClick={() => setLightboxUrl(ticket.payment.proofUrl)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400">
                              <Camera className="w-3.5 h-3.5" /> View Proof
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div>
                      <SectionTitle title="Activity Timeline" icon={Clock} />
                      <div className="space-y-3">
                        {timeline.map((event: any, i: number) => {
                          const Icon = timelineIcons[event.type] || Clock;
                          const colors = timelineColors[event.type] || timelineColors.UPDATED;
                          return (
                            <div key={i} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${colors.dot} ring-4 ${isDark ? 'ring-slate-900' : 'ring-white'}`} />
                                {i < timeline.length - 1 && <div className={`w-0.5 flex-1 ${colors.line}`} />}
                              </div>
                              <div className={`flex-1 pb-4 ${i < timeline.length - 1 ? '' : ''}`}>
                                <div className={`p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Icon className={`w-4 h-4 ${colors.text}`} />
                                    <span className={`text-sm font-extrabold ${colors.text}`}>{event.label}</span>
                                  </div>
                                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{event.description}</p>
                                  <p className={`text-[10px] font-semibold mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(event.date)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ticket not found</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Payment Modal */}
    <AnimatePresence>
      {showPaymentModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
          <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-slate-900/50'}`} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`relative w-full max-w-md rounded-2xl sm:rounded-[2rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}><DollarSign className="w-5 h-5 text-blue-500" /></div>
                  <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Record Payment</h2>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className={`p-2 rounded-xl ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); handleProcessPayment(); }} className="space-y-4">
                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Method *</label>
                  <select required value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})} className={`w-full px-4 py-3 border rounded-xl outline-none text-sm font-medium min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="GCASH">GCash</option>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
                <input value={payForm.referenceNumber} onChange={e => setPayForm({...payForm, referenceNumber: e.target.value})} placeholder="Reference Number" className={`w-full px-4 py-3 border rounded-xl outline-none text-sm font-medium min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross Amount *</label>
                    <input required type="number" step="0.01" min="0" value={payForm.grossAmount} onChange={e => setPayForm({...payForm, grossAmount: e.target.value})} className={`w-full px-4 py-3 border rounded-xl outline-none text-sm font-mono font-bold min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Deductions</label>
                    <input type="number" step="0.01" min="0" value={payForm.deductions} onChange={e => setPayForm({...payForm, deductions: e.target.value})} className={`w-full px-4 py-3 border rounded-xl outline-none text-sm font-mono font-bold min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
                <div className={`p-4 rounded-xl border text-center text-sm font-bold ${isDark ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  Net: ₱{Math.max(0, (parseFloat(payForm.grossAmount) || 0) - (parseFloat(payForm.deductions) || 0)).toFixed(2)}
                </div>
                <input value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} placeholder="Notes" className={`w-full px-4 py-3 border rounded-xl outline-none text-sm font-medium min-h-[44px] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                <input type="file" accept="image/*" onChange={e => setPayProof(e.target.files?.[0] || null)} className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:cursor-pointer min-h-[44px] ${isDark ? 'text-slate-300 file:bg-emerald-600 file:text-white' : 'text-slate-600 file:bg-emerald-500 file:text-white'}`} />
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-blue-600/30 min-h-[44px]"><DollarSign className="w-4 h-4 inline mr-1" /> Record Payment</button>
                  <button type="button" onClick={() => setShowPaymentModal(false)} className={`px-6 py-3 rounded-xl font-bold text-sm min-h-[44px] ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Cancel</button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Lightbox */}
    <AnimatePresence>
      {lightboxUrl && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
          <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={lightboxUrl} alt="Full view" className="max-w-full max-h-full rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
