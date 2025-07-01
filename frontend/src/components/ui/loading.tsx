import React from 'react'
import { Loader2, Wallet, CreditCard, Users, ArrowUpRight } from 'lucide-react'

// Basic Loading Spinner
export function LoadingSpinner({ size = 'default', className = '' }: { size?: 'sm' | 'default' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

// Full Screen Loading
export function FullScreenLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <LoadingSpinner size="lg" className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">PadiPay</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Button Loading State
export function LoadingButton({ 
  loading, 
  children, 
  className = '', 
  disabled,
  ...props 
}: { 
  loading: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  [key: string]: any
}) {
  return (
    <button 
      className={`${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : children}
    </button>
  )
}

// Skeleton Components
export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded h-4 ${className}`} />
}

export function SkeletonAvatar({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  return <div className={`animate-pulse bg-gray-200 rounded-full ${sizeClasses[size]}`} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border p-4 space-y-3 ${className}`}>
      <div className="animate-pulse space-y-2">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-full" />
      </div>
    </div>
  )
}

// Transaction List Skeleton
export function TransactionListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <SkeletonAvatar />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-2/3" />
            <SkeletonLine className="w-1/3" />
          </div>
          <div className="space-y-2">
            <SkeletonLine className="w-16" />
            <SkeletonLine className="w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Balance Card Skeleton
export function BalanceCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg p-6 text-white">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="bg-white/20 rounded h-4 w-24" />
            <div className="bg-white/30 rounded h-8 w-40" />
          </div>
          <div className="bg-white/20 rounded-full w-8 h-8" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-3 space-y-2">
            <div className="bg-white/20 rounded h-3 w-16" />
            <div className="bg-white/30 rounded h-5 w-20" />
          </div>
          <div className="bg-white/10 rounded-lg p-3 space-y-2">
            <div className="bg-white/20 rounded h-3 w-16" />
            <div className="bg-white/30 rounded h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Actions Skeleton
export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-200 animate-pulse rounded-xl p-4 h-20" />
      ))}
    </div>
  )
}

// Page Loading with branded spinner
export function PageLoading({ message = 'Loading your wallet...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        {/* Animated PadiPay Logo */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center mx-auto">
            <Wallet size={40} className="text-white" />
          </div>
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">PadiPay</h2>
          <p className="text-gray-600">{message}</p>
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Inline Loading States
export function InlineLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-gray-600">
        <LoadingSpinner size="sm" />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  )
}

// Pull to Refresh Loading
export function PullToRefreshLoading() {
  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center space-x-2 text-blue-600">
        <LoadingSpinner size="sm" />
        <span className="text-sm font-medium">Refreshing...</span>
      </div>
    </div>
  )
}

// Transaction Processing Loading
export function TransactionProcessing({ 
  step = 1, 
  totalSteps = 3,
  currentStep = 'Processing payment...'
}: { 
  step?: number
  totalSteps?: number
  currentStep?: string 
}) {
  return (
    <div className="text-center space-y-4 p-8">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <ArrowUpRight size={32} className="text-blue-600 animate-pulse" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Processing Transaction</h3>
        <p className="text-sm text-gray-600">{currentStep}</p>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-500">Step {step} of {totalSteps}</p>
    </div>
  )
} 