"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { Button } from './button'

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  hideToast: (id: string) => void
  hideAllToasts: () => void
}

// Toast Context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-hide toast if not persistent
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }
    
    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const hideAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, hideAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Toast Container Component
function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Individual Toast Component
function ToastItem({ toast }: { toast: Toast }) {
  const { hideToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => hideToast(toast.id), 150)
  }

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-150 ease-in-out"
    const visibilityStyles = isVisible 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0"
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800", 
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    }
    
    return `${baseStyles} ${visibilityStyles} ${typeStyles[toast.type]} border rounded-lg shadow-lg p-4`
  }

  const getIcon = () => {
    const iconProps = { size: 20, className: "flex-shrink-0" }
    
    switch (toast.type) {
      case 'success': return <CheckCircle {...iconProps} className="text-green-600" />
      case 'error': return <AlertCircle {...iconProps} className="text-red-600" />
      case 'warning': return <AlertTriangle {...iconProps} className="text-yellow-600" />
      case 'info': return <Info {...iconProps} className="text-blue-600" />
    }
  }

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm mt-1 opacity-90">{toast.message}</p>
          )}
          {toast.action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toast.action.onClick}
              className="mt-2 p-0 h-auto text-current hover:text-current/80"
            >
              {toast.action.label}
            </Button>
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
  )
}

// Hook to use Toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience hooks for different toast types
export function useToastHelpers() {
  const { showToast } = useToast()

  return {
    success: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'success', title, message, ...options }),
    
    error: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'error', title, message, ...options }),
    
    warning: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'info', title, message, ...options }),
    
    // Transaction specific toasts
    transactionSuccess: (amount: string, recipient?: string) =>
      showToast({
        type: 'success',
        title: 'Transaction Successful',
        message: `${amount} sent${recipient ? ` to ${recipient}` : ''} successfully`,
        duration: 6000
      }),
    
    transactionFailed: (reason?: string) =>
      showToast({
        type: 'error',
        title: 'Transaction Failed',
        message: reason || 'Please try again or contact support',
        persistent: true,
        action: {
          label: 'Retry',
          onClick: () => {
            // Handle retry logic
            console.log('Retrying transaction...')
          }
        }
      }),
    
    // Network related toasts
    networkError: () =>
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Please check your internet connection',
        persistent: true
      }),
    
    // Loading state toasts
    loading: (message: string = 'Processing...') =>
      showToast({
        type: 'info',
        title: message,
        persistent: true
      }),
    
    // Security toasts
    securityAlert: (message: string) =>
      showToast({
        type: 'warning',
        title: 'Security Alert',
        message,
        duration: 8000,
        persistent: true
      })
  }
}

// Pre-built toast templates for common scenarios
export const ToastTemplates = {
  // Payment related
  paymentProcessing: () => ({
    type: 'info' as ToastType,
    title: 'Processing Payment',
    message: 'Please wait while we process your transaction...',
    persistent: true
  }),

  paymentSuccess: (amount: string, recipient: string) => ({
    type: 'success' as ToastType,
    title: 'Payment Sent',
    message: `Successfully sent ${amount} to ${recipient}`,
    duration: 6000
  }),

  paymentFailed: (reason: string) => ({
    type: 'error' as ToastType,
    title: 'Payment Failed',
    message: reason,
    persistent: true,
    action: {
      label: 'Try Again',
      onClick: () => console.log('Retry payment')
    }
  }),

  // Account related
  profileUpdated: () => ({
    type: 'success' as ToastType,
    title: 'Profile Updated',
    message: 'Your profile has been successfully updated'
  }),

  securityEnabled: (feature: string) => ({
    type: 'success' as ToastType,
    title: 'Security Enhanced',
    message: `${feature} has been enabled for your account`
  }),

  // General system
  offline: () => ({
    type: 'warning' as ToastType,
    title: 'You\'re Offline',
    message: 'Some features may not be available',
    persistent: true
  }),

  backOnline: () => ({
    type: 'success' as ToastType,
    title: 'Back Online',
    message: 'Connection restored'
  }),

  maintenanceMode: () => ({
    type: 'info' as ToastType,
    title: 'Maintenance Notice',
    message: 'Some features may be temporarily unavailable',
    duration: 10000
  })
}

// Component for displaying toast in different positions
export function ToastPositionContainer({ 
  position = 'top-right',
  children 
}: { 
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  children: React.ReactNode 
}) {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <div className={`${positionClasses[position]} z-50 space-y-2 max-w-sm w-full`}>
      {children}
    </div>
  )
} 