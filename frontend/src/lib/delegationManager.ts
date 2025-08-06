import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from '@/lib/web3';

// EIP-712 Domain for PadiPay delegation
const DOMAIN = {
  name: "PadiPay",
  version: "1",
  chainId: 2810, // Morph Holesky Testnet
  verifyingContract: CONTRACT_ADDRESSES.PADI_PAY_CORE // Latest PadiPayCore contract
};

// Payment delegation type structure
const DELEGATION_TYPES = {
  PaymentDelegation: [
    { name: "delegator", type: "address" },
    { name: "delegate", type: "address" },
    { name: "maxAmountPerPayment", type: "uint256" },
    { name: "maxTotalAmount", type: "uint256" },
    { name: "allowedToken", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "validUntil", type: "uint256" }
  ]
};

export interface DelegationPermission {
  delegator: string;        // User's wallet address
  delegate: string;         // Backend wallet address
  maxAmountPerPayment: string; // Max per single payment (USDT units)
  maxTotalAmount: string;   // Max total delegated amount (USDT units)
  allowedToken: string;     // USDT contract address
  nonce: number;           // For security/replay protection
  validUntil: number;      // Expiration timestamp
}

export interface SignedDelegation {
  permission: DelegationPermission;
  signature: string;
  delegationHash: string;
}

export class DelegationManager {
  
  /**
   * Create a delegation permission for seamless payments
   */
  static async createDelegationPermission(
    userWallet: ethers.Wallet,
    backendAddress: string,
    usdtAddress: string,
    options: {
      maxAmountPerPayment?: string; // Default: $1000
      maxTotalAmount?: string;      // Default: $10000
      validityDays?: number;        // Default: 365 days
    } = {}
  ): Promise<SignedDelegation> {
    
    // Set defaults
    const maxAmountPerPayment = options.maxAmountPerPayment || ethers.parseUnits("1000", 6).toString(); // $1000
    const maxTotalAmount = options.maxTotalAmount || ethers.parseUnits("10000", 6).toString(); // $10000
    const validityDays = options.validityDays || 365;
    
    // Create delegation permission
    const permission: DelegationPermission = {
      delegator: userWallet.address,
      delegate: backendAddress,
      maxAmountPerPayment,
      maxTotalAmount,
      allowedToken: usdtAddress,
      nonce: Date.now(), // Simple nonce for now
      validUntil: Math.floor(Date.now() / 1000) + (validityDays * 24 * 60 * 60)
    };
    
    console.log('🔐 Creating payment delegation:', {
      maxPerPayment: ethers.formatUnits(maxAmountPerPayment, 6) + ' USDT',
      maxTotal: ethers.formatUnits(maxTotalAmount, 6) + ' USDT',
      validFor: validityDays + ' days',
      delegate: backendAddress
    });
    
    // Sign the delegation using EIP-712
    const signature = await userWallet.signTypedData(DOMAIN, DELEGATION_TYPES, permission);
    
    // Create delegation hash for identification
    const delegationHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(permission))
    );
    
    const signedDelegation: SignedDelegation = {
      permission,
      signature,
      delegationHash
    };
    
    console.log('✅ Delegation signed successfully!');
    console.log(`📋 Delegation hash: ${delegationHash.slice(0, 10)}...`);
    
    return signedDelegation;
  }
  
  /**
   * Verify a delegation signature
   */
  static async verifyDelegation(delegation: SignedDelegation): Promise<boolean> {
    try {
      // Recover signer from signature
      const recoveredAddress = ethers.verifyTypedData(
        DOMAIN,
        DELEGATION_TYPES,
        delegation.permission,
        delegation.signature
      );
      
      // Check if signer matches delegator
      const isValidSigner = recoveredAddress.toLowerCase() === delegation.permission.delegator.toLowerCase();
      
      // Check if still valid (not expired)
      const currentTime = Math.floor(Date.now() / 1000);
      const isNotExpired = currentTime < delegation.permission.validUntil;
      
      console.log('🔍 Delegation verification:', {
        validSigner: isValidSigner,
        notExpired: isNotExpired,
        expiresIn: delegation.permission.validUntil - currentTime + ' seconds'
      });
      
      return isValidSigner && isNotExpired;
      
    } catch (error) {
      console.error('❌ Delegation verification failed:', error);
      return false;
    }
  }
  
  /**
   * Check if a payment amount is within delegation limits
   */
  static isPaymentAuthorized(
    delegation: SignedDelegation, 
    paymentAmount: string,
    usedAmount: string = "0"
  ): boolean {
    
    const maxPerPayment = BigInt(delegation.permission.maxAmountPerPayment);
    const maxTotal = BigInt(delegation.permission.maxTotalAmount);
    const amount = BigInt(paymentAmount);
    const used = BigInt(usedAmount);
    
    const withinPerPaymentLimit = amount <= maxPerPayment;
    const withinTotalLimit = (used + amount) <= maxTotal;
    
    console.log('💰 Payment authorization check:', {
      paymentAmount: ethers.formatUnits(amount, 6) + ' USDT',
      maxPerPayment: ethers.formatUnits(maxPerPayment, 6) + ' USDT',
      usedSoFar: ethers.formatUnits(used, 6) + ' USDT',
      maxTotal: ethers.formatUnits(maxTotal, 6) + ' USDT',
      withinLimits: withinPerPaymentLimit && withinTotalLimit
    });
    
    return withinPerPaymentLimit && withinTotalLimit;
  }
  
  /**
   * Create a default delegation for new users (generous limits)
   */
  static async createDefaultDelegation(
    userWallet: ethers.Wallet,
    backendAddress: string,
    usdtAddress: string
  ): Promise<SignedDelegation> {
    
    return this.createDelegationPermission(userWallet, backendAddress, usdtAddress, {
      maxAmountPerPayment: ethers.parseUnits("1000", 6).toString(), // $1000 per payment
      maxTotalAmount: ethers.parseUnits("50000", 6).toString(),      // $50000 total
      validityDays: 365 // 1 year
    });
  }
} 