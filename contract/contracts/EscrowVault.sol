// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

/**
 * @title EscrowVault
 * @dev Holds funds for unregistered phone numbers until they register
 * When someone sends money to an unregistered phone, funds are escrowed here
 */
contract EscrowVault {
    // Events
    event FundsEscrowed(
        bytes32 indexed phoneHash,
        address indexed token,
        uint256 amount,
        address indexed sender,
        uint256 timestamp,
        uint256 escrowId
    );
    
    event FundsClaimed(
        bytes32 indexed phoneHash,
        address indexed token,
        uint256 amount,
        address indexed claimer,
        uint256 timestamp,
        uint256 escrowId
    );
    
    event FundsRefunded(
        bytes32 indexed phoneHash,
        address indexed token,
        uint256 amount,
        address indexed refundedTo,
        uint256 timestamp,
        uint256 escrowId
    );
    
    event EscrowExpired(
        bytes32 indexed phoneHash,
        uint256 escrowId,
        uint256 timestamp
    );

    // Structs
    struct EscrowRecord {
        bytes32 phoneHash;
        address token;
        uint256 amount;
        address sender;
        uint256 timestamp;
        uint256 expiryTime;
        bool claimed;
        bool refunded;
        string message; // Optional message from sender
    }

    // State variables
    address public owner;
    address public phoneRegistry;
    
    // Escrow settings
    uint256 public constant ESCROW_PERIOD = 30 days; // 30 days to claim
    uint256 public constant MAX_MESSAGE_LENGTH = 200;
    
    // Escrow storage
    mapping(uint256 => EscrowRecord) public escrowRecords;
    mapping(bytes32 => uint256[]) public phoneToEscrowIds;
    mapping(address => uint256[]) public senderToEscrowIds;
    
    uint256 public nextEscrowId = 1;
    uint256 public totalEscrowedAmount;
    uint256 public totalClaimedAmount;
    uint256 public totalRefundedAmount;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    address[] public supportedTokensList;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "EscrowVault: Only owner can call this function");
        _;
    }
    
    modifier onlyPhoneRegistry() {
        require(msg.sender == phoneRegistry, "EscrowVault: Only phone registry can call this function");
        _;
    }
    
    modifier validToken(address _token) {
        require(supportedTokens[_token], "EscrowVault: Token not supported");
        _;
    }
    
    modifier validEscrowId(uint256 _escrowId) {
        require(_escrowId > 0 && _escrowId < nextEscrowId, "EscrowVault: Invalid escrow ID");
        _;
    }

    /**
     * @dev Constructor sets the contract owner and phone registry
     * @param _phoneRegistry Address of the phone registry contract
     */
    constructor(address _phoneRegistry) {
        require(_phoneRegistry != address(0), "EscrowVault: Invalid phone registry address");
        owner = msg.sender;
        phoneRegistry = _phoneRegistry;
    }

    /**
     * @dev Escrow funds for an unregistered phone number
     * @param _phoneHash Hash of the recipient's phone number
     * @param _token Token address (must be supported)
     * @param _amount Amount to escrow
     * @param _message Optional message from sender
     */
    function escrowFunds(
        bytes32 _phoneHash,
        address _token,
        uint256 _amount,
        string calldata _message
    ) external validToken(_token) returns (uint256 escrowId) {
        require(_phoneHash != bytes32(0), "EscrowVault: Invalid phone hash");
        require(_amount > 0, "EscrowVault: Amount must be greater than 0");
        require(bytes(_message).length <= MAX_MESSAGE_LENGTH, "EscrowVault: Message too long");
        
        // Transfer tokens to this contract
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        
        // Create escrow record
        escrowId = nextEscrowId++;
        escrowRecords[escrowId] = EscrowRecord({
            phoneHash: _phoneHash,
            token: _token,
            amount: _amount,
            sender: msg.sender,
            timestamp: block.timestamp,
            expiryTime: block.timestamp + ESCROW_PERIOD,
            claimed: false,
            refunded: false,
            message: _message
        });
        
        // Update mappings
        phoneToEscrowIds[_phoneHash].push(escrowId);
        senderToEscrowIds[msg.sender].push(escrowId);
        totalEscrowedAmount += _amount;
        
        emit FundsEscrowed(_phoneHash, _token, _amount, msg.sender, block.timestamp, escrowId);
        
        return escrowId;
    }

    /**
     * @dev Claim escrowed funds (called by phone registry when user registers)
     * @param _phoneHash Hash of the phone number
     * @param _claimer Address of the wallet claiming the funds
     */
    function claimEscrowedFunds(bytes32 _phoneHash, address _claimer) external onlyPhoneRegistry {
        require(_claimer != address(0), "EscrowVault: Invalid claimer address");
        
        uint256[] memory escrowIds = phoneToEscrowIds[_phoneHash];
        require(escrowIds.length > 0, "EscrowVault: No escrowed funds for this phone");
        
        for (uint256 i = 0; i < escrowIds.length; i++) {
            uint256 escrowId = escrowIds[i];
            EscrowRecord storage record = escrowRecords[escrowId];
            
            if (!record.claimed && !record.refunded && block.timestamp <= record.expiryTime) {
                // Mark as claimed
                record.claimed = true;
                totalClaimedAmount += record.amount;
                
                // Transfer tokens to claimer
                IERC20(record.token).transfer(_claimer, record.amount);
                
                emit FundsClaimed(
                    _phoneHash,
                    record.token,
                    record.amount,
                    _claimer,
                    block.timestamp,
                    escrowId
                );
            }
        }
    }

    /**
     * @dev Refund expired escrow funds to sender
     * @param _escrowId Escrow ID to refund
     */
    function refundExpiredEscrow(uint256 _escrowId) external validEscrowId(_escrowId) {
        EscrowRecord storage record = escrowRecords[_escrowId];
        
        require(!record.claimed, "EscrowVault: Funds already claimed");
        require(!record.refunded, "EscrowVault: Funds already refunded");
        require(block.timestamp > record.expiryTime, "EscrowVault: Escrow not expired yet");
        require(msg.sender == record.sender || msg.sender == owner, "EscrowVault: Not authorized to refund");
        
        // Mark as refunded
        record.refunded = true;
        totalRefundedAmount += record.amount;
        
        // Transfer tokens back to sender
        IERC20(record.token).transfer(record.sender, record.amount);
        
        emit FundsRefunded(
            record.phoneHash,
            record.token,
            record.amount,
            record.sender,
            block.timestamp,
            _escrowId
        );
    }

    /**
     * @dev Get all escrow IDs for a phone hash
     * @param _phoneHash Hash of the phone number
     * @return Array of escrow IDs
     */
    function getEscrowIdsByPhone(bytes32 _phoneHash) external view returns (uint256[] memory) {
        return phoneToEscrowIds[_phoneHash];
    }

    /**
     * @dev Get all escrow IDs for a sender
     * @param _sender Sender address
     * @return Array of escrow IDs
     */
    function getEscrowIdsBySender(address _sender) external view returns (uint256[] memory) {
        return senderToEscrowIds[_sender];
    }

    /**
     * @dev Get escrow record details
     * @param _escrowId Escrow ID
     * @return EscrowRecord struct
     */
    function getEscrowRecord(uint256 _escrowId) 
        external 
        view 
        validEscrowId(_escrowId) 
        returns (EscrowRecord memory) 
    {
        return escrowRecords[_escrowId];
    }

    /**
     * @dev Get total claimable amount for a phone hash
     * @param _phoneHash Hash of the phone number
     * @param _token Token address
     * @return Total claimable amount
     */
    function getClaimableAmount(bytes32 _phoneHash, address _token) external view returns (uint256) {
        uint256[] memory escrowIds = phoneToEscrowIds[_phoneHash];
        uint256 totalClaimable = 0;
        
        for (uint256 i = 0; i < escrowIds.length; i++) {
            EscrowRecord memory record = escrowRecords[escrowIds[i]];
            
            if (!record.claimed && 
                !record.refunded && 
                record.token == _token && 
                block.timestamp <= record.expiryTime) {
                totalClaimable += record.amount;
            }
        }
        
        return totalClaimable;
    }

    /**
     * @dev Check if escrow has expired
     * @param _escrowId Escrow ID
     * @return True if expired
     */
    function isEscrowExpired(uint256 _escrowId) external view validEscrowId(_escrowId) returns (bool) {
        return block.timestamp > escrowRecords[_escrowId].expiryTime;
    }

    /**
     * @dev Add supported token
     * @param _token Token address to add
     */
    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "EscrowVault: Invalid token address");
        require(!supportedTokens[_token], "EscrowVault: Token already supported");
        
        supportedTokens[_token] = true;
        supportedTokensList.push(_token);
    }

    /**
     * @dev Remove supported token
     * @param _token Token address to remove
     */
    function removeSupportedToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "EscrowVault: Token not supported");
        
        supportedTokens[_token] = false;
        
        // Remove from array
        for (uint256 i = 0; i < supportedTokensList.length; i++) {
            if (supportedTokensList[i] == _token) {
                supportedTokensList[i] = supportedTokensList[supportedTokensList.length - 1];
                supportedTokensList.pop();
                break;
            }
        }
    }

    /**
     * @dev Get all supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokensList;
    }

    /**
     * @dev Update phone registry address
     * @param _phoneRegistry New phone registry address
     */
    function updatePhoneRegistry(address _phoneRegistry) external onlyOwner {
        require(_phoneRegistry != address(0), "EscrowVault: Invalid phone registry address");
        phoneRegistry = _phoneRegistry;
    }

    /**
     * @dev Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "EscrowVault: Invalid new owner address");
        owner = _newOwner;
    }

    /**
     * @dev Emergency withdrawal (owner only)
     * @param _token Token address
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "EscrowVault: Invalid token address");
        require(_amount > 0, "EscrowVault: Amount must be greater than 0");
        
        IERC20(_token).transfer(owner, _amount);
    }

    /**
     * @dev Get contract statistics
     * @return totalEscrowed Total amount escrowed
     * @return totalClaimed Total amount claimed
     * @return totalRefunded Total amount refunded
     * @return activeEscrows Number of active escrows
     */
    function getStats() external view returns (
        uint256 totalEscrowed,
        uint256 totalClaimed,
        uint256 totalRefunded,
        uint256 activeEscrows
    ) {
        return (
            totalEscrowedAmount,
            totalClaimedAmount,
            totalRefundedAmount,
            nextEscrowId - 1
        );
    }
} 