import { CheckCircle, Clock, AlertTriangle, XCircle, TrendingUp, HelpCircle } from 'lucide-react';

export function StatusBadge({ status, className = "" }: { status: string, className?: string }) {
  const styles: any = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
    RECONCILED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DISPUTED: 'bg-red-100 text-red-700 border-red-200',
    ACTIVE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200'
  };

  const IconMap: any = {
    PENDING: Clock,
    SUBMITTED: TrendingUp,
    RECONCILED: CheckCircle,
    DISPUTED: AlertTriangle,
    ACTIVE: CheckCircle,
    INACTIVE: XCircle
  };

  const Icon = IconMap[status] || HelpCircle;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </div>
  );
}
