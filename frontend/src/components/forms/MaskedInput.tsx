'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface MaskedInputProps {
  mask: string;
  value: string;
  onChange: (value: string, unmaskedValue: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: 'text' | 'tel' | 'number';
  error?: string;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  type = 'text',
  error
}) => {
  const [maskedValue, setMaskedValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply mask to input value
  const applyMask = (inputValue: string, maskPattern: string): { masked: string; unmasked: string } => {
    const unmasked = inputValue.replace(/\D/g, ''); // Remove all non-digits
    let masked = '';
    let unmaskedIndex = 0;

    for (let i = 0; i < maskPattern.length && unmaskedIndex < unmasked.length; i++) {
      const maskChar = maskPattern[i];
      
      if (maskChar === '9') {
        // 9 represents a digit placeholder
        masked += unmasked[unmaskedIndex];
        unmaskedIndex++;
      } else if (maskChar === 'X') {
        // X represents any alphanumeric character
        if (unmaskedIndex < inputValue.length) {
          masked += inputValue[unmaskedIndex];
          unmaskedIndex++;
        }
      } else {
        // Static character in mask
        masked += maskChar;
      }
    }

    return { masked, unmasked };
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const { masked, unmasked } = applyMask(inputValue, mask);
    
    setMaskedValue(masked);
    onChange(masked, unmasked);

    // Store cursor position for restoration
    setCursorPosition(e.target.selectionStart || 0);
  };

  // Handle keydown for better UX
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const cursorPos = input.selectionStart || 0;
    
    // Handle backspace
    if (e.key === 'Backspace') {
      // If cursor is after a static character, move it back
      if (cursorPos > 0 && !isDigitPlaceholder(mask[cursorPos - 1])) {
        e.preventDefault();
        const newPos = findPreviousDigitPosition(cursorPos - 1);
        input.setSelectionRange(newPos, newPos);
        setCursorPosition(newPos);
      }
    }
    
    // Handle delete
    if (e.key === 'Delete') {
      const cursorPos = input.selectionStart || 0;
      if (cursorPos < maskedValue.length && !isDigitPlaceholder(mask[cursorPos])) {
        e.preventDefault();
        const newPos = findNextDigitPosition(cursorPos);
        input.setSelectionRange(newPos, newPos);
        setCursorPosition(newPos);
      }
    }
  };

  // Check if character in mask is a digit placeholder
  const isDigitPlaceholder = (char: string): boolean => {
    return char === '9' || char === 'X';
  };

  // Find previous digit position
  const findPreviousDigitPosition = (pos: number): number => {
    for (let i = pos; i >= 0; i--) {
      if (isDigitPlaceholder(mask[i])) {
        return i;
      }
    }
    return 0;
  };

  // Find next digit position
  const findNextDigitPosition = (pos: number): number => {
    for (let i = pos; i < mask.length; i++) {
      if (isDigitPlaceholder(mask[i])) {
        return i;
      }
    }
    return mask.length;
  };

  // Restore cursor position after masking
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [maskedValue, cursorPosition]);

  // Initialize masked value
  useEffect(() => {
    if (value) {
      const { masked } = applyMask(value, mask);
      setMaskedValue(masked);
    } else {
      setMaskedValue('');
    }
  }, [value, mask]);

  return (
    <div>
      <Input
        ref={inputRef}
        type={type}
        value={maskedValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500' : ''}`}
        disabled={disabled}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

// Predefined mask patterns for common use cases
export const MaskPatterns = {
  // Phone number patterns
  PHONE_NG: '+234 999 999 9999',
  PHONE_KE: '+254 999 999 999',
  PHONE_GH: '+233 99 999 9999',
  PHONE_UG: '+256 999 999 999',
  PHONE_ZA: '+27 99 999 9999',
  PHONE_ET: '+251 99 999 9999',
  
  // Amount patterns
  AMOUNT_CURRENCY: '9,999,999.99',
  AMOUNT_CRYPTO: '9,999.999999',
  
  // Card patterns
  CARD_NUMBER: '9999 9999 9999 9999',
  CARD_EXPIRY: '99/99',
  CARD_CVV: '999',
  
  // Other common patterns
  PIN: '9999',
  OTP: '999999',
  ACCOUNT_NUMBER: '9999999999',
} as const;

// Hook for common masked inputs
export const useMaskedInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [unmaskedValue, setUnmaskedValue] = useState('');

  const handleChange = (masked: string, unmasked: string) => {
    setValue(masked);
    setUnmaskedValue(unmasked);
  };

  const reset = () => {
    setValue('');
    setUnmaskedValue('');
  };

  return {
    value,
    unmaskedValue,
    onChange: handleChange,
    reset,
    isValid: unmaskedValue.length > 0,
  };
};
