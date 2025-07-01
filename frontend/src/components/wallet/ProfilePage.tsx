import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Wallet, 
  Shield, 
  Settings, 
  HelpCircle, 
  LogOut,
  Copy,
  QrCode,
  Lock,
  Edit3
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import ProfileManager from '@/components/profile/ProfileManager';
import SettingsPage from '@/components/wallet/SettingsPage';
import SecurityCenter from '@/components/wallet/SecurityCenter';
import HelpCenter from '@/components/support/HelpCenter';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'settings' | 'security' | 'help'>('main');
  const { success, info } = useToast();
  
  const userInfo = {
    name: 'John Doe',
    phone: '+234 xxx xxx xxxx',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    joinDate: 'January 2024',
    verified: true
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard!');
  };

  const menuItems = [
    {
      icon: Edit3,
      label: 'Edit Profile',
      description: 'Update your personal information',
      action: () => setCurrentView('edit')
    },
    {
      icon: Lock,
      label: 'Security Center',
      description: 'Manage your security settings',
      action: () => setCurrentView('security')
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help and contact support',
      action: () => setCurrentView('help')
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'App settings and preferences',
      action: () => setCurrentView('settings')
    }
  ];

  // Handle different views
  if (currentView === 'edit') {
    return (
      <ProfileManager
        onBack={() => setCurrentView('main')}
                 onSave={() => {
           success('Profile updated successfully!');
           setCurrentView('main');
         }}
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <SettingsPage
        onBack={() => setCurrentView('main')}
        onLogout={() => {
          success('Logged out successfully');
          onBack();
        }}
        onEditProfile={() => setCurrentView('edit')}
      />
    );
  }

  if (currentView === 'security') {
    return (
      <SecurityCenter
        onBack={() => setCurrentView('main')}
        onEnableSecurity={(type) => {
          success(`${type} enabled successfully`);
        }}
      />
    );
  }

  if (currentView === 'help') {
    return (
      <HelpCenter
        onBack={() => setCurrentView('main')}
        onContactSupport={(method) => {
          info(`Opening ${method} support...`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6 pt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{userInfo.name}</h2>
                {userInfo.verified && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <Shield size={12} className="mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone size={16} />
                <span>{userInfo.phone}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Member since {userInfo.joinDate}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet size={20} className="mr-2" />
            Wallet Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Wallet Address</label>
            <div className="flex items-center space-x-2 mt-1 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm text-gray-800 font-mono">
                {userInfo.walletAddress.slice(0, 20)}...
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(userInfo.walletAddress)}
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1">
              <QrCode size={16} className="mr-2" />
              Show QR Code
            </Button>
            <Button variant="outline" className="flex-1">
              <Copy size={16} className="mr-2" />
              Copy Address
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-sm text-gray-600">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">6</p>
              <p className="text-sm text-gray-600">Contacts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={item.action}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <item.icon size={20} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </button>
              {index < menuItems.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 