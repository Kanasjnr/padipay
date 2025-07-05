import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getContracts, provider, hashPhoneNumber } from '@/lib/web3';
import { otpStore } from '@/lib/otpStore';

const sessionStore = new Map<string, { 
  phoneNumber: string; 
  walletAddress: string; 
  timestamp: number 
}>();

// Generate a simple session token
function generateSessionToken(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

// Create a wallet for the user
async function createUserWallet(phoneNumber: string) {
  console.log(`🏗️ Creating wallet for ${phoneNumber}`);
  
  try {
    // Create a random wallet for the user
    const userWallet = ethers.Wallet.createRandom();
    const userPrivateKey = userWallet.privateKey;
    const userWalletAddress = userWallet.address;
    
    console.log(`📱 Generated user wallet: ${userWalletAddress}`);
    
    // Backend wallet for transactions (needs ETH for gas)
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!backendPrivateKey) {
      throw new Error('Backend wallet not configured. Please set BACKEND_PRIVATE_KEY environment variable.');
    }
    
    // Connect backend wallet to provider for transactions
    const backendWallet = new ethers.Wallet(backendPrivateKey, provider);
    console.log(`🔧 Using backend wallet: ${backendWallet.address}`);
    
    // Check backend wallet has ETH for gas
    const backendBalance = await provider.getBalance(backendWallet.address);
    console.log(`⛽ Backend wallet balance: ${ethers.formatEther(backendBalance)} ETH`);
    
    if (backendBalance < ethers.parseEther('0.01')) {
      throw new Error('Backend wallet needs ETH for gas fees. Please fund the backend wallet.');
    }
    
    // Get contracts with the backend wallet as signer
    const contracts = getContracts(backendWallet);
    
    // Hash the phone number
    const phoneHash = hashPhoneNumber(phoneNumber);
    console.log(`📱 Registering user wallet to phone number`);
    console.log(`🔢 Phone hash: ${phoneHash}`);
    
    // Check if phone is already registered
    const existingWallet = await contracts.phoneRegistry.getWalletByPhone(phoneHash);
    if (existingWallet !== ethers.ZeroAddress) {
      console.log(`⚠️ Phone already registered to: ${existingWallet}`);
      console.log(`🔄 Will unregister existing phone and register to new wallet`);
    }
    
    // Check if phone registration is enabled
    const isPhoneRegistered = await contracts.phoneRegistry.isPhoneNumberRegistered(phoneHash);
    console.log(`📞 Phone registration status: ${isPhoneRegistered}`);
    
    // Handle case where phone is already registered
    if (isPhoneRegistered) {
      console.log(`⚠️ Phone ${phoneNumber} is already registered. Skipping blockchain registration.`);
      
      // For development purposes, we'll allow the user to proceed with the existing registration
      // In production, you might want to return the existing wallet or handle differently
      return {
        walletAddress: userWalletAddress,
        privateKey: userPrivateKey,
        seedPhrase: userWallet.mnemonic?.phrase,
        transactionHash: null, // No new transaction needed
        registrationHash: null, // Phone was already registered
        note: 'Phone number was already registered to another wallet'
      };
    }
    
    const registerTx = await contracts.phoneRegistry.registerPhone(
      phoneHash,        // Phone hash
      userWalletAddress, // User's regular wallet address
      {
        gasLimit: 120000, // Increased gas limit for phone registration
        gasPrice: ethers.parseUnits('10', 'gwei'), // Set lower gas price (10 gwei)
      }
    );
    
    console.log(`⏳ Phone registration transaction: ${registerTx.hash}`);
    const receipt = await registerTx.wait();
    console.log(`✅ Phone registered to user wallet in block: ${receipt.blockNumber}`);
    
    // Verify registration
    const registeredWallet = await contracts.phoneRegistry.getWalletByPhone(phoneHash);
    console.log(`🏦 Registered wallet address: ${registeredWallet}`);
    
    return {
      walletAddress: userWalletAddress,
      privateKey: userPrivateKey,
      seedPhrase: userWallet.mnemonic?.phrase,
      transactionHash: registerTx.hash,
      registrationHash: registerTx.hash // Same transaction handles phone registration
    };
    
  } catch (error) {
    console.error('❌ Wallet creation failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();
    
    console.log(`🔐 Verifying OTP for phone: ${phoneNumber}`);
    
    // Validate input
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }
    
    // Check if OTP exists and is valid
    const storedOTP = otpStore.get(phoneNumber);
    if (!storedOTP) {
      return NextResponse.json(
        { error: 'OTP not found or expired' },
        { status: 400 }
      );
    }
    
    // Check if OTP has expired (5 minutes)
    if (Date.now() - storedOTP.timestamp > 5 * 60 * 1000) {
      otpStore.delete(phoneNumber);
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }
    
    // Verify OTP
    if (storedOTP.otp !== otp) {
      // Increment attempts
      storedOTP.attempts += 1;
      
      // Block after 3 failed attempts
      if (storedOTP.attempts >= 3) {
        otpStore.delete(phoneNumber);
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new code' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }
    
    console.log(`✅ OTP verified successfully for ${phoneNumber}`);
    
    // Remove OTP from store
    otpStore.delete(phoneNumber);
    
    // Create wallet and register phone
    const walletData = await createUserWallet(phoneNumber);
    
    // Create session
    const sessionToken = generateSessionToken();
    sessionStore.set(sessionToken, {
      phoneNumber,
      walletAddress: walletData.walletAddress,
      timestamp: Date.now()
    });
    
    // Session expires in 24 hours
    setTimeout(() => {
      sessionStore.delete(sessionToken);
    }, 24 * 60 * 60 * 1000);
    
    console.log(`🎉 Wallet created and phone registered for ${phoneNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Phone verified and wallet created successfully',
      data: {
        walletAddress: walletData.walletAddress,
        privateKey: walletData.privateKey,
        seedPhrase: walletData.seedPhrase,
        phoneNumber: phoneNumber,
        sessionToken: sessionToken,
        transactions: {
          walletCreation: walletData.transactionHash,
          phoneRegistration: walletData.registrationHash
        },
        note: walletData.note // Include any additional notes
      }
    });
    
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('insufficient funds')) {
      return NextResponse.json(
        { error: 'Insufficient funds for wallet creation. Please try again later.' },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('already registered')) {
      return NextResponse.json(
        { error: 'This phone number is already registered.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create wallet. Please try again.' },
      { status: 500 }
    );
  }
}

// Export session store for other routes
export { sessionStore }; 