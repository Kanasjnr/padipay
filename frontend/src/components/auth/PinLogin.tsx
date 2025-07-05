import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Keypad } from './Keypad';
import { Lock, Fingerprint } from 'lucide-react';

interface PinLoginProps {
  onSuccess: () => void;
  onForgotPin: () => void;
  onNewUser: () => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({ 
  onSuccess, 
  onForgotPin, 
  onNewUser 
}) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { error, success } = useToast();

  const MAX_ATTEMPTS = 3;

  const handlePinChange = (newPin: string) => {
    if (newPin.length <= 4) {
      setPin(newPin);
      
      // Auto-submit when 4 digits are entered
      if (newPin.length === 4) {
        handleSubmit(newPin);
      }
    }
  };

  const handleSubmit = async (submitPin: string = pin) => {
    if (submitPin.length !== 4) {
      error('Please enter a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get stored PIN hash
      const storedPinHash = localStorage.getItem('padiPayPinHash');
      if (!storedPinHash) {
        error('No PIN found. Please create a new wallet.');
        setIsLoading(false);
        return;
      }

      // Simple hash comparison (in production, use proper hashing)
      const pinHash = btoa(submitPin); // Base64 encoding for now
      
      if (pinHash === storedPinHash) {
        success('PIN verified successfully!');
        
        // Mark as authenticated
        localStorage.setItem('padiPayAuthenticated', 'true');
        localStorage.setItem('padiPayLastAuth', Date.now().toString());
        
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          error('Too many failed attempts. Please verify with OTP.');
          // Clear the PIN input
          setPin('');
          onForgotPin();
        } else {
          error(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
          setPin('');
        }
      }
    } catch (err) {
      error('Authentication failed. Please try again.');
      console.error('PIN authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (value: string) => {
    if (value === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (value === 'clear') {
      setPin('');
    } else if (pin.length < 4) {
      handlePinChange(pin + value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Enter your 4-digit PIN to access your wallet
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* PIN Display */}
          <div className="flex justify-center space-x-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                  pin.length > index
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                {pin.length > index && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* Keypad */}
          <Keypad onKeyPress={handleKeypadPress} disabled={isLoading} />

          {/* Biometric Option (Coming Soon) */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              disabled={true}
              onClick={() => {}}
            >
              <Fingerprint size={20} className="mr-2" />
              Use Biometrics (Coming Soon)
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full text-indigo-600"
              onClick={onForgotPin}
            >
              Forgot PIN? Verify with OTP
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={onNewUser}
            >
              Don&apos;t have a wallet? Create one
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 