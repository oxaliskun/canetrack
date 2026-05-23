import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Clock, User, Truck, Scale, AlertTriangle, CheckCircle, FileText, Calendar, MapPin, Phone, Mail, Eye, Plus, Minus } from 'lucide-react';
import api from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge } from './StatusBadge';
import { formatWeight, formatDate } from '../lib/utils';

interface TicketDetailsProps {
  ticketId: string;
  onClose: () => void;
}

const timelineIcons: any = {
  CREATED: Clock,
  RECONCILED: CheckCircle,
  FLAGGED: AlertTriangle,
  RESOLVED: CheckCircle,
  UPDATED: Clock,
};

const timelineColors: any = {
  CREATED: { dot: 'bg-blue-500', line: 'bg-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  RECONCILED: { dot: 'bg-emerald-500', line: 'bg-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  FLAGGED: { dot: 'bg-red-500', line: 'bg-red-300', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  RESOLVED: { dot: 'bg-purple-500', line: 'bg-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
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
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    api.get(`/tickets/${ticketId}`)
      .then(res => {
        setTicket(res.data.ticket);
        setTimeline(res.data.timeline || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticketId]);

  const handlePrint = () => {
    if (!ticket) return;
    const variance = ticket.reconciliation
      ? `${ticket.reconciliation.difference > 0 ? '+' : ''}${ticket.reconciliation.difference} kg`
      : 'N/A';
    const refineryWt = ticket.reconciliation
      ? formatWeight(ticket.reconciliation.refineryWeight)
      : 'N/A';

    const printContent = `<!DOCTYPE html>
<html>
<head><title>CaneTrack - Ticket ${ticket.ticketNo}</title>
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
  .status.RECONCILED { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
  .status.PENDING { background: #fefce8; color: #d97706; border-color: #fde68a; }
  .status.DISPUTED { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
  .status.SUBMITTED { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
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
  .timeline-section { margin-top: 24px; }
  .timeline-item { display: flex; gap: 12px; padding: 8px 0; }
  .timeline-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
  .timeline-dot.created { background: #3b82f6; }
  .timeline-dot.reconciled { background: #10b981; }
  .timeline-dot.flagged { background: #ef4444; }
  .timeline-dot.resolved { background: #8b5cf6; }
  .timeline-content .tl-label { font-size: 13px; font-weight: 700; }
  .timeline-content .tl-desc { font-size: 11px; color: #64748b; margin-top: 1px; }
  .timeline-content .tl-date { font-size: 10px; color: #94a3b8; margin-top: 1px; }
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
      <div class="row total"><span>Mill Weight</span><span>${formatWeight(ticket.millWeight)}</span></div>
      <div class="row" style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;"><span class="field-label">Refinery Weight</span><span class="field-value">${refineryWt}</span></div>
      <div class="row"><span class="field-label">Variance</span><span class="field-value">${variance}</span></div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-group">
      <h4>Truck Information</h4>
      <div class="field"><div class="field-label">Plate Number</div><div class="field-value">${ticket.truckPlate}</div></div>
      <div class="field"><div class="field-label">Farm Origin</div><div class="field-value">${ticket.farm?.farmName || '-'}</div></div>
      <div class="field"><div class="field-label">Farm Location</div><div class="field-value">${ticket.farm?.location || '-'}</div></div>
    </div>
    <div class="info-group">
      <h4>Financial Summary</h4>
      <div class="field"><div class="field-label">Price per Kg</div><div class="field-value">₱${ticket.pricePerKg?.toFixed(2) || '2.50'}</div></div>
      <div class="field"><div class="field-label">Total Value</div><div class="field-value">₱${ticket.totalValue?.toFixed(2) || '0.00'}</div></div>
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
    <div class="info-group">
      <h4>Verified</h4>
      <div class="field-value">${ticket.verifiedAt ? new Date(ticket.verifiedAt).toLocaleString() : 'Not yet verified'}</div>
    </div>
    <div class="info-group">
      <h4>Reconciled</h4>
      <div class="field-value">${ticket.reconciliation?.reconciledAt ? new Date(ticket.reconciliation.reconciledAt).toLocaleString() : 'Pending'}</div>
    </div>
    <div class="info-group">
      <h4>Resolved</h4>
      <div class="field-value">${ticket.reconciliation?.resolvedAt ? new Date(ticket.reconciliation.resolvedAt).toLocaleString() : 'N/A'}</div>
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
      <div class="field"><div class="field-value">${ticket.operator?.name || '-'}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${ticket.operator?.email || '-'}</div></div>
      <div class="field"><div class="field-label">Contact</div><div class="field-value">${ticket.operator?.contactNumber || '-'}</div></div>
    </div>
  </div>

  ${ticket.reconciliation ? `
  <div class="info-group" style="margin-bottom: 16px;">
    <h4>Receiver</h4>
    <div class="field"><div class="field-value">${ticket.reconciliation.receiver?.name || '-'}</div></div>
    <div class="field"><div class="field-label">Email</div><div class="field-value">${ticket.reconciliation.receiver?.email || '-'}</div></div>
    <div class="field"><div class="field-label">Contact</div><div class="field-value">${ticket.reconciliation.receiver?.contactNumber || '-'}</div></div>
  </div>
  ` : ''}

  ${ticket.notes ? `<div class="info-group" style="margin-bottom: 16px;"><h4>Notes & Remarks</h4><div class="field-value">${ticket.notes}</div></div>` : ''}
  ${ticket.reconciliation?.notes ? `<div class="info-group" style="margin-bottom: 16px;"><h4>Resolution Notes</h4><div class="field-value">${ticket.reconciliation.notes}</div></div>` : ''}

  ${timeline.length > 0 ? `
  <div class="timeline-section">
    <div class="section-title">Activity Timeline</div>
    ${timeline.map((e: any) => `
    <div class="timeline-item">
      <div class="timeline-dot ${e.type.toLowerCase()}"></div>
      <div class="timeline-content">
        <div class="tl-label">${e.label}</div>
        <div class="tl-desc">${e.description}</div>
        <div class="tl-date">${new Date(e.date).toLocaleString()}</div>
      </div>
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
                          {ticket.farm?.farmName || 'Unknown Farm'} &bull; {ticket.truckPlate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                    <SectionTitle title="Weights & Valuation" icon={Scale} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <DetailRow label="Gross Weight" value={formatWeight(ticket.grossWeight)} icon={Plus} />
                      <DetailRow label="Tare Weight" value={formatWeight(ticket.tareWeight)} icon={Minus} />
                      <DetailRow label="Mill Weight" value={formatWeight(ticket.millWeight)} icon={Scale} />
                      <DetailRow
                        label="Refinery Weight"
                        value={ticket.reconciliation ? formatWeight(ticket.reconciliation.refineryWeight) : 'Pending'}
                        icon={Scale}
                      />
                      <DetailRow
                        label="Variance"
                        value={ticket.reconciliation ? `${ticket.reconciliation.difference > 0 ? '+' : ''}${ticket.reconciliation.difference} kg` : 'N/A'}
                        icon={ticket.reconciliation && Math.abs(ticket.reconciliation.difference) > 50 ? AlertTriangle : CheckCircle}
                      />
                      <DetailRow label="Price per Kg" value={`₱${ticket.pricePerKg?.toFixed(2) || '2.50'}`} icon={FileText} />
                      <DetailRow label="Total Value" value={`₱${ticket.totalValue?.toFixed(2) || '0.00'}`} icon={FileText} />
                      <DetailRow
                        label="Status"
                        value={ticket.status}
                        icon={ticket.status === 'RECONCILED' ? CheckCircle : ticket.status === 'DISPUTED' ? AlertTriangle : Clock}
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
                        <p className={`text-[10px] mt-3 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Farm: {ticket.farm?.farmName || '-'} {ticket.farm?.location ? `(${ticket.farm.location})` : ''}
                        </p>
                      </div>

                      <div className={`p-5 rounded-2xl border relative overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operator</span>
                        </div>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.operator?.name || '-'}</p>
                        {ticket.operator?.email && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs">
                            <Mail className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.operator.email}</span>
                          </div>
                        )}
                        {ticket.operator?.contactNumber && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <Phone className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.operator.contactNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className={`p-5 rounded-2xl border relative overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Receiver</span>
                        </div>
                        {ticket.reconciliation ? (
                          <>
                            <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.reconciliation.receiver?.name || '-'}</p>
                            {ticket.reconciliation.receiver?.email && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs">
                                <Mail className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.reconciliation.receiver.email}</span>
                              </div>
                            )}
                            {ticket.reconciliation.receiver?.contactNumber && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs">
                                <Phone className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ticket.reconciliation.receiver.contactNumber}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Not yet assigned</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <SectionTitle title="Important Dates" icon={Calendar} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <DetailRow label="Created" value={formatDate(ticket.createdAt)} icon={Clock} />
                      <DetailRow label="Updated" value={formatDate(ticket.updatedAt)} icon={Clock} />
                      <DetailRow
                        label="Verified"
                        value={ticket.verifiedAt ? formatDate(ticket.verifiedAt) : 'Pending'}
                        icon={CheckCircle}
                      />
                      <DetailRow
                        label="Reconciled"
                        value={ticket.reconciliation?.reconciledAt ? formatDate(ticket.reconciliation.reconciledAt) : 'Pending'}
                        icon={CheckCircle}
                      />
                      <DetailRow
                        label="Resolved"
                        value={ticket.reconciliation?.resolvedAt ? formatDate(ticket.reconciliation.resolvedAt) : 'N/A'}
                        icon={CheckCircle}
                      />
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

                  {/* Resolution Notes */}
                  {ticket.reconciliation?.notes && (
                    <div>
                      <SectionTitle title="Resolution Notes" icon={FileText} />
                      <div className={`p-5 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{ticket.reconciliation.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div>
                      <SectionTitle title="Activity Timeline" icon={Clock} />
                      <div className="relative">
                        {/* Vertical line */}
                        <div className={`absolute left-[19px] top-3 bottom-3 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                        
                        <div className="space-y-0">
                          {timeline.map((event: any, idx: number) => {
                            const Icon = timelineIcons[event.type] || Clock;
                            const colors = timelineColors[event.type] || timelineColors.CREATED;
                            return (
                              <div key={idx} className="relative flex gap-5 pb-6 last:pb-0">
                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${colors.dot} ${colors.border} shadow-sm`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 pt-1 min-w-0">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${colors.bg} ${colors.text} ${colors.border}`}>
                                    {event.label}
                                  </div>
                                  <p className={`text-sm mt-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{event.description}</p>
                                  <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(event.date)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertTriangle className={`w-10 h-10 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Failed to load ticket details</p>
                <button onClick={onClose} className="text-sm text-emerald-500 hover:underline font-semibold">Close</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
