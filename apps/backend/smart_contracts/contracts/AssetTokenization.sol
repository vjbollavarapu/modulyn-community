// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AssetTokenization
 * @dev NFT-based asset tokenization for equipment, vehicles, and facilities
 * @author Modulyn ERP
 */
contract AssetTokenization is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // ==================== CUSTOM ERRORS ====================
    
    error InvalidAssetType();
    error NotAssetOwner();
    error InvalidRecipientAddress();
    error AssetValueMustBeGreaterThanZero();
    error SerialNumberRequired();
    error SerialNumberAlreadyExists();
    error AssetIsNotActive();
    error AssetDoesNotExist();
    error AssetAlreadyRetired();
    
    // Events
    event AssetMinted(uint256 indexed tokenId, address indexed owner, string assetType, uint256 value);
    event AssetTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event MaintenanceRecorded(uint256 indexed tokenId, uint256 timestamp, string description);
    event AssetValueUpdated(uint256 indexed tokenId, uint256 oldValue, uint256 newValue);
    event AssetRetired(uint256 indexed tokenId, string reason);
    
    // Structs
    struct Asset {
        uint256 tokenId;
        string assetType; // "vehicle", "equipment", "facility"
        string serialNumber;
        string model;
        string manufacturer;
        uint256 value;
        uint256 purchaseDate;
        uint256 lastMaintenance;
        bool isActive;
        string metadataURI;
    }
    
    struct MaintenanceRecord {
        uint256 timestamp;
        string description;
        uint256 cost;
        string performedBy;
        string location;
    }
    
    // State Variables
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => MaintenanceRecord[]) public maintenanceHistory;
    mapping(string => uint256) public serialNumberToTokenId;
    mapping(address => uint256[]) public ownerAssets;
    
    // Asset type validation
    mapping(string => bool) public validAssetTypes;
    
    // Modifiers
    modifier validAssetType(string calldata _assetType) {
        if (!validAssetTypes[_assetType]) revert InvalidAssetType();
        _;
    }
    
    modifier onlyAssetOwner(uint256 _tokenId) {
        if (ownerOf(_tokenId) != msg.sender && msg.sender != owner()) revert NotAssetOwner();
        _;
    }
    
    constructor() ERC721("Modulyn Assets", "TGA") {
        // Initialize valid asset types
        validAssetTypes["vehicle"] = true;
        validAssetTypes["equipment"] = true;
        validAssetTypes["facility"] = true;
        validAssetTypes["tool"] = true;
        validAssetTypes["furniture"] = true;
    }
    
    /**
     * @dev Mint a new asset NFT
     * @param _to Address to mint the NFT to
     * @param _assetType Type of asset
     * @param _serialNumber Serial number of the asset
     * @param _model Model of the asset
     * @param _manufacturer Manufacturer of the asset
     * @param _value Value of the asset
     * @param _purchaseDate Purchase date (timestamp)
     * @param _metadataURI IPFS URI for asset metadata
     */
    function mintAsset(
        address _to,
        string calldata _assetType,
        string calldata _serialNumber,
        string calldata _model,
        string calldata _manufacturer,
        uint256 _value,
        uint256 _purchaseDate,
        string calldata _metadataURI
    ) external onlyOwner validAssetType(_assetType) {
        if (_to == address(0)) revert InvalidRecipientAddress();
        if (_value == 0) revert AssetValueMustBeGreaterThanZero();
        if (bytes(_serialNumber).length == 0) revert SerialNumberRequired();
        
        // Check if serial number already exists
        if (serialNumberToTokenId[_serialNumber] != 0) revert SerialNumberAlreadyExists();
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        // Create asset
        assets[tokenId] = Asset({
            tokenId: tokenId,
            assetType: _assetType,
            serialNumber: _serialNumber,
            model: _model,
            manufacturer: _manufacturer,
            value: _value,
            purchaseDate: _purchaseDate,
            lastMaintenance: 0,
            isActive: true,
            metadataURI: _metadataURI
        });
        
        // Update mappings
        serialNumberToTokenId[_serialNumber] = tokenId;
        ownerAssets[_to].push(tokenId);
        
        // Mint NFT
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _metadataURI);
        
        emit AssetMinted(tokenId, _to, _assetType, _value);
    }
    
    /**
     * @dev Transfer asset to new owner
     * @param _tokenId Token ID of the asset
     * @param _to New owner address
     */
    function transferAsset(uint256 _tokenId, address _to) 
        external 
        onlyAssetOwner(_tokenId) 
        nonReentrant 
    {
        if (_to == address(0)) revert InvalidRecipientAddress();
        if (!assets[_tokenId].isActive) revert AssetIsNotActive();
        
        address from = ownerOf(_tokenId);
        
        // Update owner assets mapping
        _removeFromOwnerAssets(from, _tokenId);
        ownerAssets[_to].push(_tokenId);
        
        // Transfer NFT
        _transfer(from, _to, _tokenId);
        
        emit AssetTransferred(_tokenId, from, _to);
    }
    
    /**
     * @dev Record maintenance for an asset
     * @param _tokenId Token ID of the asset
     * @param _description Maintenance description
     * @param _cost Maintenance cost
     * @param _performedBy Who performed the maintenance
     * @param _location Where maintenance was performed
     */
    function recordMaintenance(
        uint256 _tokenId,
        string memory _description,
        uint256 _cost,
        string memory _performedBy,
        string memory _location
    ) external onlyAssetOwner(_tokenId) {
        if (!_exists(_tokenId)) revert AssetDoesNotExist();
        if (!assets[_tokenId].isActive) revert AssetIsNotActive();
        
        MaintenanceRecord memory record = MaintenanceRecord({
            timestamp: block.timestamp,
            description: _description,
            cost: _cost,
            performedBy: _performedBy,
            location: _location
        });
        
        maintenanceHistory[_tokenId].push(record);
        assets[_tokenId].lastMaintenance = block.timestamp;
        
        emit MaintenanceRecorded(_tokenId, block.timestamp, _description);
    }
    
    /**
     * @dev Update asset value
     * @param _tokenId Token ID of the asset
     * @param _newValue New value of the asset
     */
    function updateAssetValue(uint256 _tokenId, uint256 _newValue) 
        external 
        onlyAssetOwner(_tokenId) 
    {
        if (!_exists(_tokenId)) revert AssetDoesNotExist();
        if (_newValue == 0) revert AssetValueMustBeGreaterThanZero();
        
        uint256 oldValue = assets[_tokenId].value;
        assets[_tokenId].value = _newValue;
        
        emit AssetValueUpdated(_tokenId, oldValue, _newValue);
    }
    
    /**
     * @dev Retire an asset
     * @param _tokenId Token ID of the asset
     * @param _reason Reason for retirement
     */
    function retireAsset(uint256 _tokenId, string calldata _reason) 
        external 
        onlyAssetOwner(_tokenId) 
    {
        if (!_exists(_tokenId)) revert AssetDoesNotExist();
        if (!assets[_tokenId].isActive) revert AssetAlreadyRetired();
        
        assets[_tokenId].isActive = false;
        
        emit AssetRetired(_tokenId, _reason);
    }
    
    /**
     * @dev Get asset details
     * @param _tokenId Token ID of the asset
     * @return Asset struct
     */
    function getAsset(uint256 _tokenId) external view returns (Asset memory) {
        if (!_exists(_tokenId)) revert AssetDoesNotExist();
        return assets[_tokenId];
    }
    
    /**
     * @dev Get maintenance history for an asset
     * @param _tokenId Token ID of the asset
     * @return Array of maintenance records
     */
    function getMaintenanceHistory(uint256 _tokenId) 
        external 
        view 
        returns (MaintenanceRecord[] memory) 
    {
        if (!_exists(_tokenId)) revert AssetDoesNotExist();
        return maintenanceHistory[_tokenId];
    }
    
    /**
     * @dev Get assets owned by an address
     * @param _owner Owner address
     * @return Array of token IDs
     */
    function getOwnerAssets(address _owner) external view returns (uint256[] memory) {
        return ownerAssets[_owner];
    }
    
    /**
     * @dev Get asset by serial number
     * @param _serialNumber Serial number
     * @return Token ID
     */
    function getAssetBySerialNumber(string calldata _serialNumber) 
        external 
        view 
        returns (uint256) 
    {
        return serialNumberToTokenId[_serialNumber];
    }
    
    /**
     * @dev Add new asset type (only owner)
     * @param _assetType New asset type
     */
    function addAssetType(string calldata _assetType) external onlyOwner {
        validAssetTypes[_assetType] = true;
    }
    
    /**
     * @dev Remove asset type (only owner)
     * @param _assetType Asset type to remove
     */
    function removeAssetType(string calldata _assetType) external onlyOwner {
        validAssetTypes[_assetType] = false;
    }
    
    /**
     * @dev Get total number of assets
     * @return Total count
     */
    function getTotalAssets() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Get active assets count
     * @return Active assets count
     */
    function getActiveAssetsCount() external view returns (uint256) {
        uint256 count = 0;
        uint256 totalAssets = _tokenIdCounter.current(); // Cache storage read
        for (uint256 i = 1; i <= totalAssets;) {
            if (assets[i].isActive) {
                count++;
            }
            unchecked {
                i++;
            }
        }
        return count;
    }
    
    /**
     * @dev Get total value of all assets
     * @return Total value
     */
    function getTotalAssetsValue() external view returns (uint256) {
        uint256 totalValue = 0;
        uint256 totalAssets = _tokenIdCounter.current(); // Cache storage read
        for (uint256 i = 1; i <= totalAssets;) {
            Asset storage asset = assets[i]; // Cache storage read
            if (asset.isActive) {
                totalValue += asset.value;
            }
            unchecked {
                i++;
            }
        }
        return totalValue;
    }
    
    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    // Helper function to remove from owner assets array
    function _removeFromOwnerAssets(address _owner, uint256 _tokenId) internal {
        uint256[] storage _ownerAssets = ownerAssets[_owner];
        uint256 length = _ownerAssets.length; // Cache array length
        for (uint256 i = 0; i < length;) {
            if (_ownerAssets[i] == _tokenId) {
                _ownerAssets[i] = _ownerAssets[length - 1];
                _ownerAssets.pop();
                break;
            }
            unchecked {
                i++;
            }
        }
    }
}
