import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { DelegationManager } from '@/lib/delegationManager';
import { SessionManager } from '@/lib/sessionManager';

// Contract addresses - Morph Holesky Testnet
const CONTRACT_ADDRESSES = {
  USDT: '0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98',           // L2USDT (Morph Holesky)
  BACKEND_WALLET: '0x8D3725681E1B54cDfa75B1a8Eed5A2e61e835a55'   // Your Backend Wallet
};

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();
    
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }
    
    // Simple OTP validation (in production, use proper verification)
    const validOtps = ['123456', '000000', '111111'];
    if (!validOtps.includes(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }
    
    console.log(`✅ OTP verified for ${phoneNumber}`);
    console.log('🚀 Creating wallet with SEAMLESS payment delegation...');

    // Generate new wallet
    const randomWallet = ethers.Wallet.createRandom();
    const wallet = new ethers.Wallet(randomWallet.privateKey); // Convert to Wallet type
    console.log(`🔑 Generated wallet: ${wallet.address}`);

    // For simplicity, skip complex initialization for now
    // In production, register phone number to smart contract here
    console.log('✅ Wallet created successfully');

    // 🚀 CREATE SEAMLESS PAYMENT DELEGATION
    console.log('🎯 Setting up seamless payment delegation...');
    
    try {
      const delegation = await DelegationManager.createDefaultDelegation(
        wallet,
        CONTRACT_ADDRESSES.BACKEND_WALLET,
        CONTRACT_ADDRESSES.USDT
      );

      console.log('✅ Seamless payment delegation created!');
      console.log(`💰 Max per payment: $1000 USDT`);
      console.log(`💰 Max total: $50000 USDT`);
      console.log(`⏰ Valid for: 365 days`);
      console.log(`🔐 Delegation hash: ${delegation.delegationHash.slice(0, 10)}...`);

      // Create session with delegation included
    const sessionData = {
      phoneNumber,
        walletAddress: wallet.address,
        userAddress: wallet.address,
        isSmartWallet: false,
      timestamp: Date.now()
    };
    
      const sessionToken = SessionManager.createSession(sessionData);

      // Store delegation for seamless payments
      console.log('💾 Delegation will be stored in frontend localStorage for seamless payments');
    
    return NextResponse.json({
      success: true,
        message: 'Wallet created with seamless payment delegation!',
      data: {
          walletAddress: wallet.address,
          userAddress: wallet.address,
        phoneNumber: phoneNumber,
          privateKey: wallet.privateKey, // ⚠️ In production, handle securely
        sessionToken: sessionToken,
          isSmartWallet: false,
          // Include delegation for seamless payments
          delegation: delegation,
          // User-friendly delegation info
          delegationInfo: {
            maxAmountPerPayment: ethers.formatUnits(delegation.permission.maxAmountPerPayment, 6) + ' USDT',
            maxTotalAmount: ethers.formatUnits(delegation.permission.maxTotalAmount, 6) + ' USDT',
            validUntil: new Date(delegation.permission.validUntil * 1000).toLocaleDateString(),
            seamlessPayments: true,
            gasRequired: false,
            approvalsRequired: false
          }
        },
        userExperience: {
          paymentsType: 'SEAMLESS',
          description: 'All payments are now instant - no approvals, no gas fees!',
          benefits: [
            '🚀 One-click payments',
            '⚡ Zero gas fees', 
            '💰 No ETH needed',
            '🎯 Venmo-like experience'
          ]
        }
      });

    } catch (delegationError) {
      console.error('⚠️ Delegation creation failed, falling back to standard wallet:', delegationError);
      
      // Fallback: Create wallet without delegation (will need approvals)
      const sessionData = {
        phoneNumber,
        walletAddress: wallet.address,
        userAddress: wallet.address,
        isSmartWallet: false,
        timestamp: Date.now()
      };

      const sessionToken = SessionManager.createSession(sessionData);

      return NextResponse.json({
        success: true,
        message: 'Wallet created (standard mode)',
        data: {
          walletAddress: wallet.address,
          userAddress: wallet.address,
          phoneNumber: phoneNumber,
          privateKey: wallet.privateKey,
          sessionToken: sessionToken,
          isSmartWallet: false,
          delegation: null
        },
        userExperience: {
          paymentsType: 'STANDARD',
          description: 'Wallet created, payments will require approvals',
          note: 'Can upgrade to seamless payments later'
        }
      });
    }

  } catch (error) {
    console.error('❌ Wallet creation error:', error);
    return NextResponse.json(
      { 
        error: 'Wallet creation failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}