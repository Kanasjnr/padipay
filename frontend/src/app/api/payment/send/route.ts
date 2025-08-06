import { NextResponse } from 'next/server';

// Legacy payment API - DEPRECATED
// Now using Account Abstraction via /api/payment/aa-send
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Legacy payment API deprecated',
      message: 'Please use Account Abstraction payment API at /api/payment/aa-send',
      migration: 'All new wallets use gasless Account Abstraction'
    },
    { status: 410 } // 410 Gone - Resource no longer available
  );
} 