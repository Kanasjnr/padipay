import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { DelegationManager, SignedDelegation } from '@/lib/delegationManager';
import { getContracts, hashPhoneNumber, parseUSDT, provider } from '@/lib/web3';

// Import contract addresses from web3.ts to ensure consistency
import { CONTRACT_ADDRESSES as WEB3_ADDRESSES } from '@/lib/web3';

// Contract addresses - Morph Holesky Testnet (using latest deployment)
const CONTRACT_ADDRESSES = {
  USDT: WEB3_ADDRESSES.USDT,                                      // L2USDT (Morph Holesky)
  PHONE_REGISTRY: WEB3_ADDRESSES.PHONE_REGISTRY,                  // Latest PhoneRegistry
  ESCROW_VAULT: WEB3_ADDRESSES.ESCROW_VAULT,                      // Latest EscrowVault
  PADI_PAY_CORE: WEB3_ADDRESSES.PADI_PAY_CORE,                    // Latest PadiPayCore
  BACKEND_WALLET: '0x8D3725681E1B54cDfa75B1a8Eed5A2e61e835a55'   // Your Backend Wallet
};

// Backend wallet setup
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || '0x9fe53e1d7bbb68315cf0fbeee7b0aa9c6a17be4f8b14d1e3bf03977e4e9e49f6';

interface DelegationStore {
  [userAddress: string]: {
    delegation: SignedDelegation;
    usedAmount: string;
    lastUsed: number;
  }
}

// Simple in-memory delegation store (in production, use database)
const delegationStore: DelegationStore = {};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toPhoneNumber, amount, message, walletAddress, delegation } = body;

    console.log('🚀 SEAMLESS Payment Request (Ultimate UX!)');
    console.log(`📞 To: ${toPhoneNumber}`);
    console.log(`💰 Amount: ${amount} USDT`);
    console.log(`👤 From: ${walletAddress}`);

    if (!toPhoneNumber || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: toPhoneNumber, amount, walletAddress' },
        { status: 400 }
      );
    }

    // Setup backend wallet and contracts (use fresh instance to avoid caching issues)
    const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);
    const contracts = getContracts(backendWallet);
    
    console.log(`🔑 Using backend wallet: ${backendWallet.address}`);
    console.log(`✅ Backend wallet matches expected: ${backendWallet.address === '0x8D3725681E1B54cDfa75B1a8Eed5A2e61e835a55'}`);
    
    const recipientPhoneHash = hashPhoneNumber(toPhoneNumber);
    const amountInUnits = parseUSDT(amount);
    
    console.log(`💰 Amount in USDT units: ${amountInUnits.toString()}`);

    // Check user USDT balance (always required)
    const userBalance = await contracts.usdt.balanceOf(walletAddress);
    console.log(`💰 User USDT balance: ${ethers.formatUnits(userBalance, 6)} USDT`);

    if (userBalance < amountInUnits) {
      return NextResponse.json(
        { 
          error: 'Insufficient USDT balance',
          details: `User has ${ethers.formatUnits(userBalance, 6)} USDT but needs ${ethers.formatUnits(amountInUnits, 6)} USDT`,
          userBalance: ethers.formatUnits(userBalance, 6),
          required: ethers.formatUnits(amountInUnits, 6)
        },
        { status: 400 }
      );
    }

    // Check backend funding status
    const backendBalance = await contracts.usdt.balanceOf(backendWallet.address);
    console.log(`🏦 Backend USDT balance: ${ethers.formatUnits(backendBalance, 6)} USDT`);
    
    const minimumBackendBalance = ethers.parseUnits('100', 6); // 100 USDT minimum
    const isBackendFunded = backendBalance >= minimumBackendBalance;

    // Calculate fees (same for both flows)
    const feePercentage = 200; // 2%
    const minimumFee = 50000; // $0.05
    const percentageFee = (amountInUnits * BigInt(feePercentage)) / BigInt(10000);
    const fee = percentageFee > BigInt(minimumFee) ? percentageFee : BigInt(minimumFee);
    const netAmount = amountInUnits - fee;

    console.log(`💰 Total: ${ethers.formatUnits(amountInUnits, 6)} USDT`);
    console.log(`💰 Fee: ${ethers.formatUnits(fee, 6)} USDT`);
    console.log(`💰 Net to recipient: ${ethers.formatUnits(netAmount, 6)} USDT`);

    if (netAmount <= 0) {
      return NextResponse.json(
        { 
          error: 'Payment amount too small',
          details: `Minimum payment amount is ${ethers.formatUnits(fee + BigInt(10000), 6)} USDT`
        },
        { status: 400 }
      );
    }

    // Execute payment based on backend funding status
    let finalTx, paymentMethod, delegationUsed = '0', delegationRemaining = '0';

    if (isBackendFunded) {
      // 🚀 ULTIMATE SEAMLESS MODE: Backend has USDT
      console.log('🚀 ULTIMATE SEAMLESS: Backend has USDT - paying directly!');
      
      // Backend pays for the user (ultimate UX)
      paymentMethod = 'BACKEND_SPONSORED';
      
      // Check if recipient is registered
      const isRecipientRegistered = await contracts.phoneRegistry.isPhoneNumberRegistered(recipientPhoneHash);
      console.log(`📞 Recipient registered: ${isRecipientRegistered}`);

      if (isRecipientRegistered) {
        // Send directly to registered recipient
        const recipientWallet = await contracts.phoneRegistry.getWalletByPhone(recipientPhoneHash);
        console.log('📞 Backend sending directly to registered recipient...');
        
        finalTx = await contracts.usdt.transfer(
          recipientWallet,
          netAmount,
          {
            gasLimit: 80000,
            gasPrice: ethers.parseUnits('10', 'gwei')
          }
        );
      } else {
        // Escrow for unregistered recipient
        console.log('🏦 Backend escrowing for unregistered recipient...');
        
        // Approve escrow vault
        const approveEscrowTx = await contracts.usdt.approve(
          CONTRACT_ADDRESSES.ESCROW_VAULT,
          netAmount,
          {
            gasLimit: 80000,
            gasPrice: ethers.parseUnits('10', 'gwei')
          }
        );
        await approveEscrowTx.wait();
        
        // Escrow funds
        finalTx = await contracts.escrowVault.escrowFunds(
          recipientPhoneHash,
          CONTRACT_ADDRESSES.USDT,
          netAmount,
          message || "",
          {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits('10', 'gwei')
          }
        );
      }

    } else {
      // 📋 DELEGATION MODE: Backend needs delegation authority
      console.log('📋 DELEGATION MODE: Backend needs user authorization...');
      
      let userDelegation: SignedDelegation;
      
      if (delegation) {
        userDelegation = delegation;
        console.log('📋 Using provided delegation');
      } else {
        const storedDelegation = delegationStore[walletAddress.toLowerCase()];
        if (!storedDelegation) {
          return NextResponse.json(
            { 
              error: 'Backend underfunded and no delegation found',
              details: 'Either fund backend wallet or set up payment delegation',
              action: 'SETUP_DELEGATION'
            },
            { status: 400 }
          );
        }
        userDelegation = storedDelegation.delegation;
        console.log('📋 Using stored delegation');
      }

      // Verify delegation
      const isDelegationValid = await DelegationManager.verifyDelegation(userDelegation);
      if (!isDelegationValid) {
        return NextResponse.json(
          { 
            error: 'Invalid or expired delegation',
            details: 'Payment delegation signature is invalid or expired',
            action: 'RENEW_DELEGATION'
          },
          { status: 400 }
        );
      }

      // Check delegation limits
      const currentUsage = delegationStore[walletAddress.toLowerCase()]?.usedAmount || "0";
      const isAuthorized = DelegationManager.isPaymentAuthorized(
        userDelegation, 
        amountInUnits.toString(), 
        currentUsage
      );

      if (!isAuthorized) {
        return NextResponse.json(
          { 
            error: 'Payment exceeds delegation limits',
            details: 'Payment amount exceeds delegated spending limits',
            currentUsage: ethers.formatUnits(currentUsage, 6),
            maxPerPayment: ethers.formatUnits(userDelegation.permission.maxAmountPerPayment, 6),
            maxTotal: ethers.formatUnits(userDelegation.permission.maxTotalAmount, 6)
          },
          { status: 400 }
        );
      }

      // Check if user approved backend wallet to spend USDT
      const currentAllowance = await contracts.usdt.allowance(walletAddress, backendWallet.address);
      console.log(`💰 Current USDT allowance: ${ethers.formatUnits(currentAllowance, 6)} USDT`);
      
      if (currentAllowance < amountInUnits) {
        return NextResponse.json(
          { 
            error: 'USDT allowance required',
            details: 'User must approve backend wallet to spend USDT',
            requiredApproval: {
              contract: CONTRACT_ADDRESSES.USDT,
              spender: backendWallet.address,
              amount: ethers.parseUnits('10000', 6).toString() // Large approval for future
            },
            instructions: 'Approve backend wallet to spend USDT for seamless payments',
            action: 'APPROVE_USDT'
          },
          { status: 400 }
        );
      }

      // Execute delegation-based payment
      console.log('💸 Backend executing delegated USDT transfer...');
      
      const transferTx = await contracts.usdt.transferFrom(
        walletAddress,              // From user (delegation allows this)
        backendWallet.address,      // To backend
        amountInUnits,
        {
          gasLimit: 100000,
          gasPrice: ethers.parseUnits('10', 'gwei')
        }
      );
      await transferTx.wait();
      console.log('✅ USDT transferred using delegation (gasless for user)');

      // Now send to recipient (same logic as above)
      const isRecipientRegistered = await contracts.phoneRegistry.isPhoneNumberRegistered(recipientPhoneHash);
      console.log(`📞 Recipient registered: ${isRecipientRegistered}`);

      if (isRecipientRegistered) {
        const recipientWallet = await contracts.phoneRegistry.getWalletByPhone(recipientPhoneHash);
        console.log('📞 Sending to registered recipient...');
        
        finalTx = await contracts.usdt.transfer(
          recipientWallet,
          netAmount,
          {
            gasLimit: 80000,
            gasPrice: ethers.parseUnits('10', 'gwei')
          }
        );
      } else {
        console.log('🏦 Escrowing for unregistered recipient...');
        
        const approveEscrowTx = await contracts.usdt.approve(
          CONTRACT_ADDRESSES.ESCROW_VAULT,
          netAmount,
          {
            gasLimit: 80000,
            gasPrice: ethers.parseUnits('10', 'gwei')
          }
        );
        await approveEscrowTx.wait();
        
        finalTx = await contracts.escrowVault.escrowFunds(
          recipientPhoneHash,
          CONTRACT_ADDRESSES.USDT,
          netAmount,
          message || "",
          {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits('10', 'gwei')
          }
        );
      }

      // Update delegation usage tracking
      const newUsedAmount = (BigInt(currentUsage) + amountInUnits).toString();
      if (delegationStore[walletAddress.toLowerCase()]) {
        delegationStore[walletAddress.toLowerCase()].usedAmount = newUsedAmount;
        delegationStore[walletAddress.toLowerCase()].lastUsed = Date.now();
      } else {
        delegationStore[walletAddress.toLowerCase()] = {
          delegation: userDelegation,
          usedAmount: newUsedAmount,
          lastUsed: Date.now()
        };
      }

      paymentMethod = 'DELEGATION_BASED';
      delegationUsed = ethers.formatUnits(newUsedAmount, 6);
      delegationRemaining = ethers.formatUnits(BigInt(userDelegation.permission.maxTotalAmount) - BigInt(newUsedAmount), 6);
    }

    const receipt = await finalTx.wait();
    console.log('🎉 SEAMLESS PAYMENT SUCCESSFUL!');
    console.log(`📋 Transaction: ${receipt.hash}`);
    console.log(`⛽ All gas paid by backend!`);

    const isRecipientRegistered = await contracts.phoneRegistry.isPhoneNumberRegistered(recipientPhoneHash);

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
      amount: amount,
      serviceFee: ethers.formatUnits(fee, 6),
      netAmount: ethers.formatUnits(netAmount, 6),
      recipientRegistered: isRecipientRegistered,
      message: isRecipientRegistered 
        ? '✨ Seamless payment sent directly - completely gasless!'
        : '✨ Seamless payment escrowed - completely gasless! Recipient will receive when they register',
      paymentMethod: paymentMethod,
      userExperience: 'SEAMLESS - No approvals, no gas fees, instant payment!',
      delegationUsed: delegationUsed,
      delegationRemaining: delegationRemaining,
      backendFunded: isBackendFunded
    });

  } catch (error) {
    console.error('❌ Seamless payment failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Seamless payment failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 