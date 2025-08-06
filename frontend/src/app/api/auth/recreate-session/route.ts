import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { sessionStore } from '@/lib/sessionStore';

/**
 * Recreate a lost session using wallet data
 * Used when sessions are cleared due to server restarts
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, walletAddress, userAddress, isSmartWallet } = await request.json();
    
    console.log(`🔄 Recreation session for phone: ${phoneNumber}`);
    console.log(`   Wallet: ${walletAddress}`);
    console.log(`   Smart Wallet: ${isSmartWallet}`);
    
    // Validate input
    if (!phoneNumber || !walletAddress) {
      return NextResponse.json(
        { error: 'Phone number and wallet address are required' },
        { status: 400 }
      );
    }
    
    // Create new session token
    const sessionToken = ethers.keccak256(ethers.toUtf8Bytes(phoneNumber + Date.now()));
    
    // Store session
    const sessionData = {
      phoneNumber,
      walletAddress,
      timestamp: Date.now()
    };
    
    sessionStore.set(sessionToken, sessionData);
    
    console.log(`✅ Session recreated successfully`);
    console.log(`   New token: ${sessionToken.slice(0, 10)}...`);
    console.log(`   Store size: ${sessionStore.size}`);
    
    return NextResponse.json({
      success: true,
      sessionToken,
      walletData: {
        walletAddress,
        userAddress,
        phoneNumber,
        isSmartWallet,
        sessionToken
      }
    });
    
  } catch (error) {
    console.error('❌ Session recreation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to recreate session',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 