import { ethers } from 'ethers';
import { createConfig, http } from 'wagmi';

// Morph Holesky Testnet Configuration
export const morphHoleskyChain = {
  id: 2810,
  name: 'Morph Holesky',
  network: 'morph-holesky',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc-quicknode-holesky.morphl2.io'] },
    public: { http: ['https://rpc-quicknode-holesky.morphl2.io'] },
  },
  blockExplorers: {
    default: { name: 'Morph Explorer', url: 'https://explorer-holesky.morphl2.io' },
  },
  testnet: true,
};

// Contract Addresses (from sustainable deployment)
export const CONTRACT_ADDRESSES = {
  PHONE_REGISTRY: '0x3E94f2a608FF9CB07bD51674B83Ef4E76F14C577',
  ESCROW_VAULT: '0x8AbB9F97c149d04C3Ea25F3d462754F94f4cf4CC',
  SMART_WALLET_IMPLEMENTATION: '0x8cF243C3B00Eba6C06F63b845bE7b18DB5235867',
  SMART_WALLET_FACTORY: '0xd420e00d03c691D7E97df94ed090Cd7FBE79ce97',
  PADI_PAY_CORE: '0xe4bC03347fCEda2a674D63315B3FddB4379aE53F',
  PAYMASTER_CONTRACT: '0x8c15529390D82FAc0C4444C93672F400e95774e2',
  USDT: '0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98',
  ENTRY_POINT: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
} as const;

// Wagmi Config
export const wagmiConfig = createConfig({
  chains: [morphHoleskyChain],
  transports: {
    [morphHoleskyChain.id]: http(),
  },
});

// Create a custom provider that completely disables ENS resolution
class NoENSProvider extends ethers.JsonRpcProvider {
  async resolveName(name: string): Promise<string | null> {
    // If it's already an address, return it as is
    if (ethers.isAddress(name)) {
      return name;
    }
    // Otherwise, don't resolve ENS names
    return null;
  }
}

// Ethers Provider with ENS disabled
export const provider = new NoENSProvider(
  'https://rpc-quicknode-holesky.morphl2.io',
  {
    chainId: 2810,
    name: 'morph-holesky',
  }
);

// Contract ABIs (imported from your generated ABIs)
import PhoneRegistryABI from '../../ABI/PhoneRegistry.json';
import PadiPayCoreABI from '../../ABI/PadiPayCore.json';
import SmartWalletFactoryABI from '../../ABI/SmartWalletFactory.json';
import EscrowVaultABI from '../../ABI/EscrowVault.json';
import PaymasterABI from '../../ABI/PaymentMaster.json';

// USDT ABI (standard ERC20)
export const USDT_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Contract instances
export const getContracts = (signerOrProvider?: ethers.Signer | ethers.Provider) => {
  const ethersProvider = signerOrProvider || provider;
  
  return {
    phoneRegistry: new ethers.Contract(
      CONTRACT_ADDRESSES.PHONE_REGISTRY,
      PhoneRegistryABI,
      ethersProvider
    ),
    padiPayCore: new ethers.Contract(
      CONTRACT_ADDRESSES.PADI_PAY_CORE,
      PadiPayCoreABI,
      ethersProvider
    ),
    smartWalletFactory: new ethers.Contract(
      CONTRACT_ADDRESSES.SMART_WALLET_FACTORY,
      SmartWalletFactoryABI,
      ethersProvider
    ),
    escrowVault: new ethers.Contract(
      CONTRACT_ADDRESSES.ESCROW_VAULT,
      EscrowVaultABI,
      ethersProvider
    ),
    paymaster: new ethers.Contract(
      CONTRACT_ADDRESSES.PAYMASTER_CONTRACT,
      PaymasterABI,
      ethersProvider
    ),
    usdt: new ethers.Contract(
      CONTRACT_ADDRESSES.USDT,
      USDT_ABI,
      ethersProvider
    )
  };
};

// Utility functions
export const hashPhoneNumber = (phoneNumber: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(phoneNumber));
};

export const formatUSDT = (amount: bigint): string => {
  return ethers.formatUnits(amount, 6);
};

export const parseUSDT = (amount: string): bigint => {
  return ethers.parseUnits(amount, 6);
};

// Check if address is a valid Ethereum address
export const isValidAddress = (address: string): boolean => {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

// Generate random salt for wallet creation
export const generateSalt = (): string => {
  return ethers.hexlify(ethers.randomBytes(32));
}; 