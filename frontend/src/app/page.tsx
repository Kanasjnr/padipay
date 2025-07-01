'use client';

import React, { useState } from 'react';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';
import { PhoneRegistration } from '@/components/auth/PhoneRegistration';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { BottomNav } from '@/components/layout/BottomNav';
import { HomePage } from '@/components/wallet/HomePage';
import { SendPageEnhanced } from '@/components/wallet/SendPageEnhanced';
import { HistoryPage } from '@/components/wallet/HistoryPage';
import { ProfilePage } from '@/components/wallet/ProfilePage';
import SettingsPage from '@/components/wallet/SettingsPage';
import HelpCenter from '@/components/support/HelpCenter';

type AppState = 'onboarding' | 'phone-registration' | 'otp-verification' | 'app';
type TabState = 'home' | 'send' | 'history' | 'profile' | 'settings' | 'help';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [activeTab, setActiveTab] = useState<TabState>('home');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Onboarding completed
  const handleOnboardingComplete = () => {
    setAppState('phone-registration');
  };

  // Phone registration completed
  const handlePhoneRegistrationSuccess = (phone: string) => {
    setPhoneNumber(phone);
    setAppState('otp-verification');
  };

  // Back to phone registration
  const handleBackToPhoneRegistration = () => {
    setAppState('phone-registration');
  };

  // OTP verification completed
  const handleOTPVerificationSuccess = () => {
    setAppState('app');
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch (appState) {
      case 'onboarding':
        return <OnboardingCarousel onComplete={handleOnboardingComplete} />;
      
      case 'phone-registration':
        return (
          <PhoneRegistration 
            onSuccess={handlePhoneRegistrationSuccess}
          />
        );
      
      case 'otp-verification':
        return (
          <OTPVerification
            phoneNumber={phoneNumber}
            onSuccess={handleOTPVerificationSuccess}
            onBack={handleBackToPhoneRegistration}
          />
        );
      
      case 'app':
        return (
          <div className="min-h-screen pb-20">
            <div className="pb-4">
              {activeTab === 'home' && (
                <HomePage onNavigate={setActiveTab} />
              )}
              {activeTab === 'send' && (
                <SendPageEnhanced onBack={() => setActiveTab('home')} />
              )}
              {activeTab === 'history' && (
                <HistoryPage onBack={() => setActiveTab('home')} />
              )}
              {activeTab === 'profile' && (
                <ProfilePage onBack={() => setActiveTab('home')} />
              )}
              {activeTab === 'settings' && (
                <SettingsPage 
                  onBack={() => setActiveTab('home')}
                  onLogout={() => setAppState('onboarding')}
                  onEditProfile={() => setActiveTab('profile')}
                />
              )}
              {activeTab === 'help' && (
                <HelpCenter 
                  onBack={() => setActiveTab('home')}
                  onContactSupport={(method) => console.log(`Contact support via ${method}`)}
                />
              )}
            </div>
            
            {['home', 'send', 'history', 'profile'].includes(activeTab) && (
              <BottomNav 
                activeTab={activeTab as 'home' | 'send' | 'history' | 'profile'} 
                onTabChange={setActiveTab} 
              />
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentScreen()}
    </div>
  );
}
