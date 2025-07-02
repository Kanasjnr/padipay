import { run } from "hardhat";

async function main() {
  console.log("🔍 Starting contract verification on Morph Explorer...\n");

  // Contract addresses from sustainable-deployment-1751466476363.json
  const contracts = {
    PhoneRegistry: "0x3E94f2a608FF9CB07bD51674B83Ef4E76F14C577",
    EscrowVault: "0x8AbB9F97c149d04C3Ea25F3d462754F94f4cf4CC",
    SmartWalletImplementation: "0x8cF243C3B00Eba6C06F63b845bE7b18DB5235867",
    SmartWalletFactory: "0xd420e00d03c691D7E97df94ed090Cd7FBE79ce97",
    PadiPayCore: "0xe4bC03347fCEda2a674D63315B3FddB4379aE53F",
    PaymasterContract: "0x8c15529390D82FAc0C4444C93672F400e95774e2"
  };

  // Constants from deployment
  const DEPLOYER_ADDRESS = "0xF3709C87432488B6aAEb9629cf5cb5BA6Db793F0";
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const USDT_ADDRESS = "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98";

  try {
    // 1. Verify PhoneRegistry (no constructor arguments)
    console.log("1️⃣ Verifying PhoneRegistry...");
    await run("verify:verify", {
      address: contracts.PhoneRegistry,
      constructorArguments: [],
      contract: "contracts/PhoneRegistry.sol:PhoneRegistry"
    });
    console.log("✅ PhoneRegistry verified!\n");

    // 2. Verify EscrowVault (phoneRegistryAddress)
    console.log("2️⃣ Verifying EscrowVault...");
    await run("verify:verify", {
      address: contracts.EscrowVault,
      constructorArguments: [contracts.PhoneRegistry],
      contract: "contracts/EscrowVault.sol:EscrowVault"
    });
    console.log("✅ EscrowVault verified!\n");

    // 3. Verify SmartWallet Implementation (owner, entryPoint)
    console.log("3️⃣ Verifying SmartWallet Implementation...");
    await run("verify:verify", {
      address: contracts.SmartWalletImplementation,
      constructorArguments: [DEPLOYER_ADDRESS, ENTRY_POINT_ADDRESS],
      contract: "contracts/SmartWallet.sol:SmartWallet"
    });
    console.log("✅ SmartWallet Implementation verified!\n");

    // 4. Verify SmartWalletFactory (phoneRegistry, entryPoint, implementation)
    console.log("4️⃣ Verifying SmartWalletFactory...");
    await run("verify:verify", {
      address: contracts.SmartWalletFactory,
      constructorArguments: [
        contracts.PhoneRegistry,
        ENTRY_POINT_ADDRESS,
        contracts.SmartWalletImplementation
      ],
      contract: "contracts/SmartWalletFactory.sol:SmartWalletFactory"
    });
    console.log("✅ SmartWalletFactory verified!\n");

    // 5. Verify PadiPayCore (phoneRegistry, escrowVault, walletFactory, feeRecipient, usdtAddress)
    console.log("5️⃣ Verifying PadiPayCore...");
    await run("verify:verify", {
      address: contracts.PadiPayCore,
      constructorArguments: [
        contracts.PhoneRegistry,
        contracts.EscrowVault,
        contracts.SmartWalletFactory,
        DEPLOYER_ADDRESS, // Fee recipient
        USDT_ADDRESS
      ],
      contract: "contracts/PadiPayCore.sol:PadiPayCore"
    });
    console.log("✅ PadiPayCore verified!\n");

    // 6. Verify PaymasterContract (entryPoint)
    console.log("6️⃣ Verifying PaymasterContract...");
    await run("verify:verify", {
      address: contracts.PaymasterContract,
      constructorArguments: [ENTRY_POINT_ADDRESS],
      contract: "contracts/PaymasterContract.sol:PaymasterContract"
    });
    console.log("✅ PaymasterContract verified!\n");

    console.log("\n🎉 All contracts successfully verified on Morph Explorer!");
    console.log("\n📍 Verified Contract Links (Morph Holesky Explorer):");
    console.log("================================");
    console.log(`📞 PhoneRegistry: https://explorer-holesky.morphl2.io/address/${contracts.PhoneRegistry}`);
    console.log(`🏦 EscrowVault: https://explorer-holesky.morphl2.io/address/${contracts.EscrowVault}`);
    console.log(`🏗️  SmartWallet Implementation: https://explorer-holesky.morphl2.io/address/${contracts.SmartWalletImplementation}`);
    console.log(`🏭 SmartWalletFactory: https://explorer-holesky.morphl2.io/address/${contracts.SmartWalletFactory}`);
    console.log(`⚡ PadiPayCore: https://explorer-holesky.morphl2.io/address/${contracts.PadiPayCore}`);
    console.log(`⛽ PaymasterContract: https://explorer-holesky.morphl2.io/address/${contracts.PaymasterContract}`);

    console.log("\n✅ Users can now:");
    console.log("📖 Read contract source code");
    console.log("🔍 View all contract functions");
    console.log("📊 Interact with contracts directly");
    console.log("✨ Trust in code transparency");

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    
    if (error.message?.includes("already verified")) {
      console.log("\n💡 Some contracts may already be verified. Check the explorer links above.");
    } else if (error.message?.includes("does not have bytecode")) {
      console.log("\n💡 Make sure the contract addresses are correct and the contracts are deployed.");
    } else {
      console.log("\n💡 Try verifying contracts individually with the commands below:");
      console.log("\n🔧 Individual Verification Commands:");
      console.log("================================");
      console.log(`npx hardhat verify --network morphHolesky ${contracts.PhoneRegistry}`);
      console.log(`npx hardhat verify --network morphHolesky ${contracts.EscrowVault} "${contracts.PhoneRegistry}"`);
      console.log(`npx hardhat verify --network morphHolesky ${contracts.SmartWalletImplementation} "${DEPLOYER_ADDRESS}" "${ENTRY_POINT_ADDRESS}"`);
      console.log(`npx hardhat verify --network morphHolesky ${contracts.SmartWalletFactory} "${contracts.PhoneRegistry}" "${ENTRY_POINT_ADDRESS}" "${contracts.SmartWalletImplementation}"`);
      console.log(`npx hardhat verify --network morphHolesky ${contracts.PadiPayCore} "${contracts.PhoneRegistry}" "${contracts.EscrowVault}" "${contracts.SmartWalletFactory}" "${DEPLOYER_ADDRESS}" "${USDT_ADDRESS}"`);
      console.log(`npx hardhat verify --network morphHolesky ${contracts.PaymasterContract} "${ENTRY_POINT_ADDRESS}"`);
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 