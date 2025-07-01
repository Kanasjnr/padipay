import React, { useState } from 'react';
import { SplashScreen } from './SplashScreen';
import { Progress } from '@/components/ui/progress';
import { Smartphone, Zap, Shield } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const splashScreens = [
  {
    title: "Send Money Across Africa",
    subtitle: "No Wallet Address Needed",
    description: "Send money to anyone in Africa using just their phone number. No complicated addresses to remember.",
    icon: <Smartphone className="w-20 h-20" />,
  },
  {
    title: "Instant Smart Wallets",
    subtitle: "Auto-Created for Recipients",
    description: "Recipients get a smart wallet automatically when they claim funds. Works across all African countries.",
    icon: <Zap className="w-20 h-20" />,
  },
  {
    title: "Built on Morph",
    subtitle: "Gasless & Secure",
    description: "Powered by ERC-4337 smart accounts with gasless transactions. Your money, your control.",
    icon: <Shield className="w-20 h-20" />,
  },
];

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (currentIndex < splashScreens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const progress = ((currentIndex + 1) / splashScreens.length) * 100;

  return (
    <div className="relative min-h-screen safe-area-inset">
      {/* Status Bar Spacer */}
      <div className="h-safe-top bg-gradient-to-br from-indigo-50 to-purple-50"></div>
      
      {/* Progress Indicator */}
      <div className="absolute top-safe-top left-0 right-0 z-10 p-4">
        <Progress value={progress} className="h-1 bg-white/30" />
      </div>

      {/* Current Splash Screen */}
      <SplashScreen
        {...splashScreens[currentIndex]}
        isLast={currentIndex === splashScreens.length - 1}
        onNext={handleNext}
        onSkip={handleSkip}
      />

      {/* Dots Indicator */}
      <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {splashScreens.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-indigo-600 w-6' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Bottom spacing for safe area */}
      <div className="h-safe-bottom bg-gradient-to-br from-indigo-50 to-purple-50"></div>
    </div>
  );
}; 