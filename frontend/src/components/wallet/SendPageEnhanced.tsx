import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { LoadingButton, TransactionProcessing } from '@/components/ui/loading';
import { InlineError } from '@/components/ui/error-boundary';

import { PaymentConfirmation } from '@/components/transaction/PaymentConfirmation';
import { TransactionSuccess } from '@/components/transaction/TransactionSuccess';
import { TransactionFailure } from '@/components/transaction/TransactionFailure';
import { PhoneInputWithCountry } from '@/components/forms/PhoneInputWithCountry';
import { CurrencyAmountInput } from '@/components/forms/CurrencyAmountInput';

interface SendPageEnhancedProps {
  onBack: () => void;
}

type SendStep = 'input' | 'confirmation' | 'success' | 'failure';

interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
  locale: string;
}

const recentContacts = [
  { name: 'Kemi Adebayo', phone: '+234 xxx xxx 8901', country: '🇳🇬', avatar: 'KA' },
  { name: 'John Mwangi', phone: '+254 xxx xxx 7890', country: '🇰🇪', avatar: 'JM' },
  { name: 'Aisha Mohammed', phone: '+233 xxx xxx 2345', country: '🇬🇭', avatar: 'AM' },
  { name: 'David Okello', phone: '+256 xxx xxx 3456', country: '🇺🇬', avatar: 'DO' },
];

const currencies: Currency[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', decimals: 0, locale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', decimals: 0, locale: 'en-KE' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭', decimals: 2, locale: 'en-GH' },
  { code: 'USDT', name: 'Tether USD', symbol: 'USDT', flag: '₮', decimals: 2, locale: 'en-US' },
];

export const SendPageEnhanced: React.FC<SendPageEnhancedProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<SendStep>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [amount, setAmount] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const { success, error: showError } = useToast();

  // Mock user balance
  const userBalance = 175000;
  const balanceCurrency = 'NGN';

  // Handle phone number input
  const handlePhoneNumberChange = (phone: string, country: Country) => {
    setPhoneNumber(phone);
    setSelectedCountry(country);
    setError('');
  };

  // Handle amount input
  const handleAmountChange = (rawAmount: string, formatted: string) => {
    setAmount(rawAmount);
    setFormattedAmount(formatted);
    setError('');
  };

  // Handle currency change
  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    return true;
  };

  // Handle continue to confirmation
  const handleContinue = () => {
    if (validateForm()) {
      setCurrentStep('confirmation');
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate transaction ID
      const txId = 'TX' + Date.now().toString().slice(-8);
      setTransactionId(txId);
      
      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.3; // 70% success rate
      
      if (isSuccess) {
        setCurrentStep('success');
      } else {
        setCurrentStep('failure');
      }
    } catch {
      setCurrentStep('failure');
    } finally {
      setLoading(false);
    }
  };

  // Handle back to input
  const handleBackToInput = () => {
    setCurrentStep('input');
    setError('');
  };

  // Handle retry
  const handleRetry = () => {
    setCurrentStep('confirmation');
  };

  // Handle go home
  const handleGoHome = () => {
    onBack();
  };

  // Prepare payment details for confirmation
  const paymentDetails = {
    recipient: {
      name: recentContacts.find(c => c.phone === phoneNumber)?.name,
      phone: phoneNumber,
      avatar: recentContacts.find(c => c.phone === phoneNumber)?.avatar,
      country: selectedCountry?.name || 'Unknown',
      countryFlag: selectedCountry?.flag || '🌍',
    },
    amount: {
      value: parseFloat(amount) || 0,
      currency: selectedCurrency.code,
      formatted: formattedAmount,
    },
    exchangeRate: selectedCurrency.code !== 'USDT' ? {
      from: selectedCurrency.code,
      to: 'USDT',
      rate: 0.0016, // Mock rate
      convertedAmount: 'USDT ' + (parseFloat(amount) * 0.0016).toFixed(2),
    } : undefined,
    fees: {
      networkFee: 0.5,
      serviceFee: parseFloat(amount) * 0.01,
      total: 0.5 + (parseFloat(amount) * 0.01),
      currency: selectedCurrency.code,
    },
    estimatedTime: '2-5 minutes',
    reference: 'REF' + Date.now().toString().slice(-6),
  };

  // Prepare transaction data for success/failure screens
  const transactionData = {
    id: transactionId,
    amount: formattedAmount,
    currency: selectedCurrency.code,
    recipient: paymentDetails.recipient,
    timestamp: new Date().toLocaleTimeString(),
    status: 'completed' as const,
    fees: `${selectedCurrency.symbol}${paymentDetails.fees.total.toFixed(2)}`,
    reference: paymentDetails.reference,
  };

  const failureData = {
    ...transactionData,
    error: {
      code: 'ERR_NETWORK_001',
      message: 'Network connection failed',
      reason: 'network_error' as const,
    },
  };

  // Render based on current step
  switch (currentStep) {
    case 'confirmation':
      return (
        <PaymentConfirmation
          paymentDetails={paymentDetails}
          onConfirm={handleConfirmPayment}
          onBack={handleBackToInput}
          loading={loading}
          userBalance={userBalance}
          balanceCurrency={balanceCurrency}
        />
      );

    case 'success':
      return (
        <TransactionSuccess
          transactionData={transactionData}
          onGoHome={handleGoHome}
          onViewReceipt={() => console.log('View receipt')}
          onShare={() => console.log('Share transaction')}
        />
      );

    case 'failure':
      return (
        <TransactionFailure
          transactionData={failureData}
          onRetry={handleRetry}
          onGoHome={handleGoHome}
          onContactSupport={() => console.log('Contact support')}
        />
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          {/* Header */}
          <div className="flex items-center space-x-3 py-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Send Money</h1>
              <p className="text-sm text-gray-600">Enhanced with new components</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Contacts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Users size={18} className="mr-2 text-indigo-600" />
                  Quick Send
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {recentContacts.map((contact, index) => (
                    <button
                      key={index}
                      onClick={() => handlePhoneNumberChange(contact.phone, {
                        code: contact.country,
                        name: contact.name,
                        flag: contact.country,
                        prefix: contact.phone.split(' ')[0]
                      })}
                      className="flex-shrink-0 flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[80px]"
                    >
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center relative">
                        <span className="text-indigo-600 font-semibold text-xs">{contact.avatar}</span>
                        <span className="absolute -bottom-1 -right-1 text-xs">{contact.country}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-900 truncate w-16">{contact.name.split(' ')[0]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Phone Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recipient</CardTitle>
                <CardDescription>Enter phone number</CardDescription>
              </CardHeader>
              <CardContent>
                <PhoneInputWithCountry
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  error={error && !amount ? error : undefined}
                />
              </CardContent>
            </Card>

            {/* Amount Input - Two options to demonstrate both components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Amount</CardTitle>
                <CardDescription>Choose amount and currency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Option 1: Currency Amount Input */}
                <CurrencyAmountInput
                  value={amount}
                  currency={selectedCurrency}
                  onAmountChange={handleAmountChange}
                  onCurrencyChange={handleCurrencyChange}
                  availableCurrencies={currencies}
                  maxAmount={1000000}
                  minAmount={100}
                  error={error && !phoneNumber ? error : undefined}
                />

                {/* Option 2: Amount Calculator (Alternative) */}
                {/* Uncomment to use AmountCalculator instead
                <AmountCalculator
                  currency={selectedCurrency.code}
                  initialAmount={amount}
                  onAmountChange={handleAmountChange}
                  maxAmount={1000000}
                />
                */}
              </CardContent>
            </Card>


            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!phoneNumber || !amount || parseFloat(amount) <= 0}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              Continue to Review
            </Button>
          </div>
        </div>
      );
  }
};
