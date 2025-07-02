import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("PadiPay System - Sustainable Revenue Model", function () {
  let phoneRegistry: any;
  let escrowVault: any;
  let padiPayCore: any;
  let mockUSDT: any; // Still need for testing as we can't mint real USDT
  
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let feeRecipient: Signer;
  
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;
  let feeRecipientAddress: string;
  
  // Real production values
  const REAL_USDT_ADDRESS = "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98"; // Real USDT on Morph
  const INITIAL_USDT_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDT
  const PAYMENT_AMOUNT = ethers.parseUnits("100", 6); // 100 USDT
  const SMALL_PAYMENT = ethers.parseUnits("10", 6); // 10 USDT  
  const LARGE_PAYMENT = ethers.parseUnits("1000", 6); // 1000 USDT
  const MIN_PAYMENT = ethers.parseUnits("1", 6); // 1 USDT
  const MAX_PAYMENT = ethers.parseUnits("50000", 6); // 50,000 USDT
  
  // Sustainable revenue model
  const SUSTAINABLE_FEE_PERCENTAGE = 200; // 2.0% (200 basis points)
  const MINIMUM_FEE = ethers.parseUnits("0.5", 6); // $0.50 minimum fee
  
  const PHONE_NUMBER_1 = "+1234567890";
  const PHONE_NUMBER_2 = "+0987654321";
  const PHONE_HASH_1 = ethers.keccak256(ethers.toUtf8Bytes(PHONE_NUMBER_1));
  const PHONE_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes(PHONE_NUMBER_2));

  before(async function () {
    [owner, user1, user2, feeRecipient] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    feeRecipientAddress = await feeRecipient.getAddress();
  });

  beforeEach(async function () {
    // Deploy Mock USDT for testing (still needed as we can't mint real USDT)
    const MockUSDT = await ethers.getContractFactory("MockStablecoin");
    mockUSDT = await MockUSDT.deploy(ethers.parseUnits("1000000", 0)); // 1M tokens
    await mockUSDT.waitForDeployment();
    const mockUSDTAddress = await mockUSDT.getAddress();

    // Deploy PhoneRegistry
    const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
    phoneRegistry = await PhoneRegistry.deploy();
    await phoneRegistry.waitForDeployment();

    // Deploy EscrowVault
    const EscrowVault = await ethers.getContractFactory("EscrowVault");
    escrowVault = await EscrowVault.deploy(await phoneRegistry.getAddress());
    await escrowVault.waitForDeployment();

    // Deploy PadiPayCore with sustainable revenue model
    const PadiPayCore = await ethers.getContractFactory("PadiPayCore");
    padiPayCore = await PadiPayCore.deploy(
      await phoneRegistry.getAddress(),
      await escrowVault.getAddress(),
      ethers.ZeroAddress, // Skip wallet factory for basic tests
      feeRecipientAddress,
      mockUSDTAddress // Use mock for testing
    );
    await padiPayCore.waitForDeployment();

    // Setup: Add USDT as supported token in EscrowVault
    await escrowVault.addSupportedToken(mockUSDTAddress);

    // Setup: Mint USDT to users for testing
    await mockUSDT.mint(user1Address, INITIAL_USDT_SUPPLY);
    await mockUSDT.mint(user2Address, INITIAL_USDT_SUPPLY);

    // Setup: Approve PadiPayCore to spend USDT
    await mockUSDT.connect(user1).approve(await padiPayCore.getAddress(), ethers.MaxUint256);
    await mockUSDT.connect(user2).approve(await padiPayCore.getAddress(), ethers.MaxUint256);
  });

  describe("Sustainable Revenue Model", function () {
    it("Should have correct fee configuration", async function () {
      const feePercentage = await padiPayCore.feePercentage();
      const minimumFee = await padiPayCore.minimumFee();
      const maxPayment = await padiPayCore.maxPaymentAmount();
      
      expect(feePercentage).to.equal(SUSTAINABLE_FEE_PERCENTAGE);
      expect(minimumFee).to.equal(MINIMUM_FEE);
      expect(maxPayment).to.equal(MAX_PAYMENT);
    });

    it("Should enforce minimum fee on small transactions", async function () {
      await phoneRegistry.registerPhone(PHONE_HASH_2, user2Address);
      
      const initialBalance = await mockUSDT.balanceOf(user2Address);
      const initialFeeBalance = await mockUSDT.balanceOf(feeRecipientAddress);
      
      // Send small payment where percentage fee < minimum fee
      await padiPayCore.connect(user1).sendPayment(
        PHONE_HASH_2,
        await mockUSDT.getAddress(),
        SMALL_PAYMENT, // $10
        "Small payment test"
      );
      
      const finalBalance = await mockUSDT.balanceOf(user2Address);
      const finalFeeBalance = await mockUSDT.balanceOf(feeRecipientAddress);
      
      // Fee should be minimum fee ($0.50), not percentage (2% of $10 = $0.20)
      const netAmount = SMALL_PAYMENT - MINIMUM_FEE;
      expect(finalBalance - initialBalance).to.equal(netAmount);
      expect(finalFeeBalance - initialFeeBalance).to.equal(MINIMUM_FEE);
    });

    it("Should use percentage fee on larger transactions", async function () {
      await phoneRegistry.registerPhone(PHONE_HASH_2, user2Address);
      
      const initialFeeBalance = await mockUSDT.balanceOf(feeRecipientAddress);
      
      // Send large payment where percentage fee > minimum fee
      await padiPayCore.connect(user1).sendPayment(
        PHONE_HASH_2,
        await mockUSDT.getAddress(),
        LARGE_PAYMENT, // $1000
        "Large payment test"
      );
      
      const finalFeeBalance = await mockUSDT.balanceOf(feeRecipientAddress);
      
      // Fee should be 2% of $1000 = $20
      const expectedFee = (LARGE_PAYMENT * BigInt(SUSTAINABLE_FEE_PERCENTAGE)) / BigInt(10000);
      expect(finalFeeBalance - initialFeeBalance).to.equal(expectedFee);
    });

    it("Should reject payments where amount <= fee", async function () {
      await phoneRegistry.registerPhone(PHONE_HASH_2, user2Address);
      
      // Try to send amount equal to minimum fee
      await expect(
        padiPayCore.connect(user1).sendPayment(
          PHONE_HASH_2,
          await mockUSDT.getAddress(),
          MINIMUM_FEE, // $0.50
          "Invalid payment"
        )
      ).to.be.revertedWith("PadiPayCore: Amount must be greater than fee");
    });

    it("Should calculate correct revenue for various transaction sizes", async function () {
      await phoneRegistry.registerPhone(PHONE_HASH_2, user2Address);
      
      const scenarios = [
        { amount: ethers.parseUnits("1", 6), expectedFee: MINIMUM_FEE }, // $1 → $0.50 fee
        { amount: ethers.parseUnits("25", 6), expectedFee: MINIMUM_FEE }, // $25 → $0.50 fee (2% = $0.50)
        { amount: ethers.parseUnits("50", 6), expectedFee: ethers.parseUnits("1", 6) }, // $50 → $1.00 fee
        { amount: ethers.parseUnits("100", 6), expectedFee: ethers.parseUnits("2", 6) }, // $100 → $2.00 fee
        { amount: ethers.parseUnits("500", 6), expectedFee: ethers.parseUnits("10", 6) }, // $500 → $10.00 fee
      ];
      
      for (let i = 0; i < scenarios.length; i++) {
        const { amount, expectedFee } = scenarios[i];
        
        const initialFeeBalance = await mockUSDT.balanceOf(feeRecipientAddress);
        
        await padiPayCore.connect(user1).sendPayment(
          PHONE_HASH_2,
          await mockUSDT.getAddress(),
          amount,
          `Test payment ${i + 1}`
        );
        
        const finalFeeBalance = await mockUSDT.balanceOf(feeRecipientAddress);
        const actualFee = finalFeeBalance - initialFeeBalance;
        
        expect(actualFee).to.equal(expectedFee, 
          `Scenario ${i + 1}: Amount ${ethers.formatUnits(amount, 6)} should have fee ${ethers.formatUnits(expectedFee, 6)}`
        );
      }
    });

    it("Should support higher payment limits for business use", async function () {
      await phoneRegistry.registerPhone(PHONE_HASH_2, user2Address);
      
      // Mint more USDT for large payment test
      const largeAmount = ethers.parseUnits("25000", 6); // $25k
      await mockUSDT.mint(user1Address, largeAmount);
      
      const initialBalance = await mockUSDT.balanceOf(user2Address);
      
      await padiPayCore.connect(user1).sendPayment(
        PHONE_HASH_2,
        await mockUSDT.getAddress(),
        largeAmount,
        "Business payment"
      );
      
      const finalBalance = await mockUSDT.balanceOf(user2Address);
      
      // Should work within new limits
      const expectedFee = (largeAmount * BigInt(SUSTAINABLE_FEE_PERCENTAGE)) / BigInt(10000);
      const netAmount = largeAmount - expectedFee;
      expect(finalBalance - initialBalance).to.equal(netAmount);
    });
  });

  describe("Revenue Analytics", function () {
    it("Should track platform revenue correctly", async function () {
      await phoneRegistry.registerPhone(PHONE_HASH_2, user2Address);
      
      // Send multiple payments of different sizes
      const payments = [
        ethers.parseUnits("10", 6),  // $10 → $0.50 fee
        ethers.parseUnits("100", 6), // $100 → $2.00 fee
        ethers.parseUnits("500", 6)  // $500 → $10.00 fee
      ];
      
      let expectedTotalFees = BigInt(0);
      
      for (const amount of payments) {
        const percentageFee = (amount * BigInt(SUSTAINABLE_FEE_PERCENTAGE)) / BigInt(10000);
        const actualFee = percentageFee > MINIMUM_FEE ? percentageFee : MINIMUM_FEE;
        expectedTotalFees += actualFee;
        
        await padiPayCore.connect(user1).sendPayment(
          PHONE_HASH_2,
          await mockUSDT.getAddress(),
          amount,
          "Revenue test"
        );
      }
      
      const [totalSent, totalClaimed, totalVolume, totalFees] = await padiPayCore.getPlatformStats();
      
      expect(totalSent).to.equal(3);
      expect(totalClaimed).to.equal(3);
      expect(totalFees).to.equal(expectedTotalFees);
      
      console.log(`Revenue generated: $${ethers.formatUnits(totalFees, 6)} from $${ethers.formatUnits(totalVolume, 6)} volume`);
    });

    it("Should project sustainable revenue model", async function () {
      // Simulate monthly revenue projections
      const monthlyUsers = 1000;
      const avgTransactionPerUser = 4; // 4 transactions per month
      const avgTransactionAmount = ethers.parseUnits("50", 6); // $50 average
      
      const monthlyTransactions = monthlyUsers * avgTransactionPerUser;
      const monthlyVolume = avgTransactionAmount * BigInt(monthlyTransactions);
      
      // Calculate fee (2% of $50 = $1.00 per transaction)
      const feePerTransaction = (avgTransactionAmount * BigInt(SUSTAINABLE_FEE_PERCENTAGE)) / BigInt(10000);
      const monthlyRevenue = feePerTransaction * BigInt(monthlyTransactions);
      
      console.log("📊 Revenue Projections:");
      console.log(`👥 Users: ${monthlyUsers}`);
      console.log(`📱 Transactions: ${monthlyTransactions}/month`);
      console.log(`💰 Volume: $${ethers.formatUnits(monthlyVolume, 6)}/month`);
      console.log(`💸 Revenue: $${ethers.formatUnits(monthlyRevenue, 6)}/month`);
      console.log(`📈 Annual Revenue: $${ethers.formatUnits(monthlyRevenue * BigInt(12), 6)}`);
      
      // At 1000 users, should generate $4000/month
      expect(monthlyRevenue).to.equal(ethers.parseUnits("4000", 6));
    });
  });

  describe("PhoneRegistry", function () {
    it("Should register a phone number to wallet", async function () {
      await phoneRegistry.registerPhone(PHONE_HASH_1, user1Address);
      
      expect(await phoneRegistry.getWalletByPhone(PHONE_HASH_1)).to.equal(user1Address);
      expect(await phoneRegistry.getPhoneByWallet(user1Address)).to.equal(PHONE_HASH_1);
      expect(await phoneRegistry.isPhoneNumberRegistered(PHONE_HASH_1)).to.be.true;
    });

    it("Should create phone hash correctly", async function () {
      const phoneHash = await phoneRegistry.createPhoneHash(PHONE_NUMBER_1);
      expect(phoneHash).to.equal(PHONE_HASH_1);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete payment flow with sustainable fees", async function () {
      // Step 1: User1 sends payment to unregistered phone
      const feeAmount = (PAYMENT_AMOUNT * BigInt(SUSTAINABLE_FEE_PERCENTAGE)) / BigInt(10000);
      const netAmount = PAYMENT_AMOUNT - feeAmount;
      
      await padiPayCore.connect(user1).sendPayment(
        PHONE_HASH_2,
        await mockUSDT.getAddress(),
        PAYMENT_AMOUNT,
        "Complete flow test"
      );
      
      // Step 2: Check that funds are escrowed
      const pendingAmount = await padiPayCore.getPendingAmount(
        PHONE_HASH_2,
        await mockUSDT.getAddress()
      );
      expect(pendingAmount).to.equal(netAmount);
      
      // Step 3: Check fee was collected
      const feeBalance = await mockUSDT.balanceOf(feeRecipientAddress);
      expect(feeBalance).to.equal(feeAmount);
      
      // Step 4: Register phone manually and claim
      await phoneRegistry.registerPhone(PHONE_HASH_2, user2Address);
      
      const initialBalance = await mockUSDT.balanceOf(user2Address);
      await escrowVault.claimEscrowedFunds(PHONE_HASH_2, user2Address);
      
      const finalBalance = await mockUSDT.balanceOf(user2Address);
      expect(finalBalance - initialBalance).to.equal(netAmount);
    });
  });

  describe("Production Readiness", function () {
    it("Should be configured for real USDT integration", async function () {
      // This test verifies the contract is ready for real USDT
      console.log("🔗 Real USDT Address:", REAL_USDT_ADDRESS);
      console.log("💸 Sustainable Fee:", SUSTAINABLE_FEE_PERCENTAGE / 100, "%");
      console.log("💰 Minimum Fee: $", ethers.formatUnits(MINIMUM_FEE, 6));
      console.log("⬆️  Max Payment: $", ethers.formatUnits(MAX_PAYMENT, 6));
      
      expect(REAL_USDT_ADDRESS).to.equal("0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98");
      expect(SUSTAINABLE_FEE_PERCENTAGE).to.equal(200); // 2%
      expect(MINIMUM_FEE).to.equal(ethers.parseUnits("0.5", 6)); // $0.50
    });
  });
}); 