import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';

interface PhoneRegistrationProps {
  onSuccess: (phoneNumber: string) => void;
  onBack?: () => void;
}

export const PhoneRegistration: React.FC<PhoneRegistrationProps> = ({ onSuccess, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSuccess(phoneNumber);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Your Wallet
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your phone number to get started with PadiPay
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="+234 xxx xxx xxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-center text-lg py-4"
            />
            {error && (
              <div className="text-red-500 text-sm text-center mt-2">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-500 text-center">
              We&apos;ll send you a verification code via SMS
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={!phoneNumber.trim() || loading}
              className="w-full py-4 text-lg"
              size="lg"
            >
              {loading ? 'Creating Wallet...' : 'Continue'}
            </Button>

            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="w-full"
              >
                Back
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-400 text-center leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            Your smart wallet will be created on the Morph network.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 