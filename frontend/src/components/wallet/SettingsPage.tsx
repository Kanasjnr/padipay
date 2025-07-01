"use client"

import React, { useState } from 'react'
import { 
  User, 
  Shield, 
  Bell, 
  Smartphone, 
  CreditCard, 
  Globe, 
  Moon, 
  Sun,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  Camera,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  DollarSign,
  Languages
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface SettingsPageProps {
  onBack?: () => void
  onLogout?: () => void
  onEditProfile?: () => void
}

interface UserProfile {
  name: string
  phone: string
  email?: string
  avatar?: string
  verified: boolean
  kycLevel: 'Basic' | 'Intermediate' | 'Advanced'
}

interface SecuritySettings {
  biometric: boolean
  twoFactor: boolean
  transactionPin: boolean
  autoLock: boolean
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  notifications: {
    transactions: boolean
    marketing: boolean
    security: boolean
  }
}

export default function SettingsPage({ onBack, onLogout, onEditProfile }: SettingsPageProps) {
  const [userProfile] = useState<UserProfile>({
    name: "John Doe",
    phone: "+234 810 123 4567",
    email: "john.doe@email.com",
    verified: true,
    kycLevel: 'Intermediate'
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    biometric: true,
    twoFactor: false,
    transactionPin: true,
    autoLock: true
  })

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'English',
    currency: 'NGN',
    notifications: {
      transactions: true,
      marketing: false,
      security: true
    }
  })

  const [showSecurityDetails, setShowSecurityDetails] = useState(false)

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          value: userProfile.name,
          action: onEditProfile
        },
        {
          icon: Shield,
          label: "KYC Verification",
          value: (
            <Badge variant={userProfile.kycLevel === 'Advanced' ? 'default' : 'secondary'}>
              {userProfile.kycLevel}
            </Badge>
          ),
          action: () => console.log("KYC verification")
        },
        {
          icon: CreditCard,
          label: "Payment Methods",
          value: "3 methods",
          action: () => console.log("Payment methods")
        }
      ]
    },
    {
      title: "Security",
      items: [
        {
          icon: Fingerprint,
          label: "Biometric Login",
          value: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.biometric}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, biometric: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          icon: Lock,
          label: "Two-Factor Authentication",
          value: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactor}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactor: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          icon: showSecurityDetails ? EyeOff : Eye,
          label: "Transaction PIN",
          value: showSecurityDetails ? "1234" : "••••",
          action: () => setShowSecurityDetails(!showSecurityDetails)
        }
      ]
    },
    {
      title: "Preferences",
      items: [
        {
          icon: appSettings.theme === 'dark' ? Moon : Sun,
          label: "Theme",
          value: appSettings.theme,
          action: () => setAppSettings(prev => ({ 
            ...prev, 
            theme: prev.theme === 'light' ? 'dark' : prev.theme === 'dark' ? 'system' : 'light' 
          }))
        },
        {
          icon: Languages,
          label: "Language",
          value: appSettings.language,
          action: () => console.log("Language settings")
        },
        {
          icon: DollarSign,
          label: "Default Currency",
          value: appSettings.currency,
          action: () => console.log("Currency settings")
        },
        {
          icon: Bell,
          label: "Notifications",
          value: Object.values(appSettings.notifications).filter(Boolean).length + " enabled",
          action: () => console.log("Notification settings")
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          value: "",
          action: () => console.log("Help center")
        },
        {
          icon: Smartphone,
          label: "Contact Support",
          value: "",
          action: () => console.log("Contact support")
        }
      ]
    }
  ]

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
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {userProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <Camera size={12} />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold">{userProfile.name}</h2>
                {userProfile.verified && (
                  <Badge variant="default" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{userProfile.phone}</p>
              {userProfile.email && (
                <p className="text-sm text-gray-600">{userProfile.email}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditProfile}
            >
              <Edit3 size={16} />
            </Button>
          </div>
        </Card>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 px-2">
              {section.title}
            </h3>
            <Card className="divide-y">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.action}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} className="text-gray-600" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {typeof item.value === 'string' ? (
                      <span className="text-sm text-gray-500">{item.value}</span>
                    ) : (
                      item.value
                    )}
                    {item.action && <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                </button>
              ))}
            </Card>
          </div>
        ))}

        {/* Logout Button */}
        <Card className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut size={20} className="mr-3" />
            Sign Out
          </Button>
        </Card>

        {/* App Info */}
        <div className="text-center space-y-1 pt-4">
          <p className="text-xs text-gray-500">PadiPay v1.0.0</p>
          <p className="text-xs text-gray-400">Made with ❤️ for Africa</p>
        </div>
      </div>
    </div>
  )
} 