'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Minus, Plus } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
  locale: string;
}

interface CurrencyAmountInputProps {
  value: string;
  currency: Currency;
  onAmountChange: (amount: string, formattedAmount: string) => void;
  onCurrencyChange?: (currency: Currency) => void;
  availableCurrencies?: Currency[];
  placeholder?: string;
  maxAmount?: number;
  minAmount?: number;
  error?: string;
  disabled?: boolean;
  showCurrencySelector?: boolean;
  showQuickButtons?: boolean;
  label?: string;
}

const defaultCurrencies: Currency[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', decimals: 0, locale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', decimals: 0, locale: 'en-KE' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬��', decimals: 2, locale: 'en-GH' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', decimals: 0, locale: 'en-UG' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', decimals: 2, locale: 'en-ZA' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹', decimals: 2, locale: 'en-ET' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2, locale: 'en-US' },
  { code: 'USDT', name: 'Tether USD', symbol: 'USDT', flag: '₮', decimals: 2, locale: 'en-US' },
];

export const CurrencyAmountInput: React.FC<CurrencyAmountInputProps> = ({
  value,
  currency,
  onAmountChange,
  onCurrencyChange,
  availableCurrencies = defaultCurrencies,
  placeholder = "0.00",
  maxAmount,
  minAmount = 0,
  error,
  disabled = false,
  showCurrencySelector = true,
  showQuickButtons = true,
  label = "Amount"
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Format amount for display
  const formatAmount = (amount: string): string => {
    if (!amount || amount === '0') return '';
    
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return '';

    // Format according to currency settings
    return numValue.toLocaleString(currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: currency.decimals,
    });
  };

  // Parse input value to remove formatting
  const parseAmount = (formattedValue: string): string => {
    // Remove all non-digit and non-decimal characters
    const cleaned = formattedValue.replace(/[^\d.,]/g, '');
    
    // Handle different decimal separators
    const normalized = cleaned.replace(',', '.');
    
    // Ensure only one decimal point
    const parts = normalized.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return normalized;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const parsedValue = parseAmount(rawValue);
    
    // Validate decimal places
    if (parsedValue.includes('.')) {
      const [, decimal] = parsedValue.split('.');
      if (decimal.length > currency.decimals) {
        return; // Don't allow more decimal places than currency supports
      }
    }

    // Validate max amount
    const numValue = parseFloat(parsedValue);
    if (maxAmount && numValue > maxAmount) {
      return;
    }

    // Validate min amount
    if (numValue < minAmount) {
      // Allow temporary values below minimum during typing
    }

    setInputValue(parsedValue);
    
    // Format for display
    const formatted = parsedValue ? `${currency.symbol}${formatAmount(parsedValue)}` : '';
    onAmountChange(parsedValue, formatted);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    
    // Format the input when focus is lost
    if (inputValue) {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        const formatted = formatAmount(inputValue);
        setInputValue(formatted);
      }
    }
  };

  // Handle currency selection
  const handleCurrencySelect = (selectedCurrency: Currency) => {
    setShowCurrencyPicker(false);
    if (onCurrencyChange) {
      onCurrencyChange(selectedCurrency);
    }
  };

  // Quick amount buttons
  const getQuickAmounts = (): number[] => {
    const amounts: Record<string, number[]> = {
      NGN: [1000, 5000, 10000, 25000, 50000],
      KES: [500, 1000, 2500, 5000, 10000],
      GHS: [50, 100, 250, 500, 1000],
      UGX: [50000, 100000, 250000, 500000, 1000000],
      ZAR: [100, 250, 500, 1000, 2000],
      ETB: [500, 1000, 2500, 5000, 10000],
      USD: [10, 25, 50, 100, 250],
      USDT: [10, 25, 50, 100, 250],
    };
    
    return amounts[currency.code] || amounts.USD;
  };

  // Handle quick amount selection
  const handleQuickAmount = (amount: number) => {
    const amountStr = amount.toString();
    setInputValue(amountStr);
    const formatted = `${currency.symbol}${formatAmount(amountStr)}`;
    onAmountChange(amountStr, formatted);
  };

  // Increment/decrement functions
  const adjustAmount = (increment: boolean) => {
    const currentValue = parseFloat(inputValue) || 0;
    const step = currency.decimals === 0 ? 1 : 0.01;
    const newValue = increment ? currentValue + step : Math.max(minAmount, currentValue - step);
    
    if (maxAmount && newValue > maxAmount) return;
    
    const newValueStr = newValue.toFixed(currency.decimals);
    setInputValue(newValueStr);
    const formatted = `${currency.symbol}${formatAmount(newValueStr)}`;
    onAmountChange(newValueStr, formatted);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Main Input */}
      <div className="relative">
        <div className="flex">
          {/* Currency Selector */}
          {showCurrencySelector && (
            <Button
              type="button"
              variant="outline"
              className="flex-shrink-0 px-3 rounded-r-none border-r-0 h-12"
              onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
              disabled={disabled}
            >
              <span className="text-lg mr-2">{currency.flag}</span>
              <span className="text-sm font-medium">{currency.symbol}</span>
              <ChevronDown size={16} className="ml-1" />
            </Button>
          )}

          {/* Amount Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={isFocused ? inputValue : (inputValue ? formatAmount(inputValue) : '')}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={`${showCurrencySelector ? 'rounded-l-none' : ''} ${error ? 'border-red-500' : ''} h-12 text-lg font-semibold pr-20`}
              disabled={disabled}
            />
            
            {/* Increment/Decrement Buttons */}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-8 p-0"
                onClick={() => adjustAmount(true)}
                disabled={disabled}
              >
                <Plus size={12} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-8 p-0"
                onClick={() => adjustAmount(false)}
                disabled={disabled}
              >
                <Minus size={12} />
              </Button>
            </div>
          </div>
        </div>

        {/* Currency Picker Dropdown */}
        {showCurrencyPicker && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg" ref={dropdownRef}>
            <CardContent className="p-0">
              <div className="max-h-48 overflow-y-auto">
                {availableCurrencies.map((curr) => (
                  <button
                    key={curr.code}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-left"
                    onClick={() => handleCurrencySelect(curr)}
                  >
                    <span className="text-lg">{curr.flag}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{curr.code}</p>
                      <p className="text-sm text-gray-500">{curr.name}</p>
                    </div>
                    <span className="text-sm font-medium">{curr.symbol}</span>
                    {currency.code === curr.code && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Quick Amount Buttons */}
      {showQuickButtons && (
        <div className="grid grid-cols-5 gap-2">
          {getQuickAmounts().map((amount) => (
            <Button
              key={amount}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handleQuickAmount(amount)}
              disabled={disabled}
            >
              {currency.symbol}{amount.toLocaleString()}
            </Button>
          ))}
        </div>
      )}

      {/* Amount Limits Info */}
      {(minAmount > 0 || maxAmount) && (
        <div className="text-xs text-gray-500">
          {minAmount > 0 && maxAmount && (
            <span>Amount: {currency.symbol}{minAmount.toLocaleString()} - {currency.symbol}{maxAmount.toLocaleString()}</span>
          )}
          {minAmount > 0 && !maxAmount && (
            <span>Minimum: {currency.symbol}{minAmount.toLocaleString()}</span>
          )}
          {!minAmount && maxAmount && (
            <span>Maximum: {currency.symbol}{maxAmount.toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  );
};
