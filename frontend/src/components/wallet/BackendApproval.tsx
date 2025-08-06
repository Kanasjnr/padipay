import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  Zap,
  Info,
  AlertTriangle 
} from 'lucide-react';

interface BackendApprovalProps {
  requiredApproval: {
    contract: string;
    spender: string;
    amount: string;
  };
  onBack: () => void;
  onApprovalComplete: () => void;
}

export const BackendApproval: React.FC<BackendApprovalProps> = ({
  requiredApproval,
  onBack,
  onApprovalComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    
    try {
      console.log('🚀 TRUE Account Abstraction: Backend sponsors approval gas!');
      
      // Get wallet data 
      const walletData = localStorage.getItem('padiPayWallet');
      if (!walletData) {
        throw new Error('No wallet data found');
      }

      const wallet = JSON.parse(walletData);
      
      // Call the gasless approval API - backend pays ALL gas!
      const response = await fetch('/api/payment/approve-backend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWalletAddress: wallet.walletAddress,
          approvalAmount: requiredApproval.amount,
          sessionToken: wallet.sessionToken,
          requiredApproval: requiredApproval
        })
      });

      const result = await response.json();
      console.log('📡 Gasless approval response:', result);

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 501) {
          // Not implemented - suggest backend funding
          throw new Error(`🚀 Account Abstraction Issue!\n\n${result.details}\n\n💡 Solution: ${result.workaround}`);
        }
        throw new Error(result.error || 'Gasless approval failed');
      }

      console.log('✅ Gasless approval successful - Backend paid all gas!');
      setApproved(true);
      
      // Wait a moment to show success, then proceed
      setTimeout(() => {
        onApprovalComplete();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Gasless approval failed:', error);
      
      // Show user-friendly error with AA context
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Account Abstraction Failed:\n\n${errorMessage}\n\n🎯 The backend should sponsor ALL gas fees!\nUsers should NEVER need ETH for any transaction.`);
    } finally {
      setLoading(false);
    }
  };

  if (approved) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Approval Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your Smart Wallet has approved the Backend wallet. 
              You can now enjoy gasless payments!
            </p>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-800">
                🚀 All future payments will be gasless!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 pt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={loading}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Backend Approval</h1>
          <p className="text-sm text-gray-600">One-time setup for gasless payments</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">One-Time Setup for Gasless Payments</p>
                <p className="text-xs text-blue-600">
                  To enable seamless gasless payments, your Smart Wallet needs to approve our Backend once. 
                  After this setup, ALL future payments will be completely gasless - no ETH needed!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Shield size={20} className="mr-2 text-indigo-600" />
              Approval Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Token Contract:</span>
                <span className="font-mono text-xs break-all">
                  {requiredApproval.contract.slice(0, 10)}...{requiredApproval.contract.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Backend Wallet:</span>
                <span className="font-mono text-xs break-all">
                  {requiredApproval.spender.slice(0, 10)}...{requiredApproval.spender.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Approval Amount:</span>
                <span className="font-semibold">
                  {(parseInt(requiredApproval.amount) / 1000000).toFixed(0)} USDT
                </span>
              </div>
              <div className="bg-yellow-50 rounded p-2 mt-2">
                <p className="text-xs text-yellow-800">
                  💡 This large approval ($10,000) enables seamless payments for many transactions. 
                  You can revoke it anytime through your wallet settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Zap size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">What You Get After This Setup</p>
                <ul className="text-xs text-green-600 mt-1 space-y-1">
                  <li>• 🚀 One-click payments - no more transaction confirmations</li>
                  <li>• ⚡ Zero gas fees - backend sponsors all transaction costs</li>
                  <li>• 💰 No ETH needed - pay only with USDT</li>
                  <li>• 🎯 Seamless UX - just like traditional payment apps</li>
                  <li>• 🔒 Still secure - you control your wallet and funds</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Security & Control</p>
                <p className="text-xs text-yellow-600">
                  • This approval only allows the Backend to spend USDT for payment processing
                  • Your funds remain secure in your Smart Wallet at all times  
                  • You can revoke this approval anytime through your wallet
                  • Backend can only move USDT, never your other assets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="pt-4">
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Approving Backend Wallet...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Shield size={20} />
                <span>Approve Backend Wallet</span>
              </div>
            )}
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center px-4 pb-4">
          By approving, you enable gasless Account Abstraction payments. 
          You can revoke this approval anytime through your wallet settings.
        </div>
      </div>
    </div>
  );
}; 