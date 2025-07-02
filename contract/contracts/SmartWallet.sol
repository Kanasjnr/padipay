// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

/**
 * @title SmartWallet
 * @notice Basic smart wallet implementation for ERC-4337 compatibility
 * @dev This is a minimal implementation for PadiPay's phone-based wallet system
 */
contract SmartWallet {
    // Events
    event WalletInitialized(address indexed owner, address indexed entryPoint);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TransactionExecuted(address indexed target, uint256 value, bytes data);
    event TokenReceived(address indexed token, address indexed from, uint256 amount);

    // State variables
    address public owner;
    address public entryPoint;
    uint256 public nonce;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "SmartWallet: not owner");
        _;
    }
    
    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "SmartWallet: not entry point");
        _;
    }
    
    modifier onlyOwnerOrEntryPoint() {
        require(msg.sender == owner || msg.sender == entryPoint, "SmartWallet: unauthorized");
        _;
    }

    /**
     * @notice Constructor for the SmartWallet implementation
     * @param _owner The owner of this wallet
     * @param _entryPoint The ERC-4337 entry point address
     */
    constructor(address _owner, address _entryPoint) {
        require(_owner != address(0), "SmartWallet: owner cannot be zero address");
        require(_entryPoint != address(0), "SmartWallet: entry point cannot be zero address");
        
        owner = _owner;
        entryPoint = _entryPoint;
        
        emit WalletInitialized(_owner, _entryPoint);
    }

    /**
     * @notice Initialize the wallet (for clones)
     * @param _owner The owner of this wallet
     * @param _entryPoint The ERC-4337 entry point address
     */
    function initialize(address _owner, address _entryPoint) external {
        require(owner == address(0), "SmartWallet: already initialized");
        require(_owner != address(0), "SmartWallet: owner cannot be zero address");
        require(_entryPoint != address(0), "SmartWallet: entry point cannot be zero address");
        
        owner = _owner;
        entryPoint = _entryPoint;
        
        emit WalletInitialized(_owner, _entryPoint);
    }

    /**
     * @notice Execute a transaction from this wallet
     * @param target The target contract address
     * @param value The amount of ETH to send
     * @param data The transaction data
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwnerOrEntryPoint returns (bytes memory result) {
        require(target != address(0), "SmartWallet: target cannot be zero address");
        
        nonce++;
        
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        require(success, "SmartWallet: transaction failed");
        
        emit TransactionExecuted(target, value, data);
        return returnData;
    }

    /**
     * @notice Execute multiple transactions in a batch
     * @param targets Array of target addresses
     * @param values Array of ETH amounts
     * @param datas Array of transaction data
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwnerOrEntryPoint {
        require(targets.length == values.length && values.length == datas.length, "SmartWallet: array length mismatch");
        
        for (uint256 i = 0; i < targets.length; i++) {
            require(targets[i] != address(0), "SmartWallet: target cannot be zero address");
            
            (bool success, ) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "SmartWallet: batch transaction failed");
            
            emit TransactionExecuted(targets[i], values[i], datas[i]);
        }
        
        nonce++;
    }

    /**
     * @notice Transfer ownership of the wallet
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "SmartWallet: new owner cannot be zero address");
        require(newOwner != owner, "SmartWallet: new owner is the same as current owner");
        
        address previousOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @notice Send ETH from this wallet
     * @param to The recipient address
     * @param amount The amount to send
     */
    function sendEth(address payable to, uint256 amount) external onlyOwnerOrEntryPoint {
        require(to != address(0), "SmartWallet: recipient cannot be zero address");
        require(address(this).balance >= amount, "SmartWallet: insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "SmartWallet: ETH transfer failed");
        
        nonce++;
    }

    /**
     * @notice Send ERC20 tokens from this wallet
     * @param token The token contract address
     * @param to The recipient address
     * @param amount The amount to send
     */
    function sendToken(address token, address to, uint256 amount) external onlyOwnerOrEntryPoint {
        require(token != address(0), "SmartWallet: token cannot be zero address");
        require(to != address(0), "SmartWallet: recipient cannot be zero address");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "SmartWallet: insufficient token balance");
        
        bool success = tokenContract.transfer(to, amount);
        require(success, "SmartWallet: token transfer failed");
        
        nonce++;
    }

    /**
     * @notice Get the current nonce for this wallet
     * @return The current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    /**
     * @notice Check if this wallet is initialized
     * @return True if initialized, false otherwise
     */
    function isInitialized() external view returns (bool) {
        return owner != address(0);
    }

    /**
     * @notice Get wallet balance for a specific token
     * @param token The token address (use address(0) for ETH)
     * @return The balance
     */
    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    /**
     * @notice Allow the wallet to receive ETH
     */
    receive() external payable {
        // Allow receiving ETH
    }

    /**
     * @notice Allow the wallet to receive ETH via fallback
     */
    fallback() external payable {
        // Allow receiving ETH
    }

    /**
     * @notice Handle token receipts (optional)
     * @param token The token address
     * @param from The sender address
     * @param amount The amount received
     */
    function onTokenReceived(address token, address from, uint256 amount) external {
        emit TokenReceived(token, from, amount);
    }
} 