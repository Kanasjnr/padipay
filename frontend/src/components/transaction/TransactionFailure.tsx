import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  XCircle, 
  RefreshCw, 
  Home, 
  AlertTriangle,
  User,
  Clock,
  DollarSign,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

interface TransactionFailureProps {
  transactionData: {
    id: string;
    amount: string;
    currency: string;
    recipient: {
      name?: string;
      phone: string;
      countryFlag: string;
    };
    timestamp: string;
    error: {
      code: string;
      message: string;
      reason: 'insufficient_funds' | 'network_error' | 'invalid_recipient' | 'limit_exceeded' | 'unknown';
    };
    fees: string;
    reference?: string;
  };
  onRetry: () => void;
  onGoHome: () => void;
  onContactSupport?: () => void;
}

export const TransactionFailure: React.FC<TransactionFailureProps> = ({
  transactionData,
  onRetry,
  onGoHome,
  onContactSupport
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Get error details based on error reason
  const getErrorDetails = (reason: string) => {
    switch (reason) {
      case 'insufficient_funds':
        return {
          title: 'Insufficient Balance',
          description: 'You don\'t have enough funds to complete this transaction',
          actionText: 'Add Money',
          canRetry: false,
          icon: DollarSign,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'network_error':
        return {
          title: 'Network Error',
          description: 'Unable to connect to the payment network. Please check your connection',
          actionText: 'Try Again',
          canRetry: true,
          icon: RefreshCw,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'invalid_recipient':
        return {
          title: 'Invalid Recipient',
          description: 'The recipient phone number is invalid or not supported',
          actionText: 'Check Number',
          canRetry: false,
          icon: User,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'limit_exceeded':
        return {
          title: 'Limit Exceeded',
          description: 'This transaction exceeds your daily or monthly limit',
          actionText: 'View Limits',
          canRetry: false,
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          title: 'Transaction Failed',
          description: 'Something went wrong while processing your payment',
          actionText: 'Try Again',
          canRetry: true,
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
    }
  };

  const errorDetails = getErrorDetails(transactionData.error.reason);
  const ErrorIcon = errorDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center p-4">
      {/* Failure Animation */}
      <div className={`transform transition-all duration-1000 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}>
        <div className="relative mb-8">
          {/* Animated X Icon */}
          <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center relative">
            <XCircle size={48} className="text-white" />
            
            {/* Shake Animation */}
            <div className="absolute inset-0 bg-red-400 rounded-full animate-pulse opacity-75"></div>
          </div>
          
          {/* Sad Effect */}
          <div className="absolute -top-2 -left-2 w-1 h-1 bg-red-400 rounded-full animate-ping delay-100"></div>
          <div className="absolute -top-1 right-2 w-1 h-1 bg-red-400 rounded-full animate-ping delay-200"></div>
          <div className="absolute top-4 -right-4 w-1 h-1 bg-red-400 rounded-full animate-ping delay-300"></div>
        </div>
      </div>

      {/* Failure Message */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600">We couldn't process your transaction</p>
      </div>

      {/* Error Details Card */}
      <Card className={`w-full max-w-md mb-6 shadow-xl ${errorDetails.borderColor}`}>
        <CardContent className="p-6 space-y-4">
          {/* Error Type */}
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${errorDetails.bgColor}`}>
            <ErrorIcon size={24} className={errorDetails.color} />
            <div className="flex-1">
              <p className={`font-semibold ${errorDetails.color}`}>
                {errorDetails.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {errorDetails.description}
              </p>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="border-t pt-4">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <DollarSign size={20} className="text-gray-400 mr-2" />
                <span className="text-2xl font-bold text-gray-500">
                  {transactionData.amount}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                + {transactionData.fees} fees
              </p>
            </div>

            {/* Recipient */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center relative">
                <User size={16} className="text-gray-400" />
                <span className="absolute -bottom-1 -right-1 text-sm">
                  {transactionData.recipient.countryFlag}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-700">
                  {transactionData.recipient.name || 'Recipient'}
                </p>
                <p className="text-sm text-gray-500">
                  {transactionData.recipient.phone}
                </p>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Failed
              </Badge>
            </div>

            {/* Error Details */}
            <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Error Code</span>
                <span className="font-mono text-xs">{transactionData.error.code}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Clock size={14} className="mr-1" />
                  Failed at
                </span>
                <span className="font-medium">{transactionData.timestamp}</span>
              </div>

              {transactionData.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-medium">{transactionData.reference}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        {errorDetails.canRetry && (
          <Button
            onClick={onRetry}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            <RefreshCw size={20} className="mr-2" />
            {errorDetails.actionText}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={onGoHome}
          className="w-full h-10"
        >
          <Home size={16} className="mr-2" />
          Back to Home
        </Button>

        {/* Support Options */}
        <div className="space-y-2">
          {onContactSupport && (
            <Button
              variant="ghost"
              onClick={onContactSupport}
              className="w-full h-10 text-gray-600 hover:text-gray-900"
            >
              <HelpCircle size={16} className="mr-2" />
              Contact Support
              <ChevronRight size={16} className="ml-auto" />
            </Button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="w-full max-w-md mt-6 text-center">
        <p className="text-xs text-gray-500">
          If this problem persists, please contact our support team. 
          We're here to help resolve any payment issues.
        </p>
      </div>
    </div>
  );
};
