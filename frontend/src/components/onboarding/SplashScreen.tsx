import React from 'react';
import { Button } from '@/components/ui/button';

interface SplashScreenProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
  onNext: () => void;
  onSkip?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  title,
  subtitle,
  description,
  icon,
  isLast = false,
  onNext,
  onSkip,
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Skip Button */}
      {!isLast && onSkip && (
        <div className="w-full flex justify-end pt-4">
          <Button variant="ghost" onClick={onSkip} className="text-gray-500">
            Skip
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-sm">
        {/* Icon */}
        <div className="w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl">
          <div className="text-white text-8xl">
            {icon}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
          <h2 className="text-xl font-semibold text-indigo-600">
            {subtitle}
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            {description}
          </p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="w-full space-y-4">
        <Button 
          onClick={onNext} 
          className="w-full py-4 text-lg font-semibold"
          size="lg"
        >
          {isLast ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}; 