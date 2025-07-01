"use client"

import React, { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff,
  Calendar,
  Filter,
  MoreVertical,
  Wallet,
  CreditCard,
  PiggyBank,
  Target,
  Award,
  Zap
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface DashboardStatsProps {
  onViewDetails?: (type: string) => void
  onQuickAction?: (action: string) => void
}

interface BalanceInfo {
  main: number
  savings: number
  rewards: number
  currency: string
}

interface Transaction {
  id: string
  type: 'sent' | 'received' | 'reward'
  amount: number
  currency: string
  description: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

interface MonthlyStats {
  totalSpent: number
  totalReceived: number
  transactionCount: number
  averageTransaction: number
  topCategory: string
  savingsGrowth: number
}

export default function DashboardStats({ onViewDetails, onQuickAction }: DashboardStatsProps) {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  const balance: BalanceInfo = {
    main: 125750.50,
    savings: 45000.00,
    rewards: 2450.00,
    currency: 'NGN'
  }

  const monthlyStats: MonthlyStats = {
    totalSpent: 89400,
    totalReceived: 156800,
    transactionCount: 47,
    averageTransaction: 2890,
    topCategory: 'Transportation',
    savingsGrowth: 15.5
  }

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'received',
      amount: 15000,
      currency: 'NGN',
      description: 'Salary Payment',
      timestamp: new Date('2024-01-15T10:30:00'),
      status: 'completed'
    },
    {
      id: '2',
      type: 'sent',
      amount: 2500,
      currency: 'NGN',
      description: 'Uber Ride',
      timestamp: new Date('2024-01-15T09:15:00'),
      status: 'completed'
    },
    {
      id: '3',
      type: 'reward',
      amount: 150,
      currency: 'NGN',
      description: 'Cashback Reward',
      timestamp: new Date('2024-01-14T18:45:00'),
      status: 'completed'
    }
  ]

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const quickActions = [
    { 
      icon: ArrowUpRight, 
      label: 'Send Money', 
      action: 'send',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    { 
      icon: ArrowDownLeft, 
      label: 'Request', 
      action: 'request',
      color: 'bg-green-600 hover:bg-green-700'
    },
    { 
      icon: CreditCard, 
      label: 'Pay Bills', 
      action: 'bills',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    { 
      icon: PiggyBank, 
      label: 'Save', 
      action: 'save',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent': return ArrowUpRight
      case 'received': return ArrowDownLeft
      case 'reward': return Award
      default: return Wallet
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'sent': return 'text-red-600'
      case 'received': return 'text-green-600'
      case 'reward': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 space-y-6">
        {/* Balance Overview */}
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">Total Balance</p>
              <div className="flex items-center space-x-2">
                {balanceVisible ? (
                  <h2 className="text-3xl font-bold">{formatAmount(balance.main, balance.currency)}</h2>
                ) : (
                  <h2 className="text-3xl font-bold">••••••••</h2>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-white hover:bg-white/20"
                >
                  {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <MoreVertical size={20} />
            </Button>
          </div>

          {/* Sub-balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <PiggyBank size={16} />
                <span className="text-sm">Savings</span>
              </div>
              <p className="text-lg font-semibold">
                {balanceVisible ? formatAmount(balance.savings, balance.currency) : '••••••'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Award size={16} />
                <span className="text-sm">Rewards</span>
              </div>
              <p className="text-lg font-semibold">
                {balanceVisible ? formatAmount(balance.rewards, balance.currency) : '••••••'}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => onQuickAction?.(action.action)}
              className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-all transform hover:scale-105`}
            >
              <action.icon size={24} />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Monthly Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">This Month</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
                onClick={() => setSelectedPeriod(selectedPeriod === 'week' ? 'month' : selectedPeriod === 'month' ? 'year' : 'week')}
              >
                <Calendar size={16} />
                <span className="capitalize">{selectedPeriod}</span>
              </Button>
              <Button variant="ghost" size="sm">
                <Filter size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-sm text-gray-600">Received</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(monthlyStats.totalReceived, balance.currency)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingDown size={16} className="text-red-600" />
                <span className="text-sm text-gray-600">Spent</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatAmount(monthlyStats.totalSpent, balance.currency)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-xl font-bold">{monthlyStats.transactionCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-xl font-bold">{formatAmount(monthlyStats.averageTransaction, balance.currency)}</p>
            </div>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onViewDetails?.('transactions')}
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction) => {
              const IconComponent = getTransactionIcon(transaction.type)
              return (
                <div key={transaction.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100`}>
                    <IconComponent size={20} className={getTransactionColor(transaction.type)} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {transaction.timestamp.toLocaleDateString()} • {transaction.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'sent' ? '-' : '+'}
                      {formatAmount(transaction.amount, transaction.currency)}
                    </p>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Savings Goal */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold">Savings Goal</h3>
            </div>
            <Badge variant="default" className="bg-green-600">
              {monthlyStats.savingsGrowth}% growth
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Monthly Target: ₦50,000</span>
              <span>₦{balance.savings.toLocaleString()} saved</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(balance.savings / 50000) * 100}%` }}
              ></div>
            </div>
                         <p className="text-sm text-green-700">
               You&apos;re 90% to your monthly goal! Keep it up! 🎯
             </p>
          </div>
        </Card>

        {/* Achievement Badge */}
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap size={24} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800">Super Saver!</h4>
                             <p className="text-sm text-orange-700">You&apos;ve saved consistently for 3 months</p>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              New
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  )
} 