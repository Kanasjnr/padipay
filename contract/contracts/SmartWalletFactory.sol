// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

/**
 * @title SmartWalletFactory
 * @dev Factory contract for deploying ERC-4337 compatible smart wallets
 * Creates wallets for users when they register their phone numbers
 */
contract SmartWalletFactory {
    // Events
    event WalletCreated(
        address indexed wallet,
        address indexed owner,
        bytes32 indexed phoneHash,
        uint256 timestamp
    );
    
    event FactoryOwnerChanged(address indexed oldOwner, address indexed newOwner);

    // State variables
    address public owner;
    address public phoneRegistry;
    address public entryPoint; // ERC-4337 EntryPoint contract
    
    // Wallet deployment tracking
    mapping(address => bool) public isWalletDeployed;
    mapping(bytes32 => address) public phoneToWallet;
    mapping(address => bytes32) public walletToPhone;
    
    address[] public deployedWallets;
    uint256 public totalWalletsDeployed;
    
    // Wallet implementation
    address public walletImplementation;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "SmartWalletFactory: Only owner can call this function");
        _;
    }
    
    modifier onlyPhoneRegistry() {
        require(msg.sender == phoneRegistry, "SmartWalletFactory: Only phone registry can call this function");
        _;
    }

    /**
     * @dev Constructor sets up the factory
     * @param _phoneRegistry Address of the phone registry contract
     * @param _entryPoint Address of the ERC-4337 EntryPoint contract
     * @param _walletImplementation Address of the wallet implementation contract
     */
    constructor(
        address _phoneRegistry,
        address _entryPoint,
        address _walletImplementation
    ) {
        require(_phoneRegistry != address(0), "SmartWalletFactory: Invalid phone registry address");
        require(_entryPoint != address(0), "SmartWalletFactory: Invalid entry point address");
        require(_walletImplementation != address(0), "SmartWalletFactory: Invalid wallet implementation address");
        
        owner = msg.sender;
        phoneRegistry = _phoneRegistry;
        entryPoint = _entryPoint;
        walletImplementation = _walletImplementation;
    }

    /**
     * @dev Create a smart wallet for a user
     * @param _owner Owner of the wallet (user's EOA or initial address)
     * @param _phoneHash Hash of the phone number
     * @param _salt Salt for deterministic address generation
     * @return wallet Address of the created wallet
     */
    function createWallet(
        address _owner,
        bytes32 _phoneHash,
        bytes32 _salt
    ) external onlyPhoneRegistry returns (address wallet) {
        require(_owner != address(0), "SmartWalletFactory: Invalid owner address");
        require(_phoneHash != bytes32(0), "SmartWalletFactory: Invalid phone hash");
        
        // Generate deterministic address
        bytes32 fullSalt = keccak256(abi.encodePacked(_phoneHash, _salt));
        
        // Deploy wallet using CREATE2
        bytes memory bytecode = abi.encodePacked(
            type(SmartWallet).creationCode,
            abi.encode(_owner, entryPoint)
        );
        
        assembly {
            wallet := create2(0, add(bytecode, 0x20), mload(bytecode), fullSalt)
        }
        
        require(wallet != address(0), "SmartWalletFactory: Wallet creation failed");
        
        // Update tracking
        isWalletDeployed[wallet] = true;
        phoneToWallet[_phoneHash] = wallet;
        walletToPhone[wallet] = _phoneHash;
        deployedWallets.push(wallet);
        totalWalletsDeployed++;
        
        emit WalletCreated(wallet, _owner, _phoneHash, block.timestamp);
        
        return wallet;
    }

    /**
     * @dev Get the deterministic address for a wallet
     * @param _phoneHash Hash of the phone number
     * @param _salt Salt for address generation
     * @return Predicted wallet address
     */
    function getWalletAddress(
        bytes32 _phoneHash,
        bytes32 _salt
    ) external view returns (address) {
        bytes32 fullSalt = keccak256(abi.encodePacked(_phoneHash, _salt));
        
        bytes memory bytecode = abi.encodePacked(
            type(SmartWallet).creationCode,
            abi.encode(address(0), entryPoint) // Placeholder owner for address calculation
        );
        
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            fullSalt,
            keccak256(bytecode)
        )))));
    }

    /**
     * @dev Check if a wallet is deployed by this factory
     * @param _wallet Wallet address to check
     * @return True if wallet was deployed by this factory
     */
    function isFactoryWallet(address _wallet) external view returns (bool) {
        return isWalletDeployed[_wallet];
    }

    /**
     * @dev Get wallet address by phone hash
     * @param _phoneHash Hash of the phone number
     * @return Wallet address
     */
    function getWalletByPhone(bytes32 _phoneHash) external view returns (address) {
        return phoneToWallet[_phoneHash];
    }

    /**
     * @dev Get phone hash by wallet address
     * @param _wallet Wallet address
     * @return Phone hash
     */
    function getPhoneByWallet(address _wallet) external view returns (bytes32) {
        return walletToPhone[_wallet];
    }

    /**
     * @dev Get all deployed wallets
     * @return Array of wallet addresses
     */
    function getAllWallets() external view returns (address[] memory) {
        return deployedWallets;
    }

    /**
     * @dev Get wallet deployment statistics
     * @return total Total wallets deployed
     * @return active Currently active wallets
     */
    function getWalletStats() external view returns (uint256 total, uint256 active) {
        return (totalWalletsDeployed, deployedWallets.length);
    }

    /**
     * @dev Update phone registry address
     * @param _phoneRegistry New phone registry address
     */
    function updatePhoneRegistry(address _phoneRegistry) external onlyOwner {
        require(_phoneRegistry != address(0), "SmartWalletFactory: Invalid phone registry address");
        phoneRegistry = _phoneRegistry;
    }

    /**
     * @dev Update entry point address
     * @param _entryPoint New entry point address
     */
    function updateEntryPoint(address _entryPoint) external onlyOwner {
        require(_entryPoint != address(0), "SmartWalletFactory: Invalid entry point address");
        entryPoint = _entryPoint;
    }

    /**
     * @dev Update wallet implementation
     * @param _walletImplementation New wallet implementation address
     */
    function updateWalletImplementation(address _walletImplementation) external onlyOwner {
        require(_walletImplementation != address(0), "SmartWalletFactory: Invalid wallet implementation address");
        walletImplementation = _walletImplementation;
    }

    /**
     * @dev Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "SmartWalletFactory: Invalid new owner address");
        address oldOwner = owner;
        owner = _newOwner;
        emit FactoryOwnerChanged(oldOwner, _newOwner);
    }
}

/**
 * @title SmartWallet
 * @dev ERC-4337 compatible smart wallet implementation
 * Basic implementation - can be upgraded with more features
 */
contract SmartWallet {
    // Events
    event WalletInitialized(address indexed owner, address indexed entryPoint);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event TransactionExecuted(address indexed target, uint256 value, bytes data);

    // State variables
    address public owner;
    address public entryPoint;
    uint256 private _nonce;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "SmartWallet: Only owner can call this function");
        _;
    }
    
    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "SmartWallet: Only entry point can call this function");
        _;
    }

    /**
     * @dev Constructor initializes the wallet
     * @param _owner Owner of the wallet
     * @param _entryPoint ERC-4337 EntryPoint contract
     */
    constructor(address _owner, address _entryPoint) {
        require(_owner != address(0), "SmartWallet: Invalid owner address");
        require(_entryPoint != address(0), "SmartWallet: Invalid entry point address");
        
        owner = _owner;
        entryPoint = _entryPoint;
        
        emit WalletInitialized(_owner, _entryPoint);
    }

    /**
     * @dev Execute a transaction
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Transaction data
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner {
        require(target != address(0), "SmartWallet: Invalid target address");
        
        (bool success, ) = target.call{value: value}(data);
        require(success, "SmartWallet: Transaction execution failed");
        
        emit TransactionExecuted(target, value, data);
    }

    /**
     * @dev Execute multiple transactions in batch
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param data Array of transaction data
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata data
    ) external onlyOwner {
        require(
            targets.length == values.length && values.length == data.length,
            "SmartWallet: Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < targets.length; i++) {
            require(targets[i] != address(0), "SmartWallet: Invalid target address");
            
            (bool success, ) = targets[i].call{value: values[i]}(data[i]);
            require(success, "SmartWallet: Batch transaction failed");
            
            emit TransactionExecuted(targets[i], values[i], data[i]);
        }
    }

    /**
     * @dev Get current nonce
     * @return Current nonce value
     */
    function getNonce() external view returns (uint256) {
        return _nonce;
    }

    /**
     * @dev Change owner of the wallet
     * @param _newOwner New owner address
     */
    function changeOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "SmartWallet: Invalid new owner address");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnerChanged(oldOwner, _newOwner);
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}

    /**
     * @dev Get wallet balance
     * @param token Token address (address(0) for ETH)
     * @return Balance
     */
    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            // For ERC20 tokens
            (bool success, bytes memory data) = token.staticcall(
                abi.encodeWithSignature("balanceOf(address)", address(this))
            );
            if (success && data.length >= 32) {
                return abi.decode(data, (uint256));
            }
            return 0;
        }
    }
}

/**
 * @dev Struct for batch calls
 */
struct Call {
    address to;
    uint256 value;
    bytes data;
} 