import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/components/ui/toast';
import { PhoneInputWithCountry } from '@/components/forms/PhoneInputWithCountry';
import { CurrencyAmountInput } from '@/components/forms/CurrencyAmountInput';
import { PaymentConfirmation } from '@/components/transaction/PaymentConfirmation';
import { TransactionSuccess } from '@/components/transaction/TransactionSuccess';
import { TransactionFailure } from '@/components/transaction/TransactionFailure';
import { BackendApproval } from '@/components/wallet/BackendApproval';
import { usePayment, useWallet } from '@/lib/WalletContext';

interface SendPageEnhancedProps {
  onBack: () => void;
}

// Define types
type SendStep = 'input' | 'confirmation' | 'approval' | 'success' | 'failure';

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

interface PaymentResultWithApproval {
  success: boolean;
  error?: string;
  transactionHash?: string;
  requiredApproval?: {
    contract: string;
    spender: string;
    amount: string;
  };
  details?: string;
  instructions?: string;
  explanation?: string;
}



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
  const [approvalData, setApprovalData] = useState<{contract: string; spender: string; amount: string} | null>(null); // Store approval requirements
  const { success, error: showError } = useToast();
  const { sendPayment } = usePayment(); // Use real payment hook
  const { balance } = useWallet();

  // Get real user balance in USDT
  const userBalance = balance?.usdt ? parseFloat(balance.usdt) : 0;
  const balanceCurrency = 'USDT';

  // Calculate fees for Account Abstraction
  const calculateFees = () => {
    const amountValue = parseFloat(amount) || 0;
    
    // Service fee calculation (reasonable for small payments)
    const feePercentage = 2; // 2%
    const minimumFeeUSDT = 0.05; // $0.05 minimum fee (reasonable for small payments)
    const percentageFee = (amountValue * feePercentage) / 100;
    const serviceFee = Math.max(percentageFee, minimumFeeUSDT);
    
    return {
      networkFee: 0,        // ✅ FREE - Backend sponsors gas!
      serviceFee: serviceFee, // 📊 Actual PadiPayCore service fee
      total: serviceFee     // Total fees user pays
    };
  };

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
    
    // Check if user has enough balance including fees
    const fees = calculateFees();
    const totalRequired = parseFloat(amount) + fees.total;
    if (totalRequired > userBalance) {
      setError(`Insufficient balance. You need ${totalRequired.toFixed(2)} USDT (${parseFloat(amount).toFixed(2)} + ${fees.total.toFixed(2)} fees)`);
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
        
        // Check if it's an approval error
        if ((result as PaymentResultWithApproval).requiredApproval) {
          console.log('🔐 Backend approval required:', (result as PaymentResultWithApproval).requiredApproval);
          setApprovalData((result as PaymentResultWithApproval).requiredApproval!);
          setCurrentStep('approval');
        } else {
          setError(result.error || 'Payment failed');
          setCurrentStep('failure');
          showError('Payment failed', result.error || 'An error occurred while processing your payment');
        }
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
  const calculatedFees = calculateFees();
  const paymentDetails = {
    recipient: {
      name: undefined, // No name lookup without contacts
      phone: phoneNumber,
      avatar: undefined, // No avatar without contacts
      country: selectedCountry?.name || 'Unknown',
      countryFlag: selectedCountry?.flag || '🌍',
    },
    amount: {
      value: parseFloat(amount) || 0,
      currency: selectedCurrency.code,
      formatted: formattedAmount,
    },
    exchangeRate: undefined, // Only USDT supported
    fees: {
      networkFee: calculatedFees.networkFee,
      serviceFee: calculatedFees.serviceFee,
      total: calculatedFees.total,
      currency: selectedCurrency.code,
    },
    estimatedTime: '2-5 minutes',
    reference: `TX${Date.now().toString().slice(-6)}`,
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
      code: 'PAYMENT_FAILED',
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

    case 'approval':
      if (!approvalData) return null;
      return (
        <BackendApproval
          requiredApproval={approvalData}
          onBack={handleBackToInput}
          onApprovalComplete={() => {
            setApprovalData(null);
            setCurrentStep('confirmation');
          }}
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
              <p className="text-sm text-gray-600">Send USDT to any phone number</p>
            </div>
          </div>

          <div className="space-y-6">

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
                  maxAmount={userBalance > 0 ? userBalance : 10000}
                  minAmount={1}
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

            {/* Optional Message */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Message (Optional)</CardTitle>
                <CardDescription>Add a note to your payment</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a message for the recipient..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{message.length}/100 characters</p>
              </CardContent>
            </Card>

            {/* Balance Info */}
            {amount && parseFloat(amount) > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Send Amount:</span>
                      <span className="font-medium">USDT {parseFloat(amount).toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-green-600">
                       <span className="text-sm">All Fees:</span>
                       <span className="text-sm font-medium">FREE 🚀 (Account Abstraction)</span>
                     </div>
                     <div className="flex justify-between text-green-600">
                       <span className="text-sm">Gas Fee:</span>
                       <span className="text-sm font-medium">FREE ✨ (Paymaster Sponsored)</span>
                     </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total Needed:</span>
                      <span className="font-bold">USDT {(parseFloat(amount) + calculateFees().total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Balance:</span>
                      <span className={`font-medium ${
                        (parseFloat(amount) + calculateFees().total) > userBalance 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        USDT {userBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={
                !phoneNumber || 
                !amount || 
                parseFloat(amount) <= 0 ||
                (parseFloat(amount) + calculateFees().total) > userBalance
              }
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
