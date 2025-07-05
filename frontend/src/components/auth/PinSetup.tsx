import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Keypad } from './Keypad';
import { Shield, Check } from 'lucide-react';

interface PinSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const PinSetup: React.FC<PinSetupProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { error, success } = useToast();

  const handlePinChange = (newPin: string, isConfirm: boolean = false) => {
    if (newPin.length <= 4) {
      if (isConfirm) {
        setConfirmPin(newPin);
        
        // Auto-check when 4 digits are entered
        if (newPin.length === 4) {
          handleConfirmPin(newPin);
        }
      } else {
        setPin(newPin);
        
        // Auto-proceed when 4 digits are entered
        if (newPin.length === 4) {
          setStep('confirm');
        }
      }
    }
  };

  const handleConfirmPin = async (submitPin: string = confirmPin) => {
    if (submitPin.length !== 4) {
      error('Please enter a 4-digit PIN');
      return;
    }

    if (pin !== submitPin) {
      error('PINs do not match. Please try again.');
      setConfirmPin('');
      setStep('create');
      setPin('');
      return;
    }

    setIsLoading(true);
    
    try {
      // Store PIN hash (in production, use proper hashing)
      const pinHash = btoa(pin); // Base64 encoding for now
      localStorage.setItem('padiPayPinHash', pinHash);
      
      // Mark as authenticated
      localStorage.setItem('padiPayAuthenticated', 'true');
      localStorage.setItem('padiPayLastAuth', Date.now().toString());
      
      success('PIN created successfully!');
      onComplete();
    } catch (err) {
      error('Failed to create PIN. Please try again.');
      console.error('PIN creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (value: string) => {
    if (value === 'backspace') {
      if (step === 'create') {
        setPin(prev => prev.slice(0, -1));
      } else {
        setConfirmPin(prev => prev.slice(0, -1));
      }
    } else if (value === 'clear') {
      if (step === 'create') {
        setPin('');
      } else {
        setConfirmPin('');
      }
    } else {
      if (step === 'create' && pin.length < 4) {
        handlePinChange(pin + value);
      } else if (step === 'confirm' && confirmPin.length < 4) {
        handlePinChange(confirmPin + value, true);
      }
    }
  };

  const currentPin = step === 'create' ? pin : confirmPin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'create' ? (
              <Shield size={32} className="text-green-600" />
            ) : (
              <Check size={32} className="text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {step === 'create' 
              ? 'Create a 4-digit PIN to secure your wallet' 
              : 'Please re-enter your PIN to confirm'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* PIN Display */}
          <div className="flex justify-center space-x-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                  currentPin.length > index
                    ? 'bg-green-600 border-green-600'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                {currentPin.length > index && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* Step indicator */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Step {step === 'create' ? '1' : '2'} of 2
            </p>
          </div>

          {/* Keypad */}
          <Keypad onKeyPress={handleKeypadPress} disabled={isLoading} />

          {/* Action Buttons */}
          <div className="space-y-3">
            {step === 'create' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep('confirm')}
                disabled={pin.length !== 4}
              >
                Continue
              </Button>
            )}
            
            {step === 'confirm' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('create');
                  setPin('');
                  setConfirmPin('');
                }}
              >
                Back
              </Button>
            )}

            {onSkip && (
              <Button
                variant="ghost"
                className="w-full text-gray-600"
                onClick={onSkip}
              >
                Skip for now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 