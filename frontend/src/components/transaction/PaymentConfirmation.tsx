import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Send, 
  User, 
  DollarSign, 
  Clock, 
  Shield, 
  Info,
  AlertTriangle 
} from 'lucide-react';

interface PaymentDetails {
  recipient: {
    name?: string;
    phone: string;
    avatar?: string;
    country: string;
    countryFlag: string;
  };
  amount: {
    value: number;
    currency: string;
    formatted: string;
  };
  exchangeRate?: {
    from: string;
    to: string;
    rate: number;
    convertedAmount: string;
  };
  fees: {
    networkFee: number;
    serviceFee: number;
    total: number;
    currency: string;
  };
  estimatedTime: string;
  reference?: string;
  note?: string;
}

interface PaymentConfirmationProps {
  paymentDetails: PaymentDetails;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
  userBalance: number;
  balanceCurrency: string;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  paymentDetails,
  onConfirm,
  onBack,
  loading = false,
  userBalance,
  balanceCurrency
}) => {
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);

  const { recipient, amount, exchangeRate, fees, estimatedTime, reference, note } = paymentDetails;

  // Calculate total amount including fees
  const totalAmount = amount.value + fees.total;
  const hasInsufficientBalance = totalAmount > userBalance;

  // Format currency amounts
  const formatCurrency = (value: number, currency: string): string => {
    // Handle non-standard currency codes like USDT
    if (currency === 'USDT' || currency === 'BTC' || currency === 'ETH') {
      return `${currency} ${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      })}`;
    }

    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'NGN' || currency === 'KES' ? 0 : 2,
      }).format(value);
    } catch {
      // Fallback for unrecognized currency codes
      const symbols: Record<string, string> = {
        NGN: '₦',
        KES: 'KSh',
        GHS: '₵',
        UGX: 'USh',
        ZAR: 'R',
        ETB: 'Br',
        USD: '$'
      };
      
      const symbol = symbols[currency] || currency;
      return `${symbol}${value.toLocaleString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 pt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={loading}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Confirm Payment</h1>
          <p className="text-sm text-gray-600">Review details before sending</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Recipient Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center relative">
                {recipient.avatar ? (
                  <span className="text-indigo-600 font-semibold">{recipient.avatar}</span>
                ) : (
                  <User size={20} className="text-indigo-600" />
                )}
                <span className="absolute -bottom-1 -right-1 text-lg">{recipient.countryFlag}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {recipient.name || 'Unknown Contact'}
                </h3>
                <p className="text-sm text-gray-600">{recipient.phone}</p>
                <p className="text-xs text-gray-500">{recipient.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Card */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign size={24} className="text-indigo-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{amount.formatted}</span>
              </div>
              
              {exchangeRate && (
                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <p className="text-xs text-gray-600 mb-1">Exchange Rate</p>
                  <p className="text-sm font-medium">
                    1 {exchangeRate.from} = {exchangeRate.rate} {exchangeRate.to}
                  </p>
                  <p className="text-lg font-semibold text-indigo-600 mt-1">
                    ≈ {exchangeRate.convertedAmount}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Fees */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Network Fee</span>
              <span className="text-sm font-medium">
                {formatCurrency(fees.networkFee, fees.currency)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service Fee</span>
              <span className="text-sm font-medium">
                {formatCurrency(fees.serviceFee, fees.currency)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold text-lg">
                {formatCurrency(totalAmount, amount.currency)}
              </span>
            </div>

            {/* Fee Breakdown Toggle */}
            <button
              onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              <Info size={12} className="mr-1" />
              {showFeeBreakdown ? 'Hide' : 'Show'} fee breakdown
            </button>

            {showFeeBreakdown && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span>Network processing fee</span>
                  <span>{formatCurrency(fees.networkFee, fees.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PadiPay service fee</span>
                  <span>{formatCurrency(fees.serviceFee, fees.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total fees</span>
                  <span>{formatCurrency(fees.total, fees.currency)}</span>
                </div>
              </div>
            )}

            {/* Estimated Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Estimated delivery: {estimatedTime}</span>
            </div>

            {/* Reference */}
            {reference && (
              <div className="text-xs text-gray-500">
                <span>Reference: {reference}</span>
              </div>
            )}

            {/* Note */}
            {note && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Note</p>
                <p className="text-sm text-blue-800">{note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance Warning */}
        {hasInsufficientBalance && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={20} className="text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Insufficient Balance</p>
                  <p className="text-xs text-red-600">
                    You need {formatCurrency(totalAmount - userBalance, balanceCurrency)} more to complete this transaction.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Secure Transaction</p>
                <p className="text-xs text-green-600">
                  This transaction is protected by smart contract security and cannot be reversed once confirmed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={onConfirm}
            disabled={loading || hasInsufficientBalance}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send size={20} />
                <span>Confirm & Send</span>
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="w-full h-12"
          >
            Back to Edit
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center px-4 pb-4">
          By confirming, you agree that this transaction cannot be reversed. 
          Please verify all details are correct before proceeding.
        </div>
      </div>
    </div>
  );
};
