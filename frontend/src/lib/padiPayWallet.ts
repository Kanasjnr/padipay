import { ethers } from "ethers";
import {
  getContracts,
  provider,
  hashPhoneNumber,
  formatUSDT,
  parseUSDT,
} from "./web3";

export interface WalletData {
  walletAddress: string; // Smart Wallet address (AA) or EOA address (legacy)
  userAddress?: string; // User's EOA address (only for Smart Wallets)
  privateKey: string;
  seedPhrase?: string;
  phoneNumber: string;
  sessionToken: string;
  isSmartWallet?: boolean; // Flag to identify Smart Wallets
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  // New properties for seamless delegation
  needsDelegation?: boolean;
  details?: string;
  message?: string;
  paymentMethod?: string;
  gasUsed?: string;
  fees?: {
    service: string;
    network: string;
    total: string;
  };
  netAmount?: string;
  delegationUsed?: string;
  delegationRemaining?: string;
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
  type: "sent" | "received";
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
  static async createWallet(
    phoneNumber: string,
    otp: string
  ): Promise<PadiPayWallet> {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create wallet");
      }

      console.log("✅ Wallet created:", result.data);

      return new PadiPayWallet(result.data);
    } catch (error) {
      console.error("❌ Wallet creation failed:", error);
      throw error;
    }
  }

  // Static method to send OTP
  static async sendOTP(
    phoneNumber: string
  ): Promise<{ success: boolean; error?: string; otp?: string }> {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      console.log("📱 OTP sent successfully");
      return {
        success: true,
        otp: result.otp, // Only in development mode
      };
    } catch (error) {
      console.error("❌ OTP sending failed:", error);
      return { success: false, error: "Failed to send OTP" };
    }
  }

  // Get wallet balance
  async getBalance(): Promise<BalanceInfo> {
    try {
      const [usdtBalance, ethBalance] = await Promise.all([
        this.contracts.usdt.balanceOf(this.walletData.walletAddress),
        provider.getBalance(this.walletData.walletAddress),
      ]);

      // Debug: Log the raw balance and check decimals
      console.log("📊 Raw USDT balance from contract:", usdtBalance.toString());

      // Check USDT contract decimals to ensure we're using the right formatting
      const usdtDecimals = await this.contracts.usdt.decimals();
      console.log("📊 USDT contract decimals:", usdtDecimals.toString());

      // Format with correct decimals
      const correctlyFormattedBalance = ethers.formatUnits(
        usdtBalance,
        usdtDecimals
      );
      console.log(
        "📊 Correctly formatted USDT balance:",
        correctlyFormattedBalance
      );
      console.log("📊 formatUSDT result:", formatUSDT(usdtBalance));

      return {
        usdt: correctlyFormattedBalance,
        eth: ethers.formatEther(ethBalance),
      };
    } catch (error) {
      console.error("❌ Failed to get balance:", error);
      throw error;
    }
  }

  // Send payment using Account Abstraction (gasless Smart Wallets)
  async sendPayment(
    toPhoneNumber: string,
    amount: string,
    message: string = ""
  ): Promise<PaymentResult> {
    console.log(`🚀 Sending AA payment: ${amount} USDT to ${toPhoneNumber}`);

    try {
      // Convert amount to USDT units for balance check
      const amountInUnits = parseUSDT(amount);

      // Check if Smart Wallet has enough USDT
      const balance = await this.contracts.usdt.balanceOf(
        this.walletData.walletAddress
      );
      if (balance < amountInUnits) {
        return { success: false, error: "Insufficient USDT balance" };
      }

      // Call Account Abstraction payment API
      console.log("🚀 Using Account Abstraction API...");
      console.log(`🔐 Session token (full): "${this.walletData.sessionToken}"`);
      console.log(
        `📏 Session token length: ${this.walletData.sessionToken?.length}`
      );
      console.log(`📋 Wallet data check:`, {
        walletAddress: this.walletData.walletAddress,
        userAddress: this.walletData.userAddress,
        phoneNumber: this.walletData.phoneNumber,
        isSmartWallet: this.walletData.isSmartWallet,
      });

      const requestPayload = {
        toPhoneNumber,
        amount,
        message,
        sessionToken: this.walletData.sessionToken,
        // Include sender's wallet data for session recreation
        senderWalletAddress: this.walletData.walletAddress,
        senderPhoneNumber: this.walletData.phoneNumber,
        isSmartWallet: this.walletData.isSmartWallet
      };
      
      console.log(`🔍 DEBUG: Sending request payload:`, requestPayload);

      const response = await fetch('/api/payment/aa-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const result = await response.json();
      console.log("📡 AA API Response:", { status: response.status, result });

      if (!response.ok) {
        console.error("❌ AA payment API error:", result);

        // Check if this is a session expired error
        if (
          response.status === 401 &&
          (result.error?.includes("session") ||
            result.code === "SESSION_EXPIRED")
        ) {
          console.log("🔄 Session expired - attempting to recreate...");

          // Try to recreate the session
          const recreateResult = await this.recreateSession();
          if (recreateResult.success) {
            console.log("✅ Session recreated - retrying payment...");

            // Retry the payment with new session token
            const retryResponse = await fetch('/api/payment/aa-send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                toPhoneNumber,
                amount,
                message,
                sessionToken: this.walletData.sessionToken, // Updated token
                // Include sender's wallet data for retry
                senderWalletAddress: this.walletData.walletAddress,
                senderPhoneNumber: this.walletData.phoneNumber,
                isSmartWallet: this.walletData.isSmartWallet
              })
            });

            const retryResult = await retryResponse.json();
            console.log("🔄 Retry response:", {
              status: retryResponse.status,
              retryResult,
            });

            if (retryResponse.ok) {
              console.log("✅ Payment successful after session recreation");
              return {
                success: true,
                transactionHash: retryResult.transactionHash,
              };
            } else {
              console.error(
                "❌ Payment still failed after session recreation:",
                retryResult
              );
              return {
                success: false,
                error: retryResult.error || `Payment failed after retry (${retryResponse.status})`,
                ...(retryResult.requiredApproval && { 
                  requiredApproval: retryResult.requiredApproval,
                  details: retryResult.details,
                  instructions: retryResult.instructions,
                  explanation: retryResult.explanation
                }),
              };
            }
          }
        }

        return {
          success: false,
          error: result.error || `AA payment failed (${response.status})`,
          ...(result.requiredApproval && { 
            requiredApproval: result.requiredApproval,
            details: result.details,
            instructions: result.instructions,
            explanation: result.explanation
          }),
        };
      }

      console.log("✅ AA payment successful:", result);
      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      console.error("❌ Payment failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send payment using seamless delegation (NO APPROVALS!)
   */
  async sendSeamlessPayment(
    toPhoneNumber: string,
    amount: string,
    message: string = ""
  ): Promise<PaymentResult> {
    try {
      console.log('✨ SEAMLESS Payment - No approvals, no gas fees!');
      console.log(`📞 To: ${toPhoneNumber}`);
      console.log(`💰 Amount: ${amount} USDT`);
      console.log(`👤 From: ${this.walletData.walletAddress}`);

      // Get delegation from localStorage if available
      let delegation = null;
      const storedData = localStorage.getItem('padiPayWallet');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          delegation = parsed.delegation || null;
        } catch {
          console.log('No stored delegation found');
        }
      }

      const requestPayload = {
        toPhoneNumber,
        amount,
        message,
        walletAddress: this.walletData.walletAddress,
        delegation: delegation // Include delegation if available
      };
      
      console.log(`🚀 Sending seamless payment request...`);

      const response = await fetch('/api/payment/seamless-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const result = await response.json();
      console.log("📡 Seamless Payment Response:", { status: response.status, result });

      if (!response.ok) {
        console.error("❌ Seamless payment failed:", result);

        // Handle different error cases
        if (result.action === 'SETUP_DELEGATION') {
          return {
            success: false,
            error: result.error,
            needsDelegation: true,
            details: result.details
          };
        }

        if (result.action === 'RENEW_DELEGATION') {
          return {
            success: false,
            error: result.error,
            needsDelegation: true,
            details: result.details
          };
        }

        return {
          success: false,
          error: result.error,
          details: result.details
        };
      }

      console.log("🎉 SEAMLESS PAYMENT SUCCESSFUL!");
      console.log(`📋 Transaction: ${result.transactionHash}`);
      console.log(`💰 Amount: ${result.amount} USDT`);
      console.log(`💰 Service fee: ${result.serviceFee} USDT`);
      console.log(`💰 Net to recipient: ${result.netAmount} USDT`);
      console.log(`🎯 User experience: ${result.userExperience}`);

      return {
        success: true,
        transactionHash: result.transactionHash,
        message: result.message,
        paymentMethod: 'SEAMLESS_DELEGATION',
        gasUsed: result.gasUsed,
        fees: {
          service: result.serviceFee,
          network: '0.00', // Always free!
          total: result.serviceFee
        },
        netAmount: result.netAmount,
        delegationUsed: result.delegationUsed,
        delegationRemaining: result.delegationRemaining
      };

    } catch (error) {
      console.error("❌ Seamless payment error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage,
        paymentMethod: 'SEAMLESS_DELEGATION'
      };
    }
  }

  /**
   * Recreate session when it expires (e.g., due to server restart)
   */
  private async recreateSession(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log("🔄 Recreating session...");

      const response = await fetch("/api/auth/recreate-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: this.walletData.phoneNumber,
          walletAddress: this.walletData.walletAddress,
          userAddress: this.walletData.userAddress,
          isSmartWallet: this.walletData.isSmartWallet,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update the session token
        this.walletData.sessionToken = result.sessionToken;

        // Update localStorage with new session token
        localStorage.setItem("padiPayWallet", JSON.stringify(this.walletData));

        console.log("✅ Session recreated successfully");
        return { success: true };
      } else {
        console.error("❌ Session recreation failed:", result);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("❌ Session recreation error:", error);
      return { success: false, error: "Failed to recreate session" };
    }
  }

  /**
   * Upgrade existing wallet to support seamless delegation
   */
  async upgradeToDelegation(): Promise<{success: boolean, delegation?: object, error?: string}> {
    try {
      console.log('🔄 Upgrading wallet to seamless delegation...');
      
      if (!this.walletData.privateKey) {
        return {
          success: false,
          error: 'No private key available for delegation signing'
        };
      }

      // Import delegation manager dynamically
      const { DelegationManager } = await import('@/lib/delegationManager');
      
      // Create wallet instance for signing
      const { ethers } = await import('ethers');
      const signingWallet = new ethers.Wallet(this.walletData.privateKey);
      
      // Contract addresses
      const BACKEND_WALLET = '0x8D3725681E1B54cDfa75B1a8Eed5A2e61e835a55';
      const USDT_ADDRESS = '0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98';
      
      // Create delegation
      const delegation = await DelegationManager.createDefaultDelegation(
        signingWallet,
        BACKEND_WALLET,
        USDT_ADDRESS
      );
      
      console.log('✅ Delegation created for existing wallet!');
      console.log(`💰 Max per payment: $1000 USDT`);
      console.log(`💰 Max total: $50000 USDT`);
      
      // Update stored wallet data with delegation
      const updatedWalletData = {
        ...this.walletData,
        delegation: delegation,
        delegationInfo: {
          maxAmountPerPayment: ethers.formatUnits(delegation.permission.maxAmountPerPayment, 6) + ' USDT',
          maxTotalAmount: ethers.formatUnits(delegation.permission.maxTotalAmount, 6) + ' USDT',
          validUntil: new Date(delegation.permission.validUntil * 1000).toLocaleDateString(),
          seamlessPayments: true,
          gasRequired: false,
          approvalsRequired: false
        }
      };
      
      // Save to localStorage
      localStorage.setItem('padiPayWallet', JSON.stringify(updatedWalletData));
      
      // Update internal wallet data
      this.walletData = updatedWalletData;
      
      console.log('💾 Wallet upgraded and saved with delegation!');
      
      return {
        success: true,
        delegation: delegation
      };
      
    } catch (error) {
      console.error('❌ Failed to upgrade wallet to delegation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Check if this is a Smart Wallet (Account Abstraction)
  isSmartWallet(): boolean {
    return this.walletData.isSmartWallet || false;
  }

  // Get wallet type description
  getWalletType(): string {
    return this.walletData.isSmartWallet
      ? "Smart Wallet (Account Abstraction)"
      : "Legacy Wallet (EOA)";
  }

  // Check if a phone number is registered
  async isPhoneRegistered(phoneNumber: string): Promise<boolean> {
    try {
      const phoneHash = hashPhoneNumber(phoneNumber);
      return await this.contracts.phoneRegistry.isPhoneNumberRegistered(
        phoneHash
      );
    } catch (error) {
      console.error("❌ Failed to check phone registration:", error);
      return false;
    }
  }

  // Get payment history for this wallet
  async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    try {
      console.log(
        "🔍 Getting payment history for wallet:",
        this.walletData.walletAddress
      );
      console.log("🔍 Phone number:", this.walletData.phoneNumber);

      // Check if phone is registered
      const phoneHash = hashPhoneNumber(this.walletData.phoneNumber);
      console.log("📞 Phone hash:", phoneHash);

      const isRegistered =
        await this.contracts.phoneRegistry.isPhoneNumberRegistered(phoneHash);
      console.log("📝 Phone registered:", isRegistered);

      const registeredWallet =
        await this.contracts.phoneRegistry.getWalletByPhone(phoneHash);
      console.log("🏠 Registered wallet address:", registeredWallet);

      // Check pending amount
      const pendingAmount = await this.contracts.padiPayCore.getPendingAmount(
        phoneHash,
        this.contracts.usdt.target
      );
      console.log("⏳ Pending amount:", formatUSDT(pendingAmount));

      // Get sent payments
      const sentPaymentIds =
        await this.contracts.padiPayCore.getPaymentsBySender(
          this.walletData.walletAddress
        );
      console.log("📤 Sent payment IDs:", sentPaymentIds);

      // Get received payments
      const receivedPaymentIds =
        await this.contracts.padiPayCore.getPaymentsByPhone(phoneHash);
      console.log("📥 Received payment IDs:", receivedPaymentIds);

      // Fetch payment details
      const allPaymentIds = [...sentPaymentIds, ...receivedPaymentIds];
      console.log("📋 Total payment IDs:", allPaymentIds);
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
            type:
              payment.sender.toLowerCase() ===
              this.walletData.walletAddress.toLowerCase()
                ? ("sent" as const)
                : ("received" as const),
          });
        } catch (error) {
          console.error(`Failed to fetch payment ${paymentId}:`, error);
        }
      }

      console.log("📊 Final payment history:", payments);
      // Sort by timestamp (newest first)
      return payments.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    } catch (error) {
      console.error("❌ Failed to get payment history:", error);
      return [];
    }
  }

  // Claim escrowed payments
  async claimEscrowedPayments(): Promise<PaymentResult> {
    try {
      console.log("🎁 Claiming escrowed payments...");

      const phoneHash = hashPhoneNumber(this.walletData.phoneNumber);

      // Check if there are any escrowed payments using PadiPayCore
      const claimableAmount = await this.contracts.padiPayCore.getPendingAmount(
        phoneHash,
        this.contracts.usdt.target
      );

      if (claimableAmount === BigInt(0)) {
        return { success: false, error: "No escrowed payments to claim" };
      }

      // Claim the payments through EscrowVault
      const claimTx = await this.contracts.escrowVault.claimFunds(
        phoneHash,
        this.contracts.usdt.target,
        { gasLimit: 250000 }
      );

      console.log(`⏳ Claim transaction: ${claimTx.hash}`);
      const receipt = await claimTx.wait();
      console.log(
        `✅ Escrowed payments claimed in block: ${receipt.blockNumber}`
      );

      return {
        success: true,
        transactionHash: claimTx.hash,
      };
    } catch (error) {
      console.error("❌ Failed to claim escrowed payments:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
      console.error("❌ Failed to get pending amount:", error);
      return "0";
    }
  }

  // Diagnostic: Check wallet and phone registration status
  async diagnoseWalletStatus(): Promise<void> {
    try {
      console.log("🔍 === WALLET DIAGNOSTICS ===");
      console.log("📱 Current wallet address:", this.walletData.walletAddress);
      console.log("📞 Phone number:", this.walletData.phoneNumber);

      const phoneHash = hashPhoneNumber(this.walletData.phoneNumber);
      console.log("🔢 Phone hash:", phoneHash);

      const isRegistered =
        await this.contracts.phoneRegistry.isPhoneNumberRegistered(phoneHash);
      console.log("✅ Phone registered:", isRegistered);

      if (isRegistered) {
        const registeredWallet =
          await this.contracts.phoneRegistry.getWalletByPhone(phoneHash);
        console.log("🏠 Registered wallet address:", registeredWallet);

        const isCorrectWallet =
          registeredWallet.toLowerCase() ===
          this.walletData.walletAddress.toLowerCase();
        console.log("🎯 Phone registered to current wallet:", isCorrectWallet);

        if (!isCorrectWallet) {
          console.log("⚠️  ISSUE: Phone is registered to a different wallet!");
          console.log(
            "💡 SOLUTION: You may need to re-register your phone or use the correct wallet"
          );
        }
      }

      // Check direct USDT balance
      const usdtBalance = await this.contracts.usdt.balanceOf(
        this.walletData.walletAddress
      );
      console.log("💰 Direct USDT balance:", formatUSDT(usdtBalance));

      // Check pending payments
      const pendingAmount = await this.contracts.padiPayCore.getPendingAmount(
        phoneHash,
        this.contracts.usdt.target
      );
      console.log("⏳ Pending PadiPay amount:", formatUSDT(pendingAmount));

      console.log("🔍 === END DIAGNOSTICS ===");
    } catch (error) {
      console.error("❌ Diagnostic failed:", error);
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
