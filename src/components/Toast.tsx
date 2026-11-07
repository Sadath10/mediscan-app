import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgStyle =
    toast.type === 'success'
      ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
      : toast.type === 'warning'
      ? 'bg-amber-900/95 text-amber-100 border-amber-700'
      : toast.type === 'error'
      ? 'bg-rose-900/95 text-rose-100 border-rose-700'
      : 'bg-slate-900/95 text-slate-100 border-slate-700';

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'warning' || toast.type === 'error'
      ? AlertTriangle
      : Info;

  const iconColor =
    toast.type === 'success'
      ? 'text-emerald-400'
      : toast.type === 'warning'
      ? 'text-amber-400'
      : toast.type === 'error'
      ? 'text-rose-400'
      : 'text-teal-400';

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${bgStyle}`}
      role="alert"
    >
      <div className="flex items-center space-x-2.5 pr-2">
        <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <span className="text-xs sm:text-sm font-semibold leading-tight">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
