'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PadiPayWallet, WalletData, BalanceInfo, PaymentHistoryItem } from './padiPayWallet';

interface WalletContextType {
  wallet: PadiPayWallet | null;
  balance: BalanceInfo | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  loadWallet: () => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<PadiPayWallet | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = wallet !== null;

  // Load wallet from localStorage on component mount
  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedWalletData = localStorage.getItem('padiPayWallet');
      if (!storedWalletData) {
        console.log('📱 No stored wallet found');
        setIsLoading(false);
        return;
      }

      const walletData: WalletData = JSON.parse(storedWalletData);
      console.log('🔄 Loading wallet:', walletData.walletAddress);

      const walletInstance = new PadiPayWallet(walletData);
      setWallet(walletInstance);

      // Load initial balance
      await refreshBalanceInternal(walletInstance);

      console.log('✅ Wallet loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load wallet:', error);
      setError('Failed to load wallet');
      // Clear invalid wallet data
      localStorage.removeItem('padiPayWallet');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalanceInternal = async (walletInstance: PadiPayWallet) => {
    try {
      const newBalance = await walletInstance.getBalance();
      setBalance(newBalance);
      console.log('💰 Balance updated:', newBalance);
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      setError('Failed to get balance');
    }
  };

  const refreshBalance = async () => {
    if (!wallet) return;
    await refreshBalanceInternal(wallet);
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('padiPayWallet');
    setWallet(null);
    setBalance(null);
    setError(null);
  };

  const contextValue: WalletContextType = {
    wallet,
    balance,
    isLoading,
    error,
    isAuthenticated,
    loadWallet,
    logout,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook for sending payments
export function usePayment() {
  const { wallet, refreshBalance } = useWallet();

  const sendPayment = async (
    toPhoneNumber: string,
    amount: string,
    message: string = ''
  ) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const result = await wallet.sendPayment(toPhoneNumber, amount, message);
    
    // Refresh balance after successful payment
    if (result.success) {
      await refreshBalance();
    }
    
    return result;
  };

  return { sendPayment };
}

// Hook for payment history
export function usePaymentHistory() {
  const { wallet } = useWallet();
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = async () => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      const payments = await wallet.getPaymentHistory();
      setHistory(payments);
    } catch (error) {
      console.error('❌ Failed to load payment history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [wallet]);

  return { history, isLoading, refreshHistory: loadHistory };
} 