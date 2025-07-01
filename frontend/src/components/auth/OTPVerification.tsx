import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

interface OTPVerificationProps {
  phoneNumber: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  phoneNumber, 
  onSuccess, 
  onBack 
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (otp === '000000') {
        setError('Invalid verification code');
        return;
      }
      
      onSuccess();
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    setError('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Verify Your Phone
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter the 6-digit code sent to
            <br />
            <span className="font-semibold text-gray-900">{phoneNumber}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest py-4"
            />
            
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="text-center">
              {canResend ? (
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  className="text-indigo-600"
                >
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in {countdown}s
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={otp.length !== 6 || loading}
              className="w-full py-4 text-lg"
              size="lg"
            >
              {loading ? 'Verifying...' : 'Verify & Create Wallet'}
            </Button>

            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              Change Phone Number
            </Button>
          </div>

          <div className="text-xs text-gray-400 text-center">
            Didn&apos;t receive the code? Check your SMS or try resending.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 