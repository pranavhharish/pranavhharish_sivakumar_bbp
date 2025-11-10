'use client';

import { Toast as ToastType } from '@/types';

interface ToastComponentProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const toastStyles: Record<string, string> = {
  success: 'bg-green-100 text-green-800 border-l-4 border-green-500',
  error: 'bg-red-100 text-red-800 border-l-4 border-red-500',
  warning: 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500',
  info: 'bg-blue-100 text-blue-800 border-l-4 border-blue-500',
};

export function ToastComponent({ toast, onRemove }: ToastComponentProps) {
  return (
    <div className={`flex items-center gap-3 p-4 mb-3 rounded-lg shadow-md ${toastStyles[toast.type]}`}>
      <div className="flex-1">
        <p className="font-semibold">{toast.title}</p>
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 text-lg leading-none opacity-70 hover:opacity-100 flex-shrink-0"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
