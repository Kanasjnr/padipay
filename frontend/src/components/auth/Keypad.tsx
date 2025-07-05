import React from 'react';
import { Button } from '@/components/ui/button';
import { Delete, X } from 'lucide-react';

interface KeypadProps {
  onKeyPress: (value: string) => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({ onKeyPress, disabled = false }) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace']
  ];

  const handleKeyPress = (key: string) => {
    if (disabled) return;
    onKeyPress(key);
  };

  const renderKey = (key: string) => {
    if (key === 'backspace') {
      return (
        <Button
          key={key}
          variant="ghost"
          size="lg"
          className="h-14 text-gray-600 hover:bg-gray-100"
          onClick={() => handleKeyPress(key)}
          disabled={disabled}
        >
          <Delete size={20} />
        </Button>
      );
    }

    if (key === 'clear') {
      return (
        <Button
          key={key}
          variant="ghost"
          size="lg"
          className="h-14 text-gray-600 hover:bg-gray-100"
          onClick={() => handleKeyPress(key)}
          disabled={disabled}
        >
          <X size={20} />
        </Button>
      );
    }

    return (
      <Button
        key={key}
        variant="ghost"
        size="lg"
        className="h-14 text-xl font-semibold text-gray-900 hover:bg-gray-100"
        onClick={() => handleKeyPress(key)}
        disabled={disabled}
      >
        {key}
      </Button>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {keys.flat().map(renderKey)}
    </div>
  );
}; 