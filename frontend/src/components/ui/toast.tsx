'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from './button';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, duration: 5000, ...toast };
    
    setToasts(prev => [...prev, newToast]);
    
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => hideToast(id), newToast.duration);
    }
    
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, persistent: true });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ 
      toasts, showToast, hideToast, success, error, warning, info 
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { hideToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => hideToast(toast.id), 150);
  };

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-150 ease-in-out border rounded-lg shadow-lg p-4";
    const visibilityStyles = isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0";
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800", 
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    };
    
    return `${baseStyles} ${visibilityStyles} ${typeStyles[toast.type]}`;
  };

  const getIcon = () => {
    const iconProps = { size: 20, className: "flex-shrink-0" };
    
    switch (toast.type) {
      case 'success': return <CheckCircle {...iconProps} className="text-green-600" />;
      case 'error': return <AlertCircle {...iconProps} className="text-red-600" />;
      case 'warning': return <AlertTriangle {...iconProps} className="text-yellow-600" />;
      case 'info': return <Info {...iconProps} className="text-blue-600" />;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm mt-1 opacity-90">{toast.message}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="p-1 h-auto text-current hover:text-current/80"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
