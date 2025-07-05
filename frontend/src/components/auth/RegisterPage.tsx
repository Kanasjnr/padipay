import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, LogIn, UserPlus, Shield, Smartphone } from 'lucide-react';

interface RegisterPageProps {
  onLogin: () => void;
  onCreateWallet: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onLogin, onCreateWallet }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet size={40} className="text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to PadiPay
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Your secure Web3 wallet for seamless phone-to-phone payments
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Login Option */}
          <div className="space-y-4">
            <Button
              onClick={onLogin}
              className="w-full h-14 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              <LogIn size={24} className="mr-3" />
              Login with PIN
            </Button>
            <p className="text-sm text-center text-gray-500">
              Already have a PadiPay wallet? Use your 4-digit PIN to login
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Create Wallet Option */}
          <div className="space-y-4">
            <Button
              onClick={onCreateWallet}
              variant="outline"
              className="w-full h-14 text-lg font-semibold border-2 border-indigo-200 hover:bg-indigo-50"
              size="lg"
            >
              <UserPlus size={24} className="mr-3" />
              Create New Wallet
            </Button>
            <p className="text-sm text-center text-gray-500">
              New to PadiPay? Create your secure wallet in minutes
            </p>
          </div>

          {/* Features */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Shield size={16} className="text-green-600" />
              <span>Bank-level security with PIN protection</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Smartphone size={16} className="text-blue-600" />
              <span>Send money using just phone numbers</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Wallet size={16} className="text-purple-600" />
              <span>Your keys, your crypto, your control</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 