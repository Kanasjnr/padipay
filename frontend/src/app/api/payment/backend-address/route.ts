import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET() {
  try {
    // Get backend wallet address
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!backendPrivateKey) {
      return NextResponse.json(
        { error: 'Backend wallet not configured' },
        { status: 500 }
      );
    }
    
    const backendWallet = new ethers.Wallet(backendPrivateKey);
    
    return NextResponse.json({
      backendAddress: backendWallet.address
    });
    
  } catch (error) {
    console.error('❌ Backend address API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get backend address' },
      { status: 500 }
    );
  }
} 