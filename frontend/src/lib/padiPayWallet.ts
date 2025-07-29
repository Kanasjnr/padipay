import { ethers } from 'ethers';
import { getContracts, provider, hashPhoneNumber, formatUSDT, parseUSDT } from './web3';

export interface WalletData {
  walletAddress: string;
  privateKey: string;
  seedPhrase?: string;
  phoneNumber: string;
  sessionToken: string;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface BalanceInfo {
  usdt: string;
  eth: string;
}

export interface PaymentHistoryItem {
  id: string;
  sender: string;
  recipientPhoneHash: string;
  amount: string;
  timestamp: Date;
  message: string;
  claimed: boolean;
  isEscrowed: boolean;
  type: 'sent' | 'received';
}

export class PadiPayWallet {
  private wallet: ethers.Wallet;
  private contracts: ReturnType<typeof getContracts>;
  private walletData: WalletData;

  constructor(walletData: WalletData) {
    this.walletData = walletData;
    this.wallet = new ethers.Wallet(walletData.privateKey, provider);
    this.contracts = getContracts(this.wallet);
  }

  // Static method to create wallet via backend API
  static async createWallet(phoneNumber: string, otp: string): Promise<PadiPayWallet> {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create wallet');
      }

      console.log('✅ Wallet created:', result.data);

      return new PadiPayWallet(result.data);
    } catch (error) {
      console.error('❌ Wallet creation failed:', error);
      throw error;
    }
  }

  // Static method to send OTP
  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string; otp?: string }> {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      console.log('📱 OTP sent successfully');
      return { 
        success: true, 
        otp: result.otp // Only in development mode
      };
    } catch (error) {
      console.error('❌ OTP sending failed:', error);
      return { success: false, error: 'Failed to send OTP' };
    }
  }

  // Get wallet balance
  async getBalance(): Promise<BalanceInfo> {
    try {
      const [usdtBalance, ethBalance] = await Promise.all([
        this.contracts.usdt.balanceOf(this.walletData.walletAddress),
        provider.getBalance(this.walletData.walletAddress)
      ]);

      // Debug: Log the raw balance and check decimals
      console.log('📊 Raw USDT balance from contract:', usdtBalance.toString());
      
      // Check USDT contract decimals to ensure we're using the right formatting
      const usdtDecimals = await this.contracts.usdt.decimals();
      console.log('📊 USDT contract decimals:', usdtDecimals.toString());
      
      // Format with correct decimals
      const correctlyFormattedBalance = ethers.formatUnits(usdtBalance, usdtDecimals);
      console.log('📊 Correctly formatted USDT balance:', correctlyFormattedBalance);
      console.log('📊 formatUSDT result:', formatUSDT(usdtBalance));

      return {
        usdt: correctlyFormattedBalance,
        eth: ethers.formatEther(ethBalance)
      };
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  // Send payment to a phone number
  async sendPayment(
    toPhoneNumber: string, 
    amount: string, 
    message: string = ""
  ): Promise<PaymentResult> {
    try {
      console.log(`💸 Sending ${amount} USDT to ${toPhoneNumber}`);

      // Convert amount to USDT units
      const amountInUnits = parseUSDT(amount);
      
      // Hash the recipient phone number
      const recipientPhoneHash = hashPhoneNumber(toPhoneNumber);

      // Check if we have enough USDT
      const balance = await this.contracts.usdt.balanceOf(this.walletData.walletAddress);
      if (balance < amountInUnits) {
        return { success: false, error: 'Insufficient USDT balance' };
      }

      // Approve USDT spending by PadiPayCore
      console.log('📝 Approving USDT spending...');
      const approveTx = await this.contracts.usdt.approve(
        this.contracts.padiPayCore.target,
        amountInUnits,
        { gasLimit: 100000 }
      );
      await approveTx.wait();
      console.log('✅ USDT spending approved');

      // Send payment via PadiPayCore - FIX: Add token address parameter
      console.log('💰 Sending payment...');
      const paymentTx = await this.contracts.padiPayCore.sendPayment(
        recipientPhoneHash,
        this.contracts.usdt.target, // Add token address parameter
        amountInUnits,
        message,
        { gasLimit: 300000 }
      );

      console.log(`⏳ Payment transaction: ${paymentTx.hash}`);
      const receipt = await paymentTx.wait();
      console.log(`✅ Payment sent successfully in block: ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: paymentTx.hash
      };

    } catch (error) {
      console.error('❌ Payment failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  // Check if a phone number is registered
  async isPhoneRegistered(phoneNumber: string): Promise<boolean> {
    try {
      const phoneHash = hashPhoneNumber(phoneNumber);
      return await this.contracts.phoneRegistry.isPhoneNumberRegistered(phoneHash);
    } catch (error) {
      console.error('❌ Failed to check phone registration:', error);
      return false;
    }
  }

  // Get payment history for this wallet
  async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    try {
      console.log('🔍 Getting payment history for wallet:', this.walletData.walletAddress);
      console.log('🔍 Phone number:', this.walletData.phoneNumber);
      
      // Check if phone is registered
      const phoneHash = hashPhoneNumber(this.walletData.phoneNumber);
      console.log('📞 Phone hash:', phoneHash);
      
      const isRegistered = await this.contracts.phoneRegistry.isPhoneNumberRegistered(phoneHash);
      console.log('📝 Phone registered:', isRegistered);
      
      const registeredWallet = await this.contracts.phoneRegistry.getWalletByPhone(phoneHash);
      console.log('🏠 Registered wallet address:', registeredWallet);
      
      // Check pending amount
      const pendingAmount = await this.contracts.padiPayCore.getPendingAmount(
        phoneHash,
        this.contracts.usdt.target
      );
      console.log('⏳ Pending amount:', formatUSDT(pendingAmount));
      
      // Get sent payments
      const sentPaymentIds = await this.contracts.padiPayCore.getPaymentsBySender(
        this.walletData.walletAddress
      );
      console.log('📤 Sent payment IDs:', sentPaymentIds);

      // Get received payments
      const receivedPaymentIds = await this.contracts.padiPayCore.getPaymentsByPhone(phoneHash);
      console.log('📥 Received payment IDs:', receivedPaymentIds);

      // Fetch payment details
      const allPaymentIds = [...sentPaymentIds, ...receivedPaymentIds];
      console.log('📋 Total payment IDs:', allPaymentIds);
      const payments = [];

      for (const paymentId of allPaymentIds) {
        try {
          console.log(`🔍 Fetching payment details for ID: ${paymentId}`);
          const payment = await this.contracts.padiPayCore.payments(paymentId);
          console.log(`📝 Payment ${paymentId} details:`, payment);
          
          payments.push({
            id: paymentId.toString(),
            sender: payment.sender,
            recipientPhoneHash: payment.recipientPhoneHash,
            amount: formatUSDT(payment.amount),
            timestamp: new Date(Number(payment.timestamp) * 1000),
            message: payment.message,
            claimed: payment.claimed,
            isEscrowed: payment.isEscrowed,
            type: payment.sender.toLowerCase() === this.walletData.walletAddress.toLowerCase() ? 'sent' as const : 'received' as const
          });
        } catch (error) {
          console.error(`Failed to fetch payment ${paymentId}:`, error);
        }
      }

      console.log('📊 Final payment history:', payments);
      // Sort by timestamp (newest first)
      return payments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      console.error('❌ Failed to get payment history:', error);
      return [];
    }
  }

  // Claim escrowed payments
  async claimEscrowedPayments(): Promise<PaymentResult> {
    try {
      console.log('🎁 Claiming escrowed payments...');
      
      const phoneHash = hashPhoneNumber(this.walletData.phoneNumber);
      
      // Check if there are any escrowed payments using PadiPayCore
      const claimableAmount = await this.contracts.padiPayCore.getPendingAmount(
        phoneHash,
        this.contracts.usdt.target
      );

      if (claimableAmount === BigInt(0)) {
        return { success: false, error: 'No escrowed payments to claim' };
      }

      // Claim the payments through EscrowVault
      const claimTx = await this.contracts.escrowVault.claimFunds(
        phoneHash,
        this.contracts.usdt.target,
        { gasLimit: 250000 }
      );

      console.log(`⏳ Claim transaction: ${claimTx.hash}`);
      const receipt = await claimTx.wait();
      console.log(`✅ Escrowed payments claimed in block: ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: claimTx.hash
      };

    } catch (error) {
      console.error('❌ Failed to claim escrowed payments:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  // Get pending (escrowed) amount
  async getPendingAmount(): Promise<string> {
    try {
      const phoneHash = hashPhoneNumber(this.walletData.phoneNumber);
      // Fix: Use getPendingAmount from PadiPayCore instead of getClaimableAmount from EscrowVault
      const pendingAmount = await this.contracts.padiPayCore.getPendingAmount(
        phoneHash,
        this.contracts.usdt.target
      );
      return formatUSDT(pendingAmount);
    } catch (error) {
      console.error('❌ Failed to get pending amount:', error);
      return '0';
    }
  }

  // Diagnostic: Check wallet and phone registration status
  async diagnoseWalletStatus(): Promise<void> {
    try {
      console.log('🔍 === WALLET DIAGNOSTICS ===');
      console.log('📱 Current wallet address:', this.walletData.walletAddress);
      console.log('📞 Phone number:', this.walletData.phoneNumber);
      
      const phoneHash = hashPhoneNumber(this.walletData.phoneNumber);
      console.log('🔢 Phone hash:', phoneHash);
      
      const isRegistered = await this.contracts.phoneRegistry.isPhoneNumberRegistered(phoneHash);
      console.log('✅ Phone registered:', isRegistered);
      
      if (isRegistered) {
        const registeredWallet = await this.contracts.phoneRegistry.getWalletByPhone(phoneHash);
        console.log('🏠 Registered wallet address:', registeredWallet);
        
        const isCorrectWallet = registeredWallet.toLowerCase() === this.walletData.walletAddress.toLowerCase();
        console.log('🎯 Phone registered to current wallet:', isCorrectWallet);
        
        if (!isCorrectWallet) {
          console.log('⚠️  ISSUE: Phone is registered to a different wallet!');
          console.log('💡 SOLUTION: You may need to re-register your phone or use the correct wallet');
        }
      }
      
      // Check direct USDT balance
      const usdtBalance = await this.contracts.usdt.balanceOf(this.walletData.walletAddress);
      console.log('💰 Direct USDT balance:', formatUSDT(usdtBalance));
      
      // Check pending payments
      const pendingAmount = await this.contracts.padiPayCore.getPendingAmount(
        phoneHash,
        this.contracts.usdt.target
      );
      console.log('⏳ Pending PadiPay amount:', formatUSDT(pendingAmount));
      
      console.log('🔍 === END DIAGNOSTICS ===');
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
    }
  }

  // Export wallet data for storage
  getWalletData(): WalletData {
    return this.walletData;
  }

  // Get wallet address
  getWalletAddress(): string {
    return this.walletData.walletAddress;
  }

  // Get phone number
  getPhoneNumber(): string {
    return this.walletData.phoneNumber;
  }
} 