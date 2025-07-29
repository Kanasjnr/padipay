import React, { useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { PhoneInputWithCountry } from '@/components/forms/PhoneInputWithCountry';
import { CurrencyAmountInput } from '@/components/forms/CurrencyAmountInput';
import { PaymentConfirmation } from '@/components/transaction/PaymentConfirmation';
import { TransactionSuccess } from '@/components/transaction/TransactionSuccess';
import { TransactionFailure } from '@/components/transaction/TransactionFailure';
import { usePayment } from '@/lib/WalletContext';

interface SendPageEnhancedProps {
  onBack: () => void;
}

// Define types
type SendStep = 'input' | 'confirmation' | 'success' | 'failure';

interface Country {
  name: string;
  code: string;
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
  { code: 'USDT', name: 'Tether USD', symbol: 'USDT', flag: '₮', decimals: 2, locale: 'en-US' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', decimals: 0, locale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', decimals: 0, locale: 'en-KE' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭', decimals: 2, locale: 'en-GH' },
];

export const SendPageEnhanced: React.FC<SendPageEnhancedProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<SendStep>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [amount, setAmount] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]); // Default to USDT
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Add message state
  const { success, error: showError } = useToast();
  const { sendPayment } = usePayment(); // Use real payment hook

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
    if (selectedCurrency.code !== 'USDT') {
      setError('Currently only USDT payments are supported');
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

  // Handle payment confirmation - Updated to use real payment
  const handleConfirmPayment = async () => {
    setLoading(true);
    
    try {
      console.log('💸 Starting payment:', { phoneNumber, amount, message });
      
      // Call the real payment function
      const result = await sendPayment(phoneNumber, amount, message || '');
      
      if (result.success) {
        console.log('✅ Payment successful:', result);
        setTransactionId(result.transactionHash || 'TX' + Date.now().toString().slice(-8));
        setCurrentStep('success');
        success('Payment sent successfully!', 'Your payment has been processed');
      } else {
        console.error('❌ Payment failed:', result.error);
        setError(result.error || 'Payment failed');
        setCurrentStep('failure');
        showError('Payment failed', result.error || 'An error occurred while processing your payment');
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCurrentStep('failure');
      showError('Payment failed', errorMessage);
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
      networkFee: 0.5, // Mock fee - real fees calculated by contract
      serviceFee: parseFloat(amount) * 0.02, // 2% platform fee
      total: 0.5 + (parseFloat(amount) * 0.02),
      currency: selectedCurrency.code,
    },
    estimatedTime: '2-5 minutes',
    reference: 'REF' + Date.now().toString().slice(-6),
    message: message,
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
      code: 'ERR_PAYMENT_001',
      message: error || 'Payment processing failed',
      reason: 'unknown' as const,
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
