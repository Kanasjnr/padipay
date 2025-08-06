const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Funding Backend Wallet for Seamless Payments...");
  
  // Contract addresses
  const USDT_ADDRESS = "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98";
  const BACKEND_WALLET = "0x8D3725681E1B54cDfa75B1a8Eed5A2e61e835a55";
  
  // Get deployer (should have USDT)
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer address:", deployer.address);
  
  // Get USDT contract
  const usdtContract = await ethers.getContractAt("IERC20", USDT_ADDRESS);
  
  // Check deployer USDT balance
  const deployerBalance = await usdtContract.balanceOf(deployer.address);
  console.log(`💰 Deployer USDT balance: ${ethers.formatUnits(deployerBalance, 6)} USDT`);
  
  // Check backend wallet current balance
  const backendBalance = await usdtContract.balanceOf(BACKEND_WALLET);
  console.log(`🏦 Backend wallet USDT balance: ${ethers.formatUnits(backendBalance, 6)} USDT`);
  
  // Amount to transfer (500 USDT for testing)
  const fundAmount = ethers.parseUnits("500", 6); // 500 USDT
  
  if (deployerBalance < fundAmount) {
    console.log("❌ Deployer doesn't have enough USDT to fund backend wallet");
    console.log(`💰 Need: ${ethers.formatUnits(fundAmount, 6)} USDT`);
    console.log(`💰 Have: ${ethers.formatUnits(deployerBalance, 6)} USDT`);
    return;
  }
  
  console.log(`💸 Transferring ${ethers.formatUnits(fundAmount, 6)} USDT to backend wallet...`);
  
  // Transfer USDT to backend wallet
  const transferTx = await usdtContract.transfer(BACKEND_WALLET, fundAmount, {
    gasLimit: 100000,
    gasPrice: ethers.parseUnits('10', 'gwei')
  });
  
  console.log("⏳ Transfer transaction:", transferTx.hash);
  await transferTx.wait();
  
  // Check new balance
  const newBackendBalance = await usdtContract.balanceOf(BACKEND_WALLET);
  console.log(`✅ Backend wallet new balance: ${ethers.formatUnits(newBackendBalance, 6)} USDT`);
  
  console.log("🎉 Backend wallet funded successfully!");
  console.log("✨ Now users can enjoy TRUE seamless payments with no approvals!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error funding backend wallet:", error);
    process.exit(1);
  }); 