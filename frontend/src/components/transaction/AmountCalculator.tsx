'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Delete, Calculator } from 'lucide-react';

interface AmountCalculatorProps {
  currency: string;
  initialAmount?: string;
  maxAmount?: number;
  onAmountChange: (amount: string, formattedAmount: string) => void;
  placeholder?: string;
}

// Currency formatting configuration
const currencyConfig = {
  NGN: { symbol: '₦', decimals: 0, locale: 'en-NG' },
  KES: { symbol: 'KSh', decimals: 0, locale: 'en-KE' },
  GHS: { symbol: '₵', decimals: 2, locale: 'en-GH' },
  UGX: { symbol: 'USh', decimals: 0, locale: 'en-UG' },
  ZAR: { symbol: 'R', decimals: 2, locale: 'en-ZA' },
  ETB: { symbol: 'Br', decimals: 2, locale: 'en-ET' },
  USD: { symbol: '$', decimals: 2, locale: 'en-US' },
  USDT: { symbol: 'USDT', decimals: 2, locale: 'en-US' },
};

export const AmountCalculator: React.FC<AmountCalculatorProps> = ({
  currency,
  initialAmount = '',
  maxAmount,
  onAmountChange,
  placeholder = '0'
}) => {
  const [amount, setAmount] = useState(initialAmount);
  const [showCalculator, setShowCalculator] = useState(false);

  const config = currencyConfig[currency as keyof typeof currencyConfig] || currencyConfig.USD;

  // Format amount for display
  const formatAmount = (value: string): string => {
    if (!value || value === '0') return placeholder;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return placeholder;

    // Handle decimal places based on currency
    if (config.decimals === 0) {
      return `${config.symbol}${Math.floor(numValue).toLocaleString(config.locale)}`;
    } else {
      return `${config.symbol}${numValue.toLocaleString(config.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: config.decimals
      })}`;
    }
  };

  // Handle number input
  const handleNumberInput = (digit: string) => {
    let newAmount = amount;

    if (digit === '.') {
      // Only add decimal if currency supports it and doesn't already have one
      if (config.decimals > 0 && !amount.includes('.')) {
        newAmount = amount + '.';
      }
    } else {
      // Handle decimal places limit
      if (amount.includes('.')) {
        const [whole, decimal] = amount.split('.');
        if (decimal.length >= config.decimals) return; // Max decimal places reached
      }

      newAmount = amount === '0' ? digit : amount + digit;
    }

    // Check max amount limit
    const numValue = parseFloat(newAmount);
    if (maxAmount && numValue > maxAmount) return;

    setAmount(newAmount);
    onAmountChange(newAmount, formatAmount(newAmount));
  };

  // Handle backspace
  const handleBackspace = () => {
    const newAmount = amount.length <= 1 ? '0' : amount.slice(0, -1);
    setAmount(newAmount);
    onAmountChange(newAmount, formatAmount(newAmount));
  };

  // Handle clear
  const handleClear = () => {
    setAmount('0');
    onAmountChange('0', formatAmount('0'));
  };

  // Number pad layout
  const numberPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [config.decimals > 0 ? '.' : '', '0', 'backspace']
  ];

  useEffect(() => {
    setAmount(initialAmount || '0');
  }, [initialAmount]);

  return (
    <div className="space-y-4">
      {/* Amount Display */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Amount to Send</p>
            <div 
              className="text-4xl font-bold text-gray-900 min-h-[3rem] flex items-center justify-center cursor-pointer"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              {formatAmount(amount)}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center justify-center">
              <Calculator size={12} className="mr-1" />
              Tap to {showCalculator ? 'hide' : 'show'} calculator
            </p>
            {maxAmount && (
              <p className="text-xs text-gray-500 mt-1">
                Max: {formatAmount(maxAmount.toString())}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calculator Keypad */}
      {showCalculator && (
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {numberPad.map((row, rowIndex) => 
                row.map((key, keyIndex) => {
                  if (!key) return <div key={`${rowIndex}-${keyIndex}`}></div>;
                  
                  if (key === 'backspace') {
                    return (
                      <Button
                        key={`${rowIndex}-${keyIndex}`}
                        variant="outline"
                        size="lg"
                        className="h-14 text-lg active:bg-gray-100"
                        onClick={handleBackspace}
                      >
                        <Backspace size={20} />
                      </Button>
                    );
                  }

                  return (
                    <Button
                      key={`${rowIndex}-${keyIndex}`}
                      variant="outline"
                      size="lg"
                      className="h-14 text-lg font-semibold active:bg-gray-100"
                      onClick={() => handleNumberInput(key)}
                    >
                      {key}
                    </Button>
                  );
                })
              )}
              
              {/* Clear Button */}
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg font-semibold col-span-3 text-red-600 hover:bg-red-50 active:bg-red-100"
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {getQuickAmounts(currency).map((quickAmount) => (
          <Button
            key={quickAmount}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const amountStr = quickAmount.toString();
              setAmount(amountStr);
              onAmountChange(amountStr, formatAmount(amountStr));
            }}
          >
            {formatAmount(quickAmount.toString())}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Quick amount suggestions based on currency
const getQuickAmounts = (currency: string): number[] => {
  const quickAmounts: Record<string, number[]> = {
    NGN: [1000, 5000, 10000],
    KES: [500, 1000, 2500],
    GHS: [50, 100, 250],
    UGX: [50000, 100000, 250000],
    ZAR: [100, 250, 500],
    ETB: [500, 1000, 2500],
    USD: [10, 25, 50],
    USDT: [10, 25, 50],
  };
  
  return quickAmounts[currency] || quickAmounts.USD;
};
 