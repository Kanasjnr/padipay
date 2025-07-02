// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";
import "./PhoneRegistry.sol";
import "./EscrowVault.sol";
import "./SmartWalletFactory.sol";

/**
 * @title PadiPayCore
 * @dev Main contract that orchestrates phone-based payments
 * Handles the core logic for sending money via phone numbers
 */
contract PadiPayCore {
    // Events
    event PaymentSent(
        address indexed sender,
        bytes32 indexed recipientPhoneHash,
        address indexed token,
        uint256 amount,
        uint256 timestamp,
        uint256 paymentId,
        bool directTransfer
    );
    
    event PaymentClaimed(
        bytes32 indexed phoneHash,
        address indexed claimer,
        address indexed token,
        uint256 amount,
        uint256 timestamp,
        uint256 paymentId
    );
    
    event WalletAutoCreated(
        bytes32 indexed phoneHash,
        address indexed wallet,
        address indexed user,
        uint256 timestamp
    );
    
    event CoreConfigUpdated(
        address indexed phoneRegistry,
        address indexed escrowVault,
        address indexed walletFactory
    );

    // Structs
    struct PaymentRecord {
        address sender;
        bytes32 recipientPhoneHash;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        bool isEscrowed;
        uint256 escrowId;
        string message;
    }

    // State variables
    address public owner;
    PhoneRegistry public phoneRegistry;
    EscrowVault public escrowVault;
    SmartWalletFactory public walletFactory;
    
    // Payment tracking
    mapping(uint256 => PaymentRecord) public payments;
    mapping(bytes32 => uint256[]) public phoneToPaymentIds;
    mapping(address => uint256[]) public senderToPaymentIds;
    
    uint256 public nextPaymentId = 1;
    uint256 public totalPaymentsSent;
    uint256 public totalPaymentsClaimed;
    uint256 public totalVolumeProcessed;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    address[] public supportedTokensList;
    
    // Fee configuration - Sustainable Revenue Model
    uint256 public feePercentage = 200; // 2.0% (200 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public minimumFee = 500000; // $0.50 minimum fee (6 decimals)
    address public feeRecipient;
    uint256 public totalFeesCollected;
    
    // Limits
    uint256 public maxPaymentAmount = 50000 * 10**6; // 50,000 USDT (6 decimals) - increased for business use
    uint256 public minPaymentAmount = 1 * 10**6; // 1 USDT (6 decimals)

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "PadiPayCore: Only owner can call this function");
        _;
    }
    
    modifier validToken(address _token) {
        require(supportedTokens[_token], "PadiPayCore: Token not supported");
        _;
    }
    
    modifier validAmount(uint256 _amount) {
        require(_amount >= minPaymentAmount, "PadiPayCore: Amount below minimum");
        require(_amount <= maxPaymentAmount, "PadiPayCore: Amount exceeds maximum");
        _;
    }

    /**
     * @dev Constructor sets up the core contract
     * @param _phoneRegistry Address of the phone registry
     * @param _escrowVault Address of the escrow vault
     * @param _walletFactory Address of the wallet factory
     * @param _feeRecipient Address to receive fees
     * @param _usdtAddress Address of USDT token on Morph
     */
    constructor(
        address _phoneRegistry,
        address _escrowVault,
        address _walletFactory,
        address _feeRecipient,
        address _usdtAddress
    ) {
        require(_phoneRegistry != address(0), "PadiPayCore: Invalid phone registry address");
        require(_escrowVault != address(0), "PadiPayCore: Invalid escrow vault address");
        // require(_walletFactory != address(0), "PadiPayCore: Invalid wallet factory address"); // Allow zero for testing
        require(_feeRecipient != address(0), "PadiPayCore: Invalid fee recipient address");
        require(_usdtAddress != address(0), "PadiPayCore: Invalid USDT address");
        
        owner = msg.sender;
        phoneRegistry = PhoneRegistry(_phoneRegistry);
        escrowVault = EscrowVault(_escrowVault);
        walletFactory = SmartWalletFactory(_walletFactory);
        feeRecipient = _feeRecipient;
        
        // Add USDT as supported token
        supportedTokens[_usdtAddress] = true;
        supportedTokensList.push(_usdtAddress);
    }

    /**
     * @dev Send payment to a phone number
     * @param _recipientPhoneHash Hash of recipient's phone number
     * @param _token Token address
     * @param _amount Amount to send
     * @param _message Optional message
     * @return paymentId ID of the payment
     */
    function sendPayment(
        bytes32 _recipientPhoneHash,
        address _token,
        uint256 _amount,
        string calldata _message
    ) external validToken(_token) validAmount(_amount) returns (uint256 paymentId) {
        require(_recipientPhoneHash != bytes32(0), "PadiPayCore: Invalid phone hash");
        require(bytes(_message).length <= 200, "PadiPayCore: Message too long");
        
        // Calculate fee with minimum fee enforcement
        uint256 percentageFee = (_amount * feePercentage) / FEE_DENOMINATOR;
        uint256 fee = percentageFee > minimumFee ? percentageFee : minimumFee;
        require(_amount > fee, "PadiPayCore: Amount must be greater than fee");
        uint256 netAmount = _amount - fee;
        
        // Transfer tokens from sender
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            IERC20(_token).transfer(feeRecipient, fee);
            totalFeesCollected += fee;
        }
        
        // Create payment record
        paymentId = nextPaymentId++;
        
        // Check if recipient phone is registered
        address recipientWallet = phoneRegistry.getWalletByPhone(_recipientPhoneHash);
        
        bool directTransfer = false;
        uint256 escrowId = 0;
        
        if (recipientWallet != address(0)) {
            // Direct transfer to registered wallet
            IERC20(_token).transfer(recipientWallet, netAmount);
            directTransfer = true;
        } else {
            // Escrow funds for unregistered phone
            IERC20(_token).approve(address(escrowVault), netAmount);
            escrowId = escrowVault.escrowFunds(_recipientPhoneHash, _token, netAmount, _message);
        }
        
        // Record payment
        payments[paymentId] = PaymentRecord({
            sender: msg.sender,
            recipientPhoneHash: _recipientPhoneHash,
            token: _token,
            amount: netAmount,
            timestamp: block.timestamp,
            claimed: directTransfer,
            isEscrowed: !directTransfer,
            escrowId: escrowId,
            message: _message
        });
        
        // Update tracking
        phoneToPaymentIds[_recipientPhoneHash].push(paymentId);
        senderToPaymentIds[msg.sender].push(paymentId);
        totalPaymentsSent++;
        totalVolumeProcessed += _amount;
        
        if (directTransfer) {
            totalPaymentsClaimed++;
        }
        
        emit PaymentSent(
            msg.sender,
            _recipientPhoneHash,
            _token,
            netAmount,
            block.timestamp,
            paymentId,
            directTransfer
        );
        
        return paymentId;
    }

    /**
     * @dev Register phone and claim escrowed funds
     * @param _phoneNumber Plain text phone number
     * @param _userWallet User's wallet address (can be EOA or smart wallet)
     * @param _createSmartWallet Whether to create a smart wallet
     * @param _salt Salt for smart wallet creation
     */
    function registerAndClaim(
        string calldata _phoneNumber,
        address _userWallet,
        bool _createSmartWallet,
        bytes32 _salt
    ) external returns (address walletAddress) {
        require(bytes(_phoneNumber).length > 0, "PadiPayCore: Invalid phone number");
        require(_userWallet != address(0), "PadiPayCore: Invalid user wallet address");
        
        bytes32 phoneHash = keccak256(abi.encodePacked(_phoneNumber));
        
        // Check if phone is already registered
        require(!phoneRegistry.isPhoneNumberRegistered(phoneHash), "PadiPayCore: Phone already registered");
        
        if (_createSmartWallet) {
            // Create smart wallet
            walletAddress = walletFactory.createWallet(_userWallet, phoneHash, _salt);
            emit WalletAutoCreated(phoneHash, walletAddress, _userWallet, block.timestamp);
        } else {
            walletAddress = _userWallet;
        }
        
        // Register phone
        phoneRegistry.registerPhone(phoneHash, walletAddress);
        
        // Claim escrowed funds
        escrowVault.claimEscrowedFunds(phoneHash, walletAddress);
        
        // Update payment records
        uint256[] memory paymentIds = phoneToPaymentIds[phoneHash];
        for (uint256 i = 0; i < paymentIds.length; i++) {
            PaymentRecord storage payment = payments[paymentIds[i]];
            if (payment.isEscrowed && !payment.claimed) {
                payment.claimed = true;
                totalPaymentsClaimed++;
                
                emit PaymentClaimed(
                    phoneHash,
                    walletAddress,
                    payment.token,
                    payment.amount,
                    block.timestamp,
                    paymentIds[i]
                );
            }
        }
        
        return walletAddress;
    }

    /**
     * @dev Get payment details
     * @param _paymentId Payment ID
     * @return PaymentRecord struct
     */
    function getPayment(uint256 _paymentId) external view returns (PaymentRecord memory) {
        require(_paymentId > 0 && _paymentId < nextPaymentId, "PadiPayCore: Invalid payment ID");
        return payments[_paymentId];
    }

    /**
     * @dev Get payment IDs for a phone hash
     * @param _phoneHash Phone hash
     * @return Array of payment IDs
     */
    function getPaymentsByPhone(bytes32 _phoneHash) external view returns (uint256[] memory) {
        return phoneToPaymentIds[_phoneHash];
    }

    /**
     * @dev Get payment IDs for a sender
     * @param _sender Sender address
     * @return Array of payment IDs
     */
    function getPaymentsBySender(address _sender) external view returns (uint256[] memory) {
        return senderToPaymentIds[_sender];
    }

    /**
     * @dev Get total pending amount for a phone hash
     * @param _phoneHash Phone hash
     * @param _token Token address
     * @return Total pending amount
     */
    function getPendingAmount(bytes32 _phoneHash, address _token) external view returns (uint256) {
        return escrowVault.getClaimableAmount(_phoneHash, _token);
    }

    /**
     * @dev Check if phone number can receive payments
     * @param _phoneHash Phone hash
     * @return isRegistered Whether phone is registered
     * @return walletAddress Wallet address if registered
     * @return pendingAmount Amount pending in escrow
     */
    function getPhoneStatus(bytes32 _phoneHash, address _token) 
        external 
        view 
        returns (
            bool isRegistered,
            address walletAddress,
            uint256 pendingAmount
        ) 
    {
        isRegistered = phoneRegistry.isPhoneNumberRegistered(_phoneHash);
        walletAddress = phoneRegistry.getWalletByPhone(_phoneHash);
        pendingAmount = escrowVault.getClaimableAmount(_phoneHash, _token);
    }

    /**
     * @dev Get platform statistics
     * @return totalSent Total payments sent
     * @return totalClaimed Total payments claimed
     * @return totalVolume Total volume processed
     * @return totalFees Total fees collected
     */
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 totalSent,
            uint256 totalClaimed,
            uint256 totalVolume,
            uint256 totalFees
        ) 
    {
        return (
            totalPaymentsSent,
            totalPaymentsClaimed,
            totalVolumeProcessed,
            totalFeesCollected
        );
    }

    // Admin Functions

    /**
     * @dev Add supported token
     * @param _token Token address
     */
    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "PadiPayCore: Invalid token address");
        require(!supportedTokens[_token], "PadiPayCore: Token already supported");
        
        supportedTokens[_token] = true;
        supportedTokensList.push(_token);
        
        escrowVault.addSupportedToken(_token);
    }

    /**
     * @dev Remove supported token
     * @param _token Token address
     */
    function removeSupportedToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "PadiPayCore: Token not supported");
        
        supportedTokens[_token] = false;
        
        // Remove from array
        for (uint256 i = 0; i < supportedTokensList.length; i++) {
            if (supportedTokensList[i] == _token) {
                supportedTokensList[i] = supportedTokensList[supportedTokensList.length - 1];
                supportedTokensList.pop();
                break;
            }
        }
        
        escrowVault.removeSupportedToken(_token);
    }

    /**
     * @dev Update fee configuration
     * @param _feePercentage New fee percentage (basis points)
     * @param _feeRecipient New fee recipient
     */
    function updateFeeConfig(uint256 _feePercentage, address _feeRecipient) external onlyOwner {
        require(_feePercentage <= 500, "PadiPayCore: Fee too high (max 5%)");
        require(_feeRecipient != address(0), "PadiPayCore: Invalid fee recipient");
        
        feePercentage = _feePercentage;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Update minimum fee
     * @param _minimumFee New minimum fee amount
     */
    function updateMinimumFee(uint256 _minimumFee) external onlyOwner {
        require(_minimumFee > 0, "PadiPayCore: Invalid minimum fee");
        require(_minimumFee <= 5 * 10**6, "PadiPayCore: Minimum fee too high (max $5)");
        
        minimumFee = _minimumFee;
    }

    /**
     * @dev Update payment limits
     * @param _minAmount New minimum payment amount
     * @param _maxAmount New maximum payment amount
     */
    function updatePaymentLimits(uint256 _minAmount, uint256 _maxAmount) external onlyOwner {
        require(_minAmount > 0, "PadiPayCore: Invalid minimum amount");
        require(_maxAmount > _minAmount, "PadiPayCore: Invalid maximum amount");
        
        minPaymentAmount = _minAmount;
        maxPaymentAmount = _maxAmount;
    }

    /**
     * @dev Update core contract addresses
     * @param _phoneRegistry New phone registry address
     * @param _escrowVault New escrow vault address
     * @param _walletFactory New wallet factory address
     */
    function updateCoreContracts(
        address _phoneRegistry,
        address _escrowVault,
        address _walletFactory
    ) external onlyOwner {
        require(_phoneRegistry != address(0), "PadiPayCore: Invalid phone registry");
        require(_escrowVault != address(0), "PadiPayCore: Invalid escrow vault");
        require(_walletFactory != address(0), "PadiPayCore: Invalid wallet factory");
        
        phoneRegistry = PhoneRegistry(_phoneRegistry);
        escrowVault = EscrowVault(_escrowVault);
        walletFactory = SmartWalletFactory(_walletFactory);
        
        emit CoreConfigUpdated(_phoneRegistry, _escrowVault, _walletFactory);
    }

    /**
     * @dev Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "PadiPayCore: Invalid new owner");
        owner = _newOwner;
    }

    /**
     * @dev Get supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokensList;
    }

    /**
     * @dev Emergency withdrawal (owner only)
     * @param _token Token address
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "PadiPayCore: Invalid token address");
        IERC20(_token).transfer(owner, _amount);
    }
} 