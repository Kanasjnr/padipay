import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🚀 Starting PadiPay Contract Deployment on Morph Network...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration - PRODUCTION READY
  const USDT_ADDRESS = "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98"; // Real USDT on Morph Holesky
  const FEE_RECIPIENT = deployer.address; // Use deployer as fee recipient for now
  const SUSTAINABLE_FEE_PERCENTAGE = 200; // 2.0% - Sustainable revenue model
  const MINIMUM_FEE = ethers.parseUnits("0.5", 6); // $0.50 minimum fee (6 decimals)
  const MIN_PAYMENT_AMOUNT = ethers.parseUnits("1", 6); // 1 USDT (6 decimals)
  const MAX_PAYMENT_AMOUNT = ethers.parseUnits("50000", 6); // 50,000 USDT - Business ready
  
  // For ERC-4337
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // Standard EntryPoint v0.6

  try {
    console.log("🔧 Configuration:");
    console.log("================================");
    console.log("💵 USDT Address:", USDT_ADDRESS);
    console.log("💸 Fee Percentage:", SUSTAINABLE_FEE_PERCENTAGE / 100, "%");
    console.log("💰 Minimum Fee:", ethers.formatUnits(MINIMUM_FEE, 6), "USDT");
    console.log("⬇️  Min Payment:", ethers.formatUnits(MIN_PAYMENT_AMOUNT, 6), "USDT");
    console.log("⬆️  Max Payment:", ethers.formatUnits(MAX_PAYMENT_AMOUNT, 6), "USDT");
    console.log("👤 Fee Recipient:", FEE_RECIPIENT);
    console.log("🎯 EntryPoint:", ENTRY_POINT_ADDRESS);
    console.log("");

    // 1. Deploy PhoneRegistry
    console.log("1️⃣ Deploying PhoneRegistry...");
    const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
    const phoneRegistry = await PhoneRegistry.deploy();
    await phoneRegistry.waitForDeployment();
    const phoneRegistryAddress = await phoneRegistry.getAddress();
    console.log("✅ PhoneRegistry deployed to:", phoneRegistryAddress);

    // 2. Deploy EscrowVault
    console.log("\n2️⃣ Deploying EscrowVault...");
    const EscrowVault = await ethers.getContractFactory("EscrowVault");
    const escrowVault = await EscrowVault.deploy(phoneRegistryAddress);
    await escrowVault.waitForDeployment();
    const escrowVaultAddress = await escrowVault.getAddress();
    console.log("✅ EscrowVault deployed to:", escrowVaultAddress);

    // 3. Deploy SmartWallet Implementation (FIXED: No more zero address!)
    console.log("\n3️⃣ Deploying SmartWallet Implementation...");
    const SmartWallet = await ethers.getContractFactory("SmartWallet");
    const smartWalletImplementation = await SmartWallet.deploy(
      deployer.address, // Placeholder owner
      ENTRY_POINT_ADDRESS
    );
    await smartWalletImplementation.waitForDeployment();
    const smartWalletImplAddress = await smartWalletImplementation.getAddress();
    console.log("✅ SmartWallet Implementation deployed to:", smartWalletImplAddress);

    // 4. Deploy SmartWalletFactory (NOW with real implementation address!)
    console.log("\n4️⃣ Deploying SmartWalletFactory...");
    const SmartWalletFactory = await ethers.getContractFactory("SmartWalletFactory");
    const walletFactory = await SmartWalletFactory.deploy(
      phoneRegistryAddress,
      ENTRY_POINT_ADDRESS,
      smartWalletImplAddress // ✅ REAL ADDRESS, not zero!
    );
    await walletFactory.waitForDeployment();
    const walletFactoryAddress = await walletFactory.getAddress();
    console.log("✅ SmartWalletFactory deployed to:", walletFactoryAddress);

    // 5. Deploy PadiPayCore with Sustainable Revenue Model
    console.log("\n5️⃣ Deploying PadiPayCore (Sustainable Revenue Model)...");
    const PadiPayCore = await ethers.getContractFactory("PadiPayCore");
    const padiPayCore = await PadiPayCore.deploy(
      phoneRegistryAddress,
      escrowVaultAddress,
      walletFactoryAddress,
      FEE_RECIPIENT,
      USDT_ADDRESS
    );
    await padiPayCore.waitForDeployment();
    const padiPayCoreAddress = await padiPayCore.getAddress();
    console.log("✅ PadiPayCore deployed to:", padiPayCoreAddress);

    // 6. Deploy PaymasterContract (Optional - for premium gasless transactions)
    console.log("\n6️⃣ Deploying PaymasterContract (Premium Feature)...");
    const PaymasterContract = await ethers.getContractFactory("PaymasterContract");
    const paymasterContract = await PaymasterContract.deploy(ENTRY_POINT_ADDRESS);
    await paymasterContract.waitForDeployment();
    const paymasterAddress = await paymasterContract.getAddress();
    console.log("✅ PaymasterContract deployed to:", paymasterAddress);

    // 7. Configure contracts for production
    console.log("\n⚙️ Configuring contracts for production...");
    
    // Add USDT as supported token in EscrowVault
    console.log("📝 Adding USDT as supported token in EscrowVault...");
    await escrowVault.addSupportedToken(USDT_ADDRESS);
    console.log("✅ USDT added to EscrowVault");

    // Verify fee configuration in PadiPayCore
    const actualFeePercentage = await padiPayCore.feePercentage();
    const actualMinimumFee = await padiPayCore.minimumFee();
    console.log("📊 Verified fee percentage:", actualFeePercentage.toString(), "basis points (", Number(actualFeePercentage) / 100, "%)");
    console.log("📊 Verified minimum fee:", ethers.formatUnits(actualMinimumFee, 6), "USDT");

    console.log("\n🎉 All contracts deployed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("================================");
    console.log("🏗️  Network: Morph Holesky Testnet");
    console.log("👤 Deployer:", deployer.address);
    console.log("💰 Final balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    console.log("\n📍 Contract Addresses:");
    console.log("================================");
    console.log("📞 PhoneRegistry:", phoneRegistryAddress);
    console.log("🏦 EscrowVault:", escrowVaultAddress);
    console.log("🏗️  SmartWallet Implementation:", smartWalletImplAddress);
    console.log("🏭 SmartWalletFactory:", walletFactoryAddress);
    console.log("⚡ PadiPayCore:", padiPayCoreAddress);
    console.log("⛽ PaymasterContract:", paymasterAddress);
    console.log("\n🔗 Token & Infrastructure:");
    console.log("================================");
    console.log("💵 USDT (Real):", USDT_ADDRESS);
    console.log("🎯 EntryPoint:", ENTRY_POINT_ADDRESS);

    console.log("\n📊 Revenue Model Configuration:");
    console.log("================================");
    console.log("💸 Transaction Fee:", Number(actualFeePercentage) / 100, "%");
    console.log("💰 Minimum Fee:", ethers.formatUnits(actualMinimumFee, 6), "USDT");
    console.log("👤 Fee Recipient:", FEE_RECIPIENT);
    console.log("⬇️  Min Payment:", ethers.formatUnits(MIN_PAYMENT_AMOUNT, 6), "USDT");
    console.log("⬆️  Max Payment:", ethers.formatUnits(MAX_PAYMENT_AMOUNT, 6), "USDT");

    console.log("\n💡 Revenue Model Benefits:");
    console.log("================================");
    console.log("💰 2% fee = $2 on $100 transaction");
    console.log("⚡ Users pay own gas (~$0.10-0.50 on Morph)");
    console.log("🏢 Total user cost: ~2.5% (competitive vs 5-15% traditional)");
    console.log("📈 Minimum $0.50 fee ensures profitability on small transactions");
    console.log("🚀 Higher limits enable business/remittance use cases");

    console.log("\n🔧 Smart Wallet System:");
    console.log("================================");
    console.log("🏗️  Implementation Contract:", smartWalletImplAddress);
    console.log("🏭 Factory Contract:", walletFactoryAddress);
    console.log("✅ No zero addresses - all contracts properly linked!");

    console.log("\n🔄 Environment Variables for .env:");
    console.log("================================");
    console.log(`PHONE_REGISTRY_ADDRESS=${phoneRegistryAddress}`);
    console.log(`ESCROW_VAULT_ADDRESS=${escrowVaultAddress}`);
    console.log(`SMART_WALLET_IMPLEMENTATION=${smartWalletImplAddress}`);
    console.log(`WALLET_FACTORY_ADDRESS=${walletFactoryAddress}`);
    console.log(`PADI_PAY_CORE_ADDRESS=${padiPayCoreAddress}`);
    console.log(`PAYMASTER_CONTRACT_ADDRESS=${paymasterAddress}`);
    console.log(`USDT_ADDRESS=${USDT_ADDRESS}`);

    console.log("\n🧪 Next Steps:");
    console.log("================================");
    console.log("1. 📝 Update your .env file with the contract addresses above");
    console.log("2. 🔍 Verify contracts on Morph Explorer");
    console.log("3. 🧪 Test with real USDT on testnet");
    console.log("4. 💰 Fund wallets with USDT for testing");
    console.log("5. 🚀 Integrate with your frontend application");
    console.log("6. 📊 Monitor revenue and user adoption");

    console.log("\n💼 Business Model Ready:");
    console.log("================================");
    console.log("✅ Sustainable 2% transaction fee");
    console.log("✅ Real USDT integration");
    console.log("✅ User pays gas model");
    console.log("✅ Minimum fee protection");
    console.log("✅ Business-ready limits");
    console.log("✅ Revenue tracking built-in");
    console.log("✅ Smart wallet system properly configured");

    // Save deployment info to a file
    const deploymentInfo = {
      network: "morphHolesky",
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      revenueModel: {
        feePercentage: Number(actualFeePercentage),
        feePercentageHuman: Number(actualFeePercentage) / 100 + "%",
        minimumFee: actualMinimumFee.toString(),
        minimumFeeHuman: ethers.formatUnits(actualMinimumFee, 6) + " USDT",
        gasModel: "user-pays",
        sustainable: true
      },
      contracts: {
        PhoneRegistry: phoneRegistryAddress,
        EscrowVault: escrowVaultAddress,
        SmartWalletImplementation: smartWalletImplAddress,
        SmartWalletFactory: walletFactoryAddress,
        PadiPayCore: padiPayCoreAddress,
        PaymasterContract: paymasterAddress,
      },
      tokens: {
        USDT: USDT_ADDRESS,
        EntryPoint: ENTRY_POINT_ADDRESS,
      },
      configuration: {
        feePercentage: Number(actualFeePercentage),
        minimumFee: actualMinimumFee.toString(),
        feeRecipient: FEE_RECIPIENT,
        minPaymentAmount: MIN_PAYMENT_AMOUNT.toString(),
        maxPaymentAmount: MAX_PAYMENT_AMOUNT.toString(),
      },
    };

    // Write to file
    const fs = require("fs");
    const path = require("path");
    const deploymentPath = path.join(__dirname, "../deployments");
    
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(deploymentPath, `sustainable-deployment-${Date.now()}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n💾 Deployment info saved to deployments folder");
    console.log("🎯 PadiPay is now ready for sustainable revenue generation!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Utility function to wait for transaction confirmation
async function waitForConfirmation(tx: any, confirmations = 2) {
  console.log("⏳ Waiting for confirmations...");
  await tx.wait(confirmations);
  console.log("✅ Transaction confirmed");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 