'use client';

import React, { useState } from 'react';
import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { PhoneRegistration } from '@/components/auth/PhoneRegistration';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { PinLogin } from '@/components/auth/PinLogin';
import { PinSetup } from '@/components/auth/PinSetup';
import { BottomNav } from '@/components/layout/BottomNav';
import { HomePage } from '@/components/wallet/HomePage';
import { SendPageEnhanced } from '@/components/wallet/SendPageEnhanced';
import { HistoryPage } from '@/components/wallet/HistoryPage';
import { ProfilePage } from '@/components/wallet/ProfilePage';
import SettingsPage from '@/components/wallet/SettingsPage';
import HelpCenter from '@/components/support/HelpCenter';

type AppState = 'onboarding' | 'register' | 'pin-login' | 'phone-registration' | 'otp-verification' | 'pin-setup' | 'app';
type TabState = 'home' | 'send' | 'history' | 'profile' | 'settings' | 'help';

export default function Home() {
  // Check authentication status immediately
  const getInitialState = (): AppState => {
    if (typeof window === 'undefined') return 'onboarding'; // SSR safety
    
    const hasWallet = localStorage.getItem('padiPayWallet');
    const hasPin = localStorage.getItem('padiPayPinHash');
    const isAuthenticated = localStorage.getItem('padiPayAuthenticated');
    
    if (hasWallet && hasPin && isAuthenticated === 'true') {
      return 'app'; // User is authenticated, go directly to app
    }
    
    return 'onboarding'; // Everyone else sees onboarding first
  };

  const [appState, setAppState] = useState<AppState>(getInitialState);
  const [activeTab, setActiveTab] = useState<TabState>('home');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Onboarding completed
  const handleOnboardingComplete = () => {
    setAppState('register');
  };

  // Register page - Login option
  const handleLogin = () => {
    setAppState('pin-login');
  };

  // Register page - Create Wallet option
  const handleCreateWallet = () => {
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

  // OTP verification completed (new user)
  const handleOTPVerificationSuccess = () => {
    setAppState('pin-setup');
  };

  // PIN setup completed
  const handlePinSetupComplete = () => {
    setAppState('app');
  };

  // PIN login successful
  const handlePinLoginSuccess = () => {
    setAppState('app');
  };

  // Forgot PIN - go to OTP verification
  const handleForgotPin = () => {
    setAppState('phone-registration');
  };

  // New user from PIN login
  const handleNewUserFromPinLogin = () => {
    setAppState('register');
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('padiPayAuthenticated');
    localStorage.removeItem('padiPayLastAuth');
    setAppState('pin-login');
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch (appState) {
      case 'onboarding':
        return <OnboardingCarousel onComplete={handleOnboardingComplete} />;
      
      case 'register':
        return (
          <RegisterPage 
            onLogin={handleLogin}
            onCreateWallet={handleCreateWallet}
          />
        );
      
      case 'pin-login':
        return (
          <PinLogin 
            onSuccess={handlePinLoginSuccess}
            onForgotPin={handleForgotPin}
            onNewUser={handleNewUserFromPinLogin}
          />
        );
      
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
      
      case 'pin-setup':
        return (
          <PinSetup 
            onComplete={handlePinSetupComplete}
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
                <ProfilePage 
                  onBack={() => setActiveTab('home')} 
                  onLogout={handleLogout}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsPage 
                  onBack={() => setActiveTab('home')}
                  onLogout={handleLogout}
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
