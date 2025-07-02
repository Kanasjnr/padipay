// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PhoneRegistry
 * @dev Registry that maps hashed phone numbers to wallet addresses
 * Enables phone-based payments by linking phone numbers to crypto wallets
 */
contract PhoneRegistry {
    // Events
    event PhoneRegistered(bytes32 indexed phoneHash, address indexed wallet, uint256 timestamp);
    event PhoneUnregistered(bytes32 indexed phoneHash, address indexed wallet, uint256 timestamp);
    event RegistryOwnerChanged(address indexed oldOwner, address indexed newOwner);

    // State variables
    address public owner;
    mapping(bytes32 => address) public phoneToWallet;
    mapping(address => bytes32) public walletToPhone;
    mapping(bytes32 => bool) public isPhoneRegistered;
    
    // Total registered phones counter
    uint256 public totalRegisteredPhones;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "PhoneRegistry: Only owner can call this function");
        _;
    }
    
    modifier validAddress(address _address) {
        require(_address != address(0), "PhoneRegistry: Invalid address");
        _;
    }
    
    modifier phoneNotRegistered(bytes32 _phoneHash) {
        require(!isPhoneRegistered[_phoneHash], "PhoneRegistry: Phone already registered");
        _;
    }
    
    modifier phoneIsRegistered(bytes32 _phoneHash) {
        require(isPhoneRegistered[_phoneHash], "PhoneRegistry: Phone not registered");
        _;
    }

    /**
     * @dev Constructor sets the contract owner
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Register a phone number hash to a wallet address
     * @param _phoneHash Keccak256 hash of the phone number
     * @param _wallet Wallet address to associate with the phone
     */
    function registerPhone(bytes32 _phoneHash, address _wallet) 
        external 
        validAddress(_wallet)
        phoneNotRegistered(_phoneHash)
    {
        // If wallet already has a phone registered, unregister it first
        if (walletToPhone[_wallet] != bytes32(0)) {
            _unregisterPhone(walletToPhone[_wallet]);
        }
        
        // Register new phone
        phoneToWallet[_phoneHash] = _wallet;
        walletToPhone[_wallet] = _phoneHash;
        isPhoneRegistered[_phoneHash] = true;
        totalRegisteredPhones++;
        
        emit PhoneRegistered(_phoneHash, _wallet, block.timestamp);
    }

    /**
     * @dev Unregister a phone number
     * @param _phoneHash Hash of the phone number to unregister
     */
    function unregisterPhone(bytes32 _phoneHash) 
        external 
        phoneIsRegistered(_phoneHash)
    {
        address wallet = phoneToWallet[_phoneHash];
        require(msg.sender == wallet || msg.sender == owner, "PhoneRegistry: Not authorized to unregister");
        
        _unregisterPhone(_phoneHash);
    }

    /**
     * @dev Internal function to unregister a phone
     * @param _phoneHash Hash of the phone number to unregister
     */
    function _unregisterPhone(bytes32 _phoneHash) internal {
        address wallet = phoneToWallet[_phoneHash];
        
        delete phoneToWallet[_phoneHash];
        delete walletToPhone[wallet];
        isPhoneRegistered[_phoneHash] = false;
        totalRegisteredPhones--;
        
        emit PhoneUnregistered(_phoneHash, wallet, block.timestamp);
    }

    /**
     * @dev Get wallet address for a phone hash
     * @param _phoneHash Hash of the phone number
     * @return wallet address associated with the phone
     */
    function getWalletByPhone(bytes32 _phoneHash) external view returns (address) {
        return phoneToWallet[_phoneHash];
    }

    /**
     * @dev Get phone hash for a wallet address
     * @param _wallet Wallet address
     * @return phone hash associated with the wallet
     */
    function getPhoneByWallet(address _wallet) external view returns (bytes32) {
        return walletToPhone[_wallet];
    }

    /**
     * @dev Check if a phone number is registered
     * @param _phoneHash Hash of the phone number
     * @return true if phone is registered
     */
    function isPhoneNumberRegistered(bytes32 _phoneHash) external view returns (bool) {
        return isPhoneRegistered[_phoneHash];
    }

    /**
     * @dev Batch register multiple phones (owner only)
     * @param _phoneHashes Array of phone hashes
     * @param _wallets Array of wallet addresses
     */
    function batchRegisterPhones(bytes32[] calldata _phoneHashes, address[] calldata _wallets) 
        external 
        onlyOwner 
    {
        require(_phoneHashes.length == _wallets.length, "PhoneRegistry: Arrays length mismatch");
        require(_phoneHashes.length > 0, "PhoneRegistry: Empty arrays");
        
        for (uint256 i = 0; i < _phoneHashes.length; i++) {
            if (!isPhoneRegistered[_phoneHashes[i]] && _wallets[i] != address(0)) {
                phoneToWallet[_phoneHashes[i]] = _wallets[i];
                walletToPhone[_wallets[i]] = _phoneHashes[i];
                isPhoneRegistered[_phoneHashes[i]] = true;
                totalRegisteredPhones++;
                
                emit PhoneRegistered(_phoneHashes[i], _wallets[i], block.timestamp);
            }
        }
    }

    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        address oldOwner = owner;
        owner = _newOwner;
        emit RegistryOwnerChanged(oldOwner, _newOwner);
    }

    /**
     * @dev Create phone hash from phone number (utility function)
     * @param _phoneNumber Phone number string
     * @return phone hash
     */
    function createPhoneHash(string calldata _phoneNumber) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_phoneNumber));
    }
} 