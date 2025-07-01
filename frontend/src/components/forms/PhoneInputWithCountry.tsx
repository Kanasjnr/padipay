'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Search, X } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  mask?: string;
}

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (phoneNumber: string, country: Country) => void;
  onValidation?: (isValid: boolean) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

// African countries with phone formatting
const countries: Country[] = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', prefix: '+234', mask: 'xxx xxx xxxx' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', prefix: '+254', mask: 'xxx xxx xxx' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', prefix: '+233', mask: 'xx xxx xxxx' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', prefix: '+256', mask: 'xxx xxx xxx' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', prefix: '+27', mask: 'xx xxx xxxx' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', prefix: '+251', mask: 'xx xxx xxxx' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', prefix: '+255', mask: 'xxx xxx xxx' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', prefix: '+250', mask: 'xxx xxx xxx' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', prefix: '+226', mask: 'xx xx xx xx' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', prefix: '+225', mask: 'xx xx xx xx xx' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', prefix: '+221', mask: 'xx xxx xx xx' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', prefix: '+223', mask: 'xx xx xx xx' },
];

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  onValidation,
  placeholder = "Enter phone number",
  error,
  disabled = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.prefix.includes(searchQuery)
  );

  // Format phone number according to country mask
  const formatPhoneNumber = (number: string, mask?: string): string => {
    if (!mask) return number;
    
    const digits = number.replace(/\D/g, '');
    let formatted = '';
    let digitIndex = 0;
    
    for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
      if (mask[i] === 'x') {
        formatted += digits[digitIndex];
        digitIndex++;
      } else {
        formatted += mask[i];
      }
    }
    
    return formatted;
  };

  // Validate phone number
  const validatePhoneNumber = (number: string, country: Country): boolean => {
    const digits = number.replace(/\D/g, '');
    const expectedLength = country.mask?.replace(/[^x]/g, '').length || 10;
    
    // Basic validation - check if we have the expected number of digits
    return digits.length >= expectedLength - 2 && digits.length <= expectedLength + 2;
  };

  // Handle phone number input
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneNumber(rawValue, selectedCountry.mask);
    
    setPhoneNumber(formattedValue);
    
    // Create full phone number
    const digits = rawValue.replace(/\D/g, '');
    const fullPhoneNumber = `${selectedCountry.prefix}${digits}`;
    
    // Validate
    const isValid = validatePhoneNumber(formattedValue, selectedCountry);
    onValidation?.(isValid);
    
    onChange(fullPhoneNumber, selectedCountry);
  };

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setSearchQuery('');
    
    // Reformat existing number with new country
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '');
      const formattedValue = formatPhoneNumber(digits, country.mask);
      setPhoneNumber(formattedValue);
      
      const fullPhoneNumber = `${country.prefix}${digits}`;
      onChange(fullPhoneNumber, country);
    }
    
    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryPicker(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize with value prop
  useEffect(() => {
    if (value && !phoneNumber) {
      // Try to extract country and number from full phone number
      const matchedCountry = countries.find(country => value.startsWith(country.prefix));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        const digits = value.replace(matchedCountry.prefix, '').replace(/\D/g, '');
        const formatted = formatPhoneNumber(digits, matchedCountry.mask);
        setPhoneNumber(formatted);
      }
    }
  }, [value, phoneNumber]);

  return (
    <div className="relative">
      <div className="flex">
        {/* Country Selector */}
        <Button
          type="button"
          variant="outline"
          className="flex-shrink-0 px-3 rounded-r-none border-r-0 h-12"
          onClick={() => setShowCountryPicker(!showCountryPicker)}
          disabled={disabled}
        >
          <span className="text-lg mr-2">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{selectedCountry.prefix}</span>
          <ChevronDown size={16} className="ml-1" />
        </Button>

        {/* Phone Number Input */}
        <Input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={selectedCountry.mask?.replace(/x/g, '0') || placeholder}
          className={`rounded-l-none h-12 ${error ? 'border-red-500' : ''}`}
          disabled={disabled}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Country Picker Dropdown */}
      {showCountryPicker && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg" ref={dropdownRef}>
          <CardContent className="p-0">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            </div>

            {/* Country List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-left"
                    onClick={() => handleCountrySelect(country)}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{country.name}</p>
                      <p className="text-sm text-gray-500">{country.prefix}</p>
                    </div>
                    {selectedCountry.code === country.code && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>No countries found</p>
                  <p className="text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
