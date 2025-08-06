import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, getContracts, provider, hashPhoneNumber, parseUSDT } from './web3';

// ERC-4337 UserOperation structure
export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

// Account Abstraction Manager
export class AAManager {
  private backendWallet: ethers.Wallet;
  private contracts: ReturnType<typeof getContracts>;

  constructor(backendPrivateKey: string) {
    this.backendWallet = new ethers.Wallet(backendPrivateKey, provider);
    this.contracts = getContracts(this.backendWallet);
  }

  /**
   * Get the backend wallet (public accessor)
   */
  get wallet(): ethers.Wallet {
    return this.backendWallet;
  }

  /**
   * Create a Smart Wallet for a user (replaces EOA wallet creation)
   */
  async createSmartWallet(
    userAddress: string,
    phoneNumber: string
  ): Promise<{
    smartWalletAddress: string;
    isNewWallet: boolean;
    transactionHash?: string;
  }> {
    try {
      console.log(`🏗️ Creating Smart Wallet for ${phoneNumber}`);
      
      const phoneHash = hashPhoneNumber(phoneNumber);
      
      // Check if wallet already exists using PhoneRegistry
      const existingWallet = await this.contracts.phoneRegistry.phoneToWallet(phoneHash);
      if (existingWallet !== ethers.ZeroAddress) {
        console.log(`📱 Smart Wallet already exists: ${existingWallet}`);
        return {
          smartWalletAddress: existingWallet,
          isNewWallet: false
        };
      }
      
      console.log('🏭 Creating Smart Wallet via PadiPayCore...');
      const salt = ethers.keccak256(ethers.toUtf8Bytes(phoneNumber + Date.now()));
      
      const createTx = await this.contracts.padiPayCore.registerAndClaim(
        phoneNumber,        // Plain text phone number
        userAddress,       // User's EOA address (will own the Smart Wallet)
        true,             // Create Smart Wallet = true
        salt,             // Random salt for deterministic address
        {
          gasLimit: 800000,  // Higher gas limit for Smart Wallet creation
          gasPrice: ethers.parseUnits('10', 'gwei')
        }
      );
      
      const receipt = await createTx.wait();
      console.log(`✅ Smart Wallet created in block: ${receipt.blockNumber}`);
      
      // Get the created wallet address from PhoneRegistry
      const walletAddress = await this.contracts.phoneRegistry.phoneToWallet(phoneHash);
      
      return {
        smartWalletAddress: walletAddress,
        isNewWallet: true,
        transactionHash: createTx.hash
      };
      
    } catch (error) {
      console.error('❌ Smart Wallet creation failed:', error);
      throw error;
    }
  }

  /**
   * Create a UserOperation for sending payments (gasless)
   */
  async createPaymentUserOp(
    smartWalletAddress: string,
    userPrivateKey: string,
    toPhoneNumber: string,
    amount: string,
    message: string = ''
  ): Promise<UserOperation> {
    try {
      console.log(`🔧 Creating UserOperation for payment...`);
      
      const userWallet = new ethers.Wallet(userPrivateKey);
      const amountInUnits = parseUSDT(amount);
      const recipientPhoneHash = hashPhoneNumber(toPhoneNumber);
      
      // Get smart wallet nonce
      const smartWallet = new ethers.Contract(
        smartWalletAddress,
        ['function nonce() view returns (uint256)'],
        provider
      );
      const nonce = await smartWallet.nonce();
      
      // Encode the payment call data
      const padiPayCoreInterface = new ethers.Interface([
        'function sendPayment(bytes32 recipientPhoneHash, address token, uint256 amount, string message)'
      ]);
      
      const paymentCallData = padiPayCoreInterface.encodeFunctionData(
        'sendPayment',
        [recipientPhoneHash, CONTRACT_ADDRESSES.USDT, amountInUnits, message]
      );
      
      // Encode Smart Wallet execute call
      const smartWalletInterface = new ethers.Interface([
        'function execute(address target, uint256 value, bytes calldata data) returns (bytes memory)'
      ]);
      
      const executeCallData = smartWalletInterface.encodeFunctionData(
        'execute',
        [CONTRACT_ADDRESSES.PADI_PAY_CORE, 0, paymentCallData]
      );
      
      // Get gas estimates
      const gasEstimate = await provider.estimateGas({
        to: smartWalletAddress,
        data: executeCallData
      });
      
      // Create UserOperation
      const userOp: UserOperation = {
        sender: smartWalletAddress,
        nonce: ethers.toQuantity(nonce),
        initCode: '0x', // Wallet already exists
        callData: executeCallData,
        callGasLimit: ethers.toQuantity(gasEstimate + BigInt(50000)), // Add buffer
        verificationGasLimit: ethers.toQuantity(150000),
        preVerificationGas: ethers.toQuantity(21000),
        maxFeePerGas: ethers.toQuantity(ethers.parseUnits('20', 'gwei')),
        maxPriorityFeePerGas: ethers.toQuantity(ethers.parseUnits('2', 'gwei')),
        paymasterAndData: CONTRACT_ADDRESSES.PAYMASTER_CONTRACT + '0'.repeat(40), // Paymaster sponsors
        signature: '0x' // Will be filled after signing
      };
      
      // Sign the UserOperation
      const userOpHash = this.getUserOpHash(userOp);
      const signature = await userWallet.signMessage(ethers.getBytes(userOpHash));
      userOp.signature = signature;
      
      console.log('✅ UserOperation created successfully');
      return userOp;
      
    } catch (error) {
      console.error('❌ UserOperation creation failed:', error);
      throw error;
    }
  }
  
  /**
   * Execute a UserOperation via EntryPoint (gasless)
   */
  async executeUserOperation(userOp: UserOperation): Promise<string> {
    try {
      console.log('🚀 Executing UserOperation via EntryPoint...');
      
      // EntryPoint interface
      const entryPointInterface = new ethers.Interface([
        'function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address beneficiary)'
      ]);
      
      // Execute via backend wallet (gas sponsored)
      const entryPoint = new ethers.Contract(
        CONTRACT_ADDRESSES.ENTRY_POINT,
        entryPointInterface,
        this.backendWallet
      );
      
      const tx = await entryPoint.handleOps(
        [userOp],
        this.backendWallet.address, // Beneficiary gets refund
        {
          gasLimit: 1000000,
          gasPrice: ethers.parseUnits('10', 'gwei')
        }
      );
      
      const receipt = await tx.wait();
      console.log(`✅ UserOperation executed in block: ${receipt.blockNumber}`);
      
      return tx.hash;
      
    } catch (error) {
      console.error('❌ UserOperation execution failed:', error);
      throw error;
    }
  }
  
  /**
   * Get UserOperation hash for signing
   */
  private getUserOpHash(userOp: UserOperation): string {
    const userOpType = {
      UserOperation: [
        { name: 'sender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'initCode', type: 'bytes' },
        { name: 'callData', type: 'bytes' },
        { name: 'callGasLimit', type: 'uint256' },
        { name: 'verificationGasLimit', type: 'uint256' },
        { name: 'preVerificationGas', type: 'uint256' },
        { name: 'maxFeePerGas', type: 'uint256' },
        { name: 'maxPriorityFeePerGas', type: 'uint256' },
        { name: 'paymasterAndData', type: 'bytes' },
      ]
    };
    
    // Remove signature for hashing
    const userOpForHash: Omit<UserOperation, 'signature'> = {
      sender: userOp.sender,
      nonce: userOp.nonce,
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: userOp.callGasLimit,
      verificationGasLimit: userOp.verificationGasLimit,
      preVerificationGas: userOp.preVerificationGas,
      maxFeePerGas: userOp.maxFeePerGas,
      maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
      paymasterAndData: userOp.paymasterAndData,
    };
    
    return ethers.TypedDataEncoder.hash(
      { name: 'EntryPoint', version: '0.6.0', chainId: 2810 },
      userOpType,
      userOpForHash
    );
  }
  
  /**
   * Check if user has sufficient USDT for payment
   */
  async checkUSDTBalance(userAddress: string, amount: string): Promise<boolean> {
    try {
      const amountInUnits = parseUSDT(amount);
      const balance = await this.contracts.usdt.balanceOf(userAddress);
      return balance >= amountInUnits;
    } catch (error) {
      console.error('❌ Balance check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
let aaManager: AAManager | null = null;

export const getAAManager = (backendPrivateKey?: string): AAManager => {
  if (!aaManager && backendPrivateKey) {
    aaManager = new AAManager(backendPrivateKey);
  }
  if (!aaManager) {
    throw new Error('AA Manager not initialized. Provide backend private key.');
  }
  return aaManager;
}; 