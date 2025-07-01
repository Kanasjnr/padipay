"use client"

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, MessageCircle, ArrowLeft } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

// Main Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <DefaultErrorFallback 
          error={this.state.error} 
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({ 
  error, 
  onRetry, 
  onGoHome 
}: { 
  error?: Error
  onRetry?: () => void
  onGoHome?: () => void 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600 text-sm">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button onClick={onRetry} className="w-full">
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={onGoHome} className="w-full">
            <Home size={16} className="mr-2" />
            Go to Home
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Page-specific Error Components
export function TransactionErrorFallback({ 
  onRetry, 
  onGoBack,
  message = "Failed to process transaction" 
}: { 
  onRetry?: () => void
  onGoBack?: () => void
  message?: string 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Transaction Failed</h2>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button onClick={onRetry} className="w-full">
            <RefreshCw size={16} className="mr-2" />
            Retry Transaction
          </Button>
          <Button variant="outline" onClick={onGoBack} className="w-full">
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  )
}

export function NetworkErrorFallback({ 
  onRetry,
  message = "No internet connection" 
}: { 
  onRetry?: () => void
  message?: string 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-orange-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Connection Error</h2>
          <p className="text-gray-600 text-sm">
            {message}. Please check your internet connection and try again.
          </p>
        </div>
        
        <Button onClick={onRetry} className="w-full">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </Card>
    </div>
  )
}

// Inline Error Components
export function InlineError({ 
  message, 
  onRetry,
  className = '' 
}: { 
  message: string
  onRetry?: () => void
  className?: string 
}) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-800">{message}</p>
          {onRetry && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRetry}
              className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-100 p-0 h-auto"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Form Error Component
export function FormError({ 
  errors,
  className = '' 
}: { 
  errors: string | string[]
  className?: string 
}) {
  const errorArray = Array.isArray(errors) ? errors : [errors]
  
  if (errorArray.length === 0) return null
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start space-x-2">
        <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {errorArray.length === 1 ? (
            <p className="text-sm text-red-800">{errorArray[0]}</p>
          ) : (
            <ul className="text-sm text-red-800 space-y-1">
              {errorArray.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// 404 Page Component
export function NotFoundError({ 
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist.",
  onGoHome 
}: { 
  title?: string
  message?: string
  onGoHome?: () => void 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-6">
        <div className="text-6xl font-bold text-gray-300">404</div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button onClick={onGoHome} className="w-full">
            <Home size={16} className="mr-2" />
            Go to Home
          </Button>
          <Button variant="outline" className="w-full">
            <MessageCircle size={16} className="mr-2" />
            Contact Support
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Success wrapper with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for error reporting
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error ${context ? `in ${context}` : ''}:`, error)
    
    // Here you could integrate with error reporting services like Sentry
    // Sentry.captureException(error, { extra: { context } })
  }
  
  return { handleError }
} 