import { useState, useCallback } from 'react';
import { Toast, ToastType } from '@/types';

const TOAST_DURATION = 5000;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      message: string,
      duration: number = TOAST_DURATION
    ) => {
      const id = Date.now().toString();
      const toast: Toast = { id, type, title, message, duration };

      setToasts(prev => [...prev, toast]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message: string, duration?: number) =>
      addToast('success', title, message, duration),
    [addToast]
  );

  const error = useCallback(
    (title: string, message: string, duration?: number) =>
      addToast('error', title, message, duration),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message: string, duration?: number) =>
      addToast('warning', title, message, duration),
    [addToast]
  );

  const info = useCallback(
    (title: string, message: string, duration?: number) =>
      addToast('info', title, message, duration),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, warning, info };
}
