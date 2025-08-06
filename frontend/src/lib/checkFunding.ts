import { ethers } from "ethers";
import { provider, CONTRACT_ADDRESSES } from "./web3";

export interface FundingStatus {
  paymasterBalance: string;
  backendWalletBalance: string;
  paymasterAddress: string;
  backendWalletAddress: string;
  isPaymasterFunded: boolean;
  isBackendFunded: boolean;
  recommendedActions: string[];
}

/**
 * Check the funding status of Account Abstraction infrastructure
 */
export async function checkAAFunding(
  backendPrivateKey: string
): Promise<FundingStatus> {
  try {
    console.log("🔍 Checking Account Abstraction funding status...");

    // Get backend wallet
    const backendWallet = new ethers.Wallet(backendPrivateKey, provider);

    // Check Paymaster balance
    const paymasterBalance = await provider.getBalance(
      CONTRACT_ADDRESSES.PAYMASTER_CONTRACT
    );
    const paymasterBalanceETH = ethers.formatEther(paymasterBalance);

    // Check backend wallet balance
    const backendBalance = await provider.getBalance(backendWallet.address);
    const backendBalanceETH = ethers.formatEther(backendBalance);

    // Determine funding status
    const isPaymasterFunded = parseFloat(paymasterBalanceETH) >= 0.5; // At least 0.5 ETH
    const isBackendFunded = parseFloat(backendBalanceETH) >= 0.1; // At least 0.1 ETH

    // Generate recommendations
    const recommendedActions: string[] = [];

    if (!isPaymasterFunded) {
      recommendedActions.push(
        `🚨 Fund Paymaster: Send ${
          2 - parseFloat(paymasterBalanceETH)
        } ETH to ${CONTRACT_ADDRESSES.PAYMASTER_CONTRACT}`
      );
    }

    if (!isBackendFunded) {
      recommendedActions.push(
        `🚨 Fund Backend Wallet: Send ${
          1 - parseFloat(backendBalanceETH)
        } ETH to ${backendWallet.address}`
      );
    }

    if (isPaymasterFunded && isBackendFunded) {
      recommendedActions.push(
        "✅ All systems funded and ready for gasless transactions!"
      );
    }

    return {
      paymasterBalance: paymasterBalanceETH,
      backendWalletBalance: backendBalanceETH,
      paymasterAddress: CONTRACT_ADDRESSES.PAYMASTER_CONTRACT,
      backendWalletAddress: backendWallet.address,
      isPaymasterFunded,
      isBackendFunded,
      recommendedActions,
    };
  } catch (error) {
    console.error("❌ Failed to check funding status:", error);
    throw error;
  }
}

/**
 * Format funding report for console output
 */
export function formatFundingReport(status: FundingStatus): string {
  return `
🏦 ACCOUNT ABSTRACTION FUNDING STATUS
====================================

💳 Paymaster Contract: ${status.paymasterAddress}
   Balance: ${status.paymasterBalance} ETH
   Status: ${status.isPaymasterFunded ? "✅ Funded" : "❌ Needs Funding"}

🔧 Backend Wallet: ${status.backendWalletAddress}  
   Balance: ${status.backendWalletBalance} ETH
   Status: ${status.isBackendFunded ? "✅ Funded" : "❌ Needs Funding"}

📋 RECOMMENDED ACTIONS:
${status.recommendedActions.map((action) => `   ${action}`).join("\n")}

💡 TIP: Users will get completely FREE transactions once funded!
`;
}
