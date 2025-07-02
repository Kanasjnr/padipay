// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

/**
 * @title PaymasterContract
 * @dev Paymaster for ERC-4337 Account Abstraction
 * Sponsors gas fees for PadiPay users to enable gasless transactions
 */
contract PaymasterContract {
    // Events
    event PaymasterFunded(address indexed funder, uint256 amount, uint256 timestamp);
    event PaymasterWithdrawn(address indexed owner, uint256 amount, uint256 timestamp);
    event SponsoredTransaction(
        address indexed user,
        address indexed userOp,
        uint256 gasUsed,
        uint256 gasCost,
        uint256 timestamp
    );
    event PaymasterConfigUpdated(
        uint256 maxGasSponsored,
        uint256 maxTransactionsPerUser,
        bool sponsorshipEnabled
    );

    // State variables
    address public owner;
    address public entryPoint; // ERC-4337 EntryPoint contract
    
    // Sponsorship configuration
    bool public sponsorshipEnabled = true;
    uint256 public maxGasSponsored = 500000; // Max gas to sponsor per transaction
    uint256 public maxTransactionsPerUser = 100; // Max transactions per user per day
    uint256 public sponsorshipBalance;
    
    // User tracking
    mapping(address => uint256) public userTransactionCount;
    mapping(address => uint256) public lastTransactionDate;
    mapping(address => bool) public whitelistedUsers;
    mapping(address => bool) public blacklistedUsers;
    
    // Gas price limits
    uint256 public maxGasPrice = 50 gwei;
    uint256 public minGasPrice = 1 gwei;
    
    // Statistics
    uint256 public totalTransactionsSponsored;
    uint256 public totalGasSponsored;
    uint256 public totalFundsUsed;
    
    // Supported operations
    mapping(bytes4 => bool) public supportedOperations;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "PaymasterContract: Only owner can call this function");
        _;
    }
    
    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "PaymasterContract: Only entry point can call this function");
        _;
    }
    
    modifier sponsorshipActive() {
        require(sponsorshipEnabled, "PaymasterContract: Sponsorship is disabled");
        _;
    }

    /**
     * @dev Constructor sets up the paymaster
     * @param _entryPoint Address of the ERC-4337 EntryPoint contract
     */
    constructor(address _entryPoint) {
        require(_entryPoint != address(0), "PaymasterContract: Invalid entry point address");
        
        owner = msg.sender;
        entryPoint = _entryPoint;
        
        // Initialize supported operations
        supportedOperations[bytes4(keccak256("sendPayment(bytes32,address,uint256,string)"))] = true;
        supportedOperations[bytes4(keccak256("registerAndClaim(string,address,bool,bytes32)"))] = true;
        supportedOperations[bytes4(keccak256("transfer(address,uint256)"))] = true;
    }

    /**
     * @dev Validate paymaster user operation (ERC-4337 standard)
     * @param userOp The user operation to validate
     * @param userOpHash Hash of the user operation
     * @param maxCost Maximum cost of the operation
     * @return context Context data for post-operation
     * @return validationData Validation result
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external onlyEntryPoint sponsorshipActive returns (bytes memory context, uint256 validationData) {
        // Validate user operation
        require(!blacklistedUsers[userOp.sender], "PaymasterContract: User is blacklisted");
        require(maxCost <= maxGasSponsored * tx.gasprice, "PaymasterContract: Gas cost too high");
        require(tx.gasprice <= maxGasPrice, "PaymasterContract: Gas price too high");
        require(tx.gasprice >= minGasPrice, "PaymasterContract: Gas price too low");
        
        // Check if operation is supported
        bytes4 functionSelector = bytes4(userOp.callData[:4]);
        require(supportedOperations[functionSelector], "PaymasterContract: Operation not supported");
        
        // Check user transaction limits
        if (!whitelistedUsers[userOp.sender]) {
            uint256 today = block.timestamp / 1 days;
            uint256 userLastDay = lastTransactionDate[userOp.sender] / 1 days;
            
            if (today != userLastDay) {
                userTransactionCount[userOp.sender] = 0;
                lastTransactionDate[userOp.sender] = block.timestamp;
            }
            
            require(
                userTransactionCount[userOp.sender] < maxTransactionsPerUser,
                "PaymasterContract: User exceeded daily transaction limit"
            );
        }
        
        // Check if we have enough balance to sponsor
        require(sponsorshipBalance >= maxCost, "PaymasterContract: Insufficient sponsorship balance");
        
        // Reserve funds for this operation
        sponsorshipBalance -= maxCost;
        
        // Update user transaction count
        userTransactionCount[userOp.sender]++;
        
        // Return context for post-operation processing
        context = abi.encode(userOp.sender, maxCost, block.timestamp);
        
        // Return successful validation (0 means success)
        validationData = 0;
    }

    /**
     * @dev Post-operation processing (ERC-4337 standard)
     * @param mode Operation mode (0 = success, 1 = revert, 2 = postOp revert)
     * @param context Context data from validation
     * @param actualGasCost Actual gas cost of the operation
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external onlyEntryPoint {
        (address user, uint256 maxCost, uint256 timestamp) = abi.decode(context, (address, uint256, uint256));
        
        if (mode == PostOpMode.opSucceeded) {
            // Operation succeeded - finalize sponsorship
            uint256 refund = maxCost - actualGasCost;
            sponsorshipBalance += refund; // Refund unused gas
            
            // Update statistics
            totalTransactionsSponsored++;
            totalGasSponsored += actualGasCost;
            totalFundsUsed += actualGasCost;
            
            emit SponsoredTransaction(user, address(0), actualGasCost, actualGasCost, timestamp);
        } else {
            // Operation failed - refund reserved amount
            sponsorshipBalance += maxCost;
        }
    }

    /**
     * @dev Fund the paymaster with ETH
     */
    function fundPaymaster() external payable onlyOwner {
        require(msg.value > 0, "PaymasterContract: Must send ETH to fund");
        sponsorshipBalance += msg.value;
        emit PaymasterFunded(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Withdraw funds from paymaster
     * @param _amount Amount to withdraw
     */
    function withdrawFunds(uint256 _amount) external onlyOwner {
        require(_amount <= sponsorshipBalance, "PaymasterContract: Insufficient balance");
        require(_amount > 0, "PaymasterContract: Amount must be greater than 0");
        
        sponsorshipBalance -= _amount;
        payable(owner).transfer(_amount);
        
        emit PaymasterWithdrawn(owner, _amount, block.timestamp);
    }

    /**
     * @dev Add user to whitelist (unlimited transactions)
     * @param _user User address to whitelist
     */
    function addToWhitelist(address _user) external onlyOwner {
        require(_user != address(0), "PaymasterContract: Invalid user address");
        whitelistedUsers[_user] = true;
    }

    /**
     * @dev Remove user from whitelist
     * @param _user User address to remove from whitelist
     */
    function removeFromWhitelist(address _user) external onlyOwner {
        whitelistedUsers[_user] = false;
    }

    /**
     * @dev Add user to blacklist (block all transactions)
     * @param _user User address to blacklist
     */
    function addToBlacklist(address _user) external onlyOwner {
        require(_user != address(0), "PaymasterContract: Invalid user address");
        blacklistedUsers[_user] = true;
    }

    /**
     * @dev Remove user from blacklist
     * @param _user User address to remove from blacklist
     */
    function removeFromBlacklist(address _user) external onlyOwner {
        blacklistedUsers[_user] = false;
    }

    /**
     * @dev Add supported operation
     * @param _selector Function selector to support
     */
    function addSupportedOperation(bytes4 _selector) external onlyOwner {
        supportedOperations[_selector] = true;
    }

    /**
     * @dev Remove supported operation
     * @param _selector Function selector to remove
     */
    function removeSupportedOperation(bytes4 _selector) external onlyOwner {
        supportedOperations[_selector] = false;
    }

    /**
     * @dev Update paymaster configuration
     * @param _maxGasSponsored Maximum gas to sponsor per transaction
     * @param _maxTransactionsPerUser Maximum transactions per user per day
     * @param _sponsorshipEnabled Whether sponsorship is enabled
     */
    function updateConfig(
        uint256 _maxGasSponsored,
        uint256 _maxTransactionsPerUser,
        bool _sponsorshipEnabled
    ) external onlyOwner {
        require(_maxGasSponsored > 0, "PaymasterContract: Invalid max gas sponsored");
        require(_maxTransactionsPerUser > 0, "PaymasterContract: Invalid max transactions per user");
        
        maxGasSponsored = _maxGasSponsored;
        maxTransactionsPerUser = _maxTransactionsPerUser;
        sponsorshipEnabled = _sponsorshipEnabled;
        
        emit PaymasterConfigUpdated(_maxGasSponsored, _maxTransactionsPerUser, _sponsorshipEnabled);
    }

    /**
     * @dev Update gas price limits
     * @param _minGasPrice Minimum gas price to accept
     * @param _maxGasPrice Maximum gas price to accept
     */
    function updateGasPriceLimits(uint256 _minGasPrice, uint256 _maxGasPrice) external onlyOwner {
        require(_minGasPrice > 0, "PaymasterContract: Invalid minimum gas price");
        require(_maxGasPrice > _minGasPrice, "PaymasterContract: Invalid maximum gas price");
        
        minGasPrice = _minGasPrice;
        maxGasPrice = _maxGasPrice;
    }

    /**
     * @dev Get user sponsorship status
     * @param _user User address
     * @return isWhitelisted Whether user is whitelisted
     * @return isBlacklisted Whether user is blacklisted
     * @return transactionCount Number of transactions today
     * @return remainingTransactions Remaining transactions for today
     */
    function getUserStatus(address _user) external view returns (
        bool isWhitelisted,
        bool isBlacklisted,
        uint256 transactionCount,
        uint256 remainingTransactions
    ) {
        isWhitelisted = whitelistedUsers[_user];
        isBlacklisted = blacklistedUsers[_user];
        
        uint256 today = block.timestamp / 1 days;
        uint256 userLastDay = lastTransactionDate[_user] / 1 days;
        
        if (today != userLastDay) {
            transactionCount = 0;
        } else {
            transactionCount = userTransactionCount[_user];
        }
        
        if (isWhitelisted) {
            remainingTransactions = type(uint256).max;
        } else {
            remainingTransactions = maxTransactionsPerUser > transactionCount 
                ? maxTransactionsPerUser - transactionCount 
                : 0;
        }
    }

    /**
     * @dev Get paymaster statistics
     * @return totalSponsored Total transactions sponsored
     * @return totalGas Total gas sponsored
     * @return totalUsed Total funds used
     * @return currentBalance Current sponsorship balance
     */
    function getPaymasterStats() external view returns (
        uint256 totalSponsored,
        uint256 totalGas,
        uint256 totalUsed,
        uint256 currentBalance
    ) {
        return (
            totalTransactionsSponsored,
            totalGasSponsored,
            totalFundsUsed,
            sponsorshipBalance
        );
    }

    /**
     * @dev Check if operation can be sponsored
     * @param _user User address
     * @param _selector Function selector
     * @param _gasLimit Gas limit for the operation
     * @return canSponsor Whether the operation can be sponsored
     * @return reason Reason if cannot sponsor
     */
    function canSponsorOperation(
        address _user,
        bytes4 _selector,
        uint256 _gasLimit
    ) external view returns (bool canSponsor, string memory reason) {
        if (!sponsorshipEnabled) {
            return (false, "Sponsorship disabled");
        }
        
        if (blacklistedUsers[_user]) {
            return (false, "User blacklisted");
        }
        
        if (!supportedOperations[_selector]) {
            return (false, "Operation not supported");
        }
        
        if (_gasLimit > maxGasSponsored) {
            return (false, "Gas limit too high");
        }
        
        uint256 estimatedCost = _gasLimit * tx.gasprice;
        if (sponsorshipBalance < estimatedCost) {
            return (false, "Insufficient sponsorship balance");
        }
        
        if (!whitelistedUsers[_user]) {
            uint256 today = block.timestamp / 1 days;
            uint256 userLastDay = lastTransactionDate[_user] / 1 days;
            uint256 currentCount = (today != userLastDay) ? 0 : userTransactionCount[_user];
            
            if (currentCount >= maxTransactionsPerUser) {
                return (false, "Daily transaction limit exceeded");
            }
        }
        
        return (true, "");
    }

    /**
     * @dev Update entry point address
     * @param _entryPoint New entry point address
     */
    function updateEntryPoint(address _entryPoint) external onlyOwner {
        require(_entryPoint != address(0), "PaymasterContract: Invalid entry point address");
        entryPoint = _entryPoint;
    }

    /**
     * @dev Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "PaymasterContract: Invalid new owner address");
        owner = _newOwner;
    }

    /**
     * @dev Receive ETH (for funding)
     */
    receive() external payable {
        sponsorshipBalance += msg.value;
        emit PaymasterFunded(msg.sender, msg.value, block.timestamp);
    }
}

// ERC-4337 User Operation struct
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

// ERC-4337 Post Operation Mode
enum PostOpMode {
    opSucceeded,
    opReverted,
    postOpReverted
} 