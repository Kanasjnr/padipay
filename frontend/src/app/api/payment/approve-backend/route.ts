import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Contract addresses
const CONTRACT_ADDRESSES = {
  USDT: '0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98',           // L2USDT (Morph Holesky)
  BACKEND_WALLET: '0x8D3725681E1B54cDfa75B1a8Eed5A2e61e835a55'   // Your Backend Wallet
};

// Backend wallet setup for gas sponsorship
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || '0x9fe53e1d7bbb68315cf0fbeee7b0aa9c6a17be4f8b14d1e3bf03977e4e9e49f6';
const PROVIDER_URL = 'https://rpc-quicknode-holesky.morphl2.io';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userWalletAddress, approvalAmount, sessionToken } = body;

    console.log('🔐 Gasless Backend Approval Request');
    console.log(`👤 User Wallet: ${userWalletAddress}`);
    console.log(`💰 Approval Amount: ${approvalAmount} USDT units`);
    console.log(`🔑 Session: ${sessionToken?.slice(0, 10)}...`);

    if (!userWalletAddress || !approvalAmount) {
      return NextResponse.json(
        { error: 'Missing required parameters: userWalletAddress, approvalAmount' },
        { status: 400 }
      );
    }

    // Setup backend wallet and provider
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);

    console.log(`⛽ Backend wallet: ${backendWallet.address}`);
    console.log(`💰 Backend ETH balance: ${ethers.formatEther(await provider.getBalance(backendWallet.address))} ETH`);

    // USDT contract ABI
    const usdtAbi = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)",
      "function balanceOf(address account) external view returns (uint256)"
    ];

    const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, usdtAbi, backendWallet);

    // Check current allowance
    const currentAllowance = await usdtContract.allowance(userWalletAddress, CONTRACT_ADDRESSES.BACKEND_WALLET);
    console.log(`💰 Current allowance: ${ethers.formatUnits(currentAllowance, 6)} USDT`);

    if (currentAllowance >= BigInt(approvalAmount)) {
      return NextResponse.json({
        success: true,
        message: 'Already approved',
        currentAllowance: ethers.formatUnits(currentAllowance, 6)
      });
    }

    // BETTER SOLUTION: Eliminate approval requirement entirely
    // Fund backend wallet with USDT so it doesn't need user approvals
    
    console.log('💡 BEST PRACTICE: Pre-fund backend to eliminate approval step');
    console.log('🚀 This makes payments truly gasless for users!');
    
    // Check if backend has enough USDT to handle payments
    const usdtBalance = await usdtContract.balanceOf(backendWallet.address);
    console.log(`💰 Backend USDT balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
    
    const minimumBackendBalance = ethers.parseUnits('100', 6); // 100 USDT
    
    if (usdtBalance < minimumBackendBalance) {
      return NextResponse.json({
        error: 'Backend needs USDT funding for true Account Abstraction',
        suggestion: 'Fund backend wallet with USDT to eliminate approval requirement',
        details: `Backend currently has ${ethers.formatUnits(usdtBalance, 6)} USDT but needs at least 100 USDT to handle payments without user approvals.`,
        solution: 'Transfer USDT to backend wallet: ' + CONTRACT_ADDRESSES.BACKEND_WALLET,
        benefit: 'Once funded, users will have TRUE gasless payments with no approvals needed!'
      }, { status: 400 });
    }
    
    // Backend has enough USDT - no approval needed!
    return NextResponse.json({
      success: true,
      message: 'No approval needed - Backend is properly funded!',
      backendBalance: ethers.formatUnits(usdtBalance, 6),
      note: 'True Account Abstraction: Backend handles all USDT transfers and gas fees'
    });

  } catch (error) {
    console.error('❌ Gasless approval error:', error);
    return NextResponse.json(
      { 
        error: 'Gasless approval failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 