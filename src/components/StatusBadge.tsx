import { CheckCircle, Clock, HelpCircle } from 'lucide-react';

export function StatusBadge({ status, className = "" }: { status: string, className?: string }) {
  const styles: any = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const IconMap: any = {
    PENDING: Clock,
    PAID: CheckCircle,
  };

  const Icon = IconMap[status] || HelpCircle;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </div>
  );
}
