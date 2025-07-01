import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Share2, 
  Home, 
  Receipt, 
  Copy,
  User,
  Clock,
  DollarSign
} from 'lucide-react';

interface TransactionSuccessProps {
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
    status: 'completed' | 'pending';
    fees: string;
    reference?: string;
  };
  onGoHome: () => void;
  onViewReceipt?: () => void;
  onShare?: () => void;
}

export const TransactionSuccess: React.FC<TransactionSuccessProps> = ({
  transactionData,
  onGoHome,
  onViewReceipt,
  onShare
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Copy transaction ID
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(transactionData.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-4">
      {/* Success Animation */}
      <div className={`transform transition-all duration-1000 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}>
        <div className="relative mb-8">
          {/* Animated Checkmark */}
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center relative">
            <CheckCircle size={48} className="text-white" />
            
            {/* Pulse Animation */}
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-2 bg-green-300 rounded-full animate-pulse opacity-50"></div>
          </div>
          
          {/* Confetti Effect */}
          <div className="absolute -top-4 -left-4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
          <div className="absolute -top-2 right-0 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
          <div className="absolute top-2 -right-6 w-2 h-2 bg-red-400 rounded-full animate-bounce delay-200"></div>
          <div className="absolute -bottom-2 -left-6 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-300"></div>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Sent!</h1>
        <p className="text-gray-600">Your money is on its way</p>
      </div>

      {/* Transaction Summary Card */}
      <Card className="w-full max-w-md mb-6 shadow-xl">
        <CardContent className="p-6 space-y-4">
          {/* Amount */}
          <div className="text-center border-b pb-4">
            <div className="flex items-center justify-center mb-2">
              <DollarSign size={24} className="text-green-600 mr-2" />
              <span className="text-3xl font-bold text-gray-900">
                {transactionData.amount}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              + {transactionData.fees} fees
            </p>
          </div>

          {/* Recipient */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center relative">
              <User size={16} className="text-gray-600" />
              <span className="absolute -bottom-1 -right-1 text-sm">
                {transactionData.recipient.countryFlag}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {transactionData.recipient.name || 'Recipient'}
              </p>
              <p className="text-sm text-gray-600">
                {transactionData.recipient.phone}
              </p>
            </div>
            <Badge 
              variant={transactionData.status === 'completed' ? 'default' : 'secondary'}
              className={transactionData.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
              }
            >
              {transactionData.status === 'completed' ? 'Completed' : 'Processing'}
            </Badge>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs">
                  ...{transactionData.id.slice(-8)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopyId}
                >
                  <Copy size={12} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center">
                <Clock size={14} className="mr-1" />
                Time
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

          {/* Status Message */}
          <div className={`text-center p-3 rounded-lg ${
            transactionData.status === 'completed' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-yellow-50 text-yellow-800'
          }`}>
            <p className="text-sm font-medium">
              {transactionData.status === 'completed' 
                ? '✅ Money delivered successfully!'
                : '⏳ Processing your transaction...'
              }
            </p>
            {transactionData.status === 'pending' && (
              <p className="text-xs mt-1">
                The recipient will be notified once funds are available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        <Button
          onClick={onGoHome}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          <Home size={20} className="mr-2" />
          Back to Home
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {onViewReceipt && (
            <Button
              variant="outline"
              onClick={onViewReceipt}
              className="h-10"
            >
              <Receipt size={16} className="mr-2" />
              Receipt
            </Button>
          )}
          
          {onShare && (
            <Button
              variant="outline"
              onClick={onShare}
              className="h-10"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Copy Notification */}
      {copied && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          Transaction ID copied!
        </div>
      )}
    </div>
  );
};
