import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    
    // Morph Holesky Testnet
    morphHolesky: {
      url: "https://rpc-quicknode-holesky.morphl2.io",
      chainId: 2810,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei - reasonable for L2
      gas: 8000000, // 8M gas limit
      timeout: 60000, // 60 seconds timeout
    },
    
    // Morph Mainnet (for future use)
    morphMainnet: {
      url: "https://rpc-quicknode.morphl2.io", // Update when available
      chainId: 2818, // Update when available
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
  },
  
  // Etherscan verification configuration
  etherscan: {
    apiKey: {
      morphHolesky: 'anything', // Morph doesn't require real API key
      morphMainnet: 'anything',
    },
    customChains: [
      {
        network: 'morphHolesky',
        chainId: 2810,
        urls: {
          apiURL: 'https://explorer-api-holesky.morphl2.io/api?',
          browserURL: 'https://explorer-holesky.morphl2.io/',
        },
      },
      {
        network: 'morphMainnet',
        chainId: 2818,
        urls: {
          apiURL: 'https://explorer-api.morphl2.io/api?',
          browserURL: 'https://explorer.morphl2.io/',
        },
      },
    ],
  },
  
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 20,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  
  // Source verification
  sourcify: {
    enabled: true,
  },
  
  // TypeChain configuration
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  
  // Path configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  // Mocha configuration for testing
  mocha: {
    timeout: 40000,
  },
};

export default config;
