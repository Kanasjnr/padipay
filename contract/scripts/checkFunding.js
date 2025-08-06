const { ethers } = require("hardhat");

/**
 * Account Abstraction Funding Status Checker
 * Verifies that Paymaster and Backend Wallet have sufficient ETH
 */

// Deployed contract addresses (from sustainable-deployment)
const CONTRACT_ADDRESSES = {
  PAYMASTER_CONTRACT: "0x8c15529390D82FAc0C4444C93672F400e95774e2",
  ENTRY_POINT: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
};

async function main() {
  console.log("🔍 Checking Account Abstraction Funding Status...\n");

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    const [deployer] = await ethers.getSigners();
    
    // Get backend wallet from env
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!backendPrivateKey) {
      console.error("❌ BACKEND_PRIVATE_KEY not found in environment variables");
      return;
    }
    
    const backendWallet = new ethers.Wallet(backendPrivateKey, ethers.provider);
    
    // Check Paymaster balance
    console.log("📊 Checking Paymaster Contract...");
    const paymasterBalance = await ethers.provider.getBalance(CONTRACT_ADDRESSES.PAYMASTER_CONTRACT);
    const paymasterETH = parseFloat(ethers.formatEther(paymasterBalance));
    
    // Check backend wallet balance
    console.log("📊 Checking Backend Wallet...");
    const backendBalance = await ethers.provider.getBalance(backendWallet.address);
    const backendETH = parseFloat(ethers.formatEther(backendBalance));
    
    // Check deployer balance (for reference)
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    const deployerETH = parseFloat(ethers.formatEther(deployerBalance));
    
    console.log(`
🏦 ACCOUNT ABSTRACTION FUNDING STATUS
====================================

🌐 Network: ${network.name} (Chain ID: ${network.chainId})
👤 Deployer: ${deployer.address} (${deployerETH.toFixed(4)} ETH)

💳 PAYMASTER CONTRACT
   Address: ${CONTRACT_ADDRESSES.PAYMASTER_CONTRACT}
   Balance: ${paymasterETH.toFixed(4)} ETH
   Status: ${paymasterETH >= 0.5 ? '✅ FUNDED' : '❌ NEEDS FUNDING'}
   ${paymasterETH >= 2 ? '🚀 EXCELLENT FUNDING!' : paymasterETH >= 0.5 ? '✅ Sufficient for testing' : '⚠️  Low balance - add more ETH'}

🔧 BACKEND WALLET  
   Address: ${backendWallet.address}
   Balance: ${backendETH.toFixed(4)} ETH
   Status: ${backendETH >= 0.1 ? '✅ FUNDED' : '❌ NEEDS FUNDING'}
   ${backendETH >= 1 ? '🚀 EXCELLENT FUNDING!' : backendETH >= 0.1 ? '✅ Sufficient for testing' : '⚠️  Low balance - add more ETH'}

🎯 ENTRY POINT (Reference)
   Address: ${CONTRACT_ADDRESSES.ENTRY_POINT}
   (Standard ERC-4337 EntryPoint - no funding needed)
`);

    // Funding assessment
    const isPaymasterReady = paymasterETH >= 0.5;
    const isBackendReady = backendETH >= 0.1;
    const isFullyFunded = paymasterETH >= 2.0 && backendETH >= 1.0;

    if (isFullyFunded) {
      console.log(`
🎉 ACCOUNT ABSTRACTION FULLY FUNDED!
====================================
✅ Paymaster ready for ${Math.floor(paymasterETH / 0.002)} transactions
✅ Backend wallet ready for operations  
✅ Users can make completely FREE payments!
🚀 All systems GO for gasless transactions!

💡 Transaction capacity: ~${Math.floor(paymasterETH / 0.002)} gasless payments
📊 Estimated duration: ${Math.floor(paymasterETH / 0.2)} days (at 100 tx/day)
`);
    } else if (isPaymasterReady && isBackendReady) {
      console.log(`
✅ BASIC FUNDING COMPLETE!
==========================
✅ Ready for testing Account Abstraction
✅ Users can make FREE payments!
⚠️  Consider adding more ETH for production use

💡 Current capacity: ~${Math.floor(paymasterETH / 0.002)} transactions
`);
    } else {
      console.log(`
🚨 FUNDING INCOMPLETE!
=====================`);
      
      if (!isPaymasterReady) {
        console.log(`❌ Paymaster needs ${(0.5 - paymasterETH).toFixed(4)} more ETH`);
      }
      
      if (!isBackendReady) {
        console.log(`❌ Backend wallet needs ${(0.1 - backendETH).toFixed(4)} more ETH`);
      }
    }

    console.log(`
🔗 Monitor on Morph Explorer:
=============================
Paymaster: https://explorer-holesky.morphl2.io/address/${CONTRACT_ADDRESSES.PAYMASTER_CONTRACT}
Backend: https://explorer-holesky.morphl2.io/address/${backendWallet.address}

🎯 Next Steps:
==============
${isPaymasterReady && isBackendReady ? 
  '1. Test Account Abstraction with your phone number!\n   2. Experience completely gasless payments! 🚀' :
  '1. Fund the remaining contracts as shown above\n   2. Re-run this script to verify funding'
}
`);

  } catch (error) {
    console.error("❌ Failed to check funding status:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 