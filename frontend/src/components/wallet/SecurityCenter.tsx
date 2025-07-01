"use client"

import React, { useState } from 'react'
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Fingerprint,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Wifi,
  Lock,
  Unlock,
  RefreshCw,
  X,
  Plus,
  Settings,
  ExternalLink
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'

interface SecurityCenterProps {
  onBack?: () => void
  onEnableSecurity?: (type: string) => void
}

interface SecurityStatus {
  biometric: boolean
  twoFactor: boolean
  deviceLock: boolean
  transactionPin: boolean
  backupCodes: boolean
}

interface LoginSession {
  id: string
  device: string
  location: string
  timestamp: Date
  current: boolean
  ipAddress: string
  browser: string
}

interface SecurityAlert {
  id: string
  type: 'warning' | 'info' | 'success'
  title: string
  description: string
  timestamp: Date
  read: boolean
}

export default function SecurityCenter({ onBack, onEnableSecurity }: SecurityCenterProps) {
  const [showTransactionPin, setShowTransactionPin] = useState(false)
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    biometric: true,
    twoFactor: false,
    deviceLock: true,
    transactionPin: true,
    backupCodes: false
  })

  const [loginSessions] = useState<LoginSession[]>([
    {
      id: '1',
      device: 'iPhone 14 Pro',
      location: 'Lagos, Nigeria',
      timestamp: new Date(),
      current: true,
      ipAddress: '197.210.xxx.xxx',
      browser: 'Safari Mobile'
    },
    {
      id: '2',
      device: 'MacBook Pro',
      location: 'Lagos, Nigeria',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      current: false,
      ipAddress: '197.210.xxx.xxx',
      browser: 'Chrome'
    },
    {
      id: '3',
      device: 'Samsung Galaxy S23',
      location: 'Abuja, Nigeria',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      current: false,
      ipAddress: '105.112.xxx.xxx',
      browser: 'Chrome Mobile'
    }
  ])

  const [securityAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'New device login detected',
      description: 'Someone logged into your account from a new device in Abuja',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Password changed successfully',
      description: 'Your account password was updated',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
      read: true
    },
    {
      id: '3',
      type: 'success',
      title: 'Two-factor authentication available',
      description: 'Secure your account with 2FA for enhanced protection',
      timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000),
      read: true
    }
  ])

  const calculateSecurityScore = () => {
    const enabled = Object.values(securityStatus).filter(Boolean).length
    return (enabled / Object.keys(securityStatus).length) * 100
  }

  const securityScore = calculateSecurityScore()

  const getSecurityScoreColor = () => {
    if (securityScore >= 80) return 'text-green-600'
    if (securityScore >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSecurityScoreBackground = () => {
    if (securityScore >= 80) return 'bg-green-600'
    if (securityScore >= 60) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const toggleSecurityFeature = (feature: keyof SecurityStatus) => {
    if (!securityStatus[feature]) {
      onEnableSecurity?.(feature)
    }
    setSecurityStatus(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
  }

  const securityFeatures = [
    {
      key: 'biometric' as keyof SecurityStatus,
      icon: Fingerprint,
      title: 'Biometric Authentication',
      description: 'Use fingerprint or face ID to secure your app',
      enabled: securityStatus.biometric,
      recommended: true
    },
    {
      key: 'twoFactor' as keyof SecurityStatus,
      icon: Smartphone,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security with SMS or authenticator app',
      enabled: securityStatus.twoFactor,
      recommended: true
    },
    {
      key: 'transactionPin' as keyof SecurityStatus,
      icon: Key,
      title: 'Transaction PIN',
      description: 'Require PIN for all transactions',
      enabled: securityStatus.transactionPin,
      recommended: true
    },
    {
      key: 'deviceLock' as keyof SecurityStatus,
      icon: Lock,
      title: 'Auto Device Lock',
      description: 'Automatically lock app when idle',
      enabled: securityStatus.deviceLock,
      recommended: false
    },
    {
      key: 'backupCodes' as keyof SecurityStatus,
      icon: RefreshCw,
      title: 'Backup Recovery Codes',
      description: 'Generate backup codes for account recovery',
      enabled: securityStatus.backupCodes,
      recommended: true
    }
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      default: return Shield
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-red-600 bg-red-50 border-red-200'
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">Security Center</h1>
          <Button variant="ghost" size="sm">
            <Settings size={20} />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Security Score */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <div className="w-24 h-24 rounded-full bg-gray-200"></div>
              <div 
                className={`absolute inset-0 rounded-full ${getSecurityScoreBackground()}`}
                style={{
                  background: `conic-gradient(${getSecurityScoreBackground().replace('bg-', '')} ${securityScore * 3.6}deg, #e5e7eb ${securityScore * 3.6}deg)`
                }}
              ></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <span className={`text-2xl font-bold ${getSecurityScoreColor()}`}>
                  {Math.round(securityScore)}%
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Security Score</h3>
              <p className="text-sm text-gray-600">
                {securityScore >= 80 ? 'Excellent security setup!' : 
                 securityScore >= 60 ? 'Good, but can be improved' : 
                 'Your account needs better protection'}
              </p>
            </div>
          </div>
        </Card>

        {/* Security Features */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 px-2">Security Features</h3>
          <Card className="divide-y">
            {securityFeatures.map((feature) => (
              <div key={feature.key} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      feature.enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <feature.icon size={20} className={
                        feature.enabled ? 'text-green-600' : 'text-gray-600'
                      } />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{feature.title}</h4>
                        {feature.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feature.enabled}
                      onChange={() => toggleSecurityFeature(feature.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Active Sessions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 px-2">Active Sessions</h3>
          <Card className="divide-y">
            {loginSessions.map((session) => (
              <div key={session.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Smartphone size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{session.device}</h4>
                        {session.current && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <MapPin size={12} />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={12} />
                          <span>{session.timestamp.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Wifi size={12} />
                          <span>{session.browser} • {session.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Security Alerts */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 px-2">Security Alerts</h3>
          <div className="space-y-2">
            {securityAlerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type)
              return (
                <Card key={alert.id} className={`p-4 border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start space-x-3">
                    <AlertIcon size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.description}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                    {!alert.read && (
                      <div className="w-2 h-2 bg-current rounded-full"></div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="p-4 h-auto">
            <div className="text-center">
              <RefreshCw size={24} className="mx-auto mb-2" />
              <span className="text-sm">Generate Backup Codes</span>
            </div>
          </Button>
          <Button variant="outline" className="p-4 h-auto">
            <div className="text-center">
              <ExternalLink size={24} className="mx-auto mb-2" />
              <span className="text-sm">Security Guide</span>
            </div>
          </Button>
        </div>

        {/* Emergency Actions */}
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle size={20} className="text-red-600" />
            <h3 className="font-semibold text-red-800">Emergency Actions</h3>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-100">
              Sign out all devices
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-100">
              Temporarily disable account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 