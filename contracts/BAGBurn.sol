// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BAGBurn
 * @dev Smart contract for burning NFTs in exchange for USDC on Base network
 */
contract BAGBurn is ReentrancyGuard, Ownable {
    // NFT Contract addresses
    address public constant BAG_CARDANO_NFT = 0x6aa70c267E7de716116a518BF5203a7eF5Fc5c68;
    address public constant BAG_BASE_NFT = 0x2D22e247eE09Fa27fFee2421A56Fe92D9A2A296C;
    
    // USDC contract address on Base
    address public usdcToken;
    
    // Burn values in USDC (with 6 decimals for USDC)
    uint256 public constant BURN_VALUE_CARDANO = 10400000; // 10.4 USDC (10.4 * 10^6)
    uint256 public constant BURN_VALUE_BASE = 8000000; // 8 USDC (8 * 10^6)
    
    // Mapping to check if NFT contract is supported
    mapping(address => bool) public supportedNFTContracts;
    
    // Mapping to store burn values for each NFT contract
    mapping(address => uint256) public burnValues;
    
    // Events
    event NFTBurned(
        address indexed user,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 usdcAmount
    );
    
    event MultipleNFTsBurned(
        address indexed user,
        address indexed nftContract,
        uint256[] tokenIds,
        uint256 totalUsdcAmount
    );
    
    event USDCAddressUpdated(address indexed newAddress);
    
    /**
     * @dev Constructor
     * @param _usdcToken Address of USDC token contract on Base
     */
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = _usdcToken;
        
        // Initialize supported NFT contracts
        supportedNFTContracts[BAG_CARDANO_NFT] = true;
        supportedNFTContracts[BAG_BASE_NFT] = true;
        
        // Set burn values
        burnValues[BAG_CARDANO_NFT] = BURN_VALUE_CARDANO;
        burnValues[BAG_BASE_NFT] = BURN_VALUE_BASE;
    }
    
    /**
     * @dev Burn a single NFT and receive USDC
     * @param tokenId The token ID to burn
     * @param nftContract The address of the NFT contract
     */
    function burnNFT(uint256 tokenId, address nftContract) external nonReentrant {
        require(supportedNFTContracts[nftContract], "NFT contract not supported");
        require(nftContract != address(0), "Invalid NFT contract address");
        
        IERC721 nft = IERC721(nftContract);
        
        // Verify ownership
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner of this NFT");
        
        // Get burn value
        uint256 burnValue = burnValues[nftContract];
        require(burnValue > 0, "Burn value not set");
        
        // Verify contract has enough USDC
        IERC20 usdc = IERC20(usdcToken);
        require(usdc.balanceOf(address(this)) >= burnValue, "Insufficient USDC in contract");
        
        // Burn the NFT (transfer to this contract first, then it's effectively burned)
        nft.transferFrom(msg.sender, address(this), tokenId);
        
        // Transfer USDC to user
        require(usdc.transfer(msg.sender, burnValue), "USDC transfer failed");
        
        emit NFTBurned(msg.sender, nftContract, tokenId, burnValue);
    }
    
    /**
     * @dev Burn multiple NFTs and receive USDC
     * @param tokenIds Array of token IDs to burn
     * @param nftContract The address of the NFT contract
     */
    function burnMultipleNFTs(uint256[] calldata tokenIds, address nftContract) external nonReentrant {
        require(supportedNFTContracts[nftContract], "NFT contract not supported");
        require(nftContract != address(0), "Invalid NFT contract address");
        require(tokenIds.length > 0, "No tokens provided");
        
        IERC721 nft = IERC721(nftContract);
        uint256 burnValue = burnValues[nftContract];
        require(burnValue > 0, "Burn value not set");
        
        uint256 totalAmount = burnValue * tokenIds.length;
        
        // Verify contract has enough USDC
        IERC20 usdc = IERC20(usdcToken);
        require(usdc.balanceOf(address(this)) >= totalAmount, "Insufficient USDC in contract");
        
        // Burn all NFTs
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(nft.ownerOf(tokenId) == msg.sender, "Not the owner of this NFT");
            nft.transferFrom(msg.sender, address(this), tokenId);
        }
        
        // Transfer total USDC to user
        require(usdc.transfer(msg.sender, totalAmount), "USDC transfer failed");
        
        emit MultipleNFTsBurned(msg.sender, nftContract, tokenIds, totalAmount);
    }
    
    /**
     * @dev Add or update supported NFT contract (only owner)
     * @param nftContract Address of NFT contract
     * @param burnValue Burn value in USDC (with 6 decimals)
     */
    function setSupportedNFT(address nftContract, uint256 burnValue) external onlyOwner {
        require(nftContract != address(0), "Invalid NFT contract address");
        supportedNFTContracts[nftContract] = true;
        burnValues[nftContract] = burnValue;
    }
    
    /**
     * @dev Remove supported NFT contract (only owner)
     * @param nftContract Address of NFT contract
     */
    function removeSupportedNFT(address nftContract) external onlyOwner {
        supportedNFTContracts[nftContract] = false;
        burnValues[nftContract] = 0;
    }
    
    /**
     * @dev Update USDC token address (only owner)
     * @param _usdcToken New USDC token address
     */
    function setUSDCAddress(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = _usdcToken;
        emit USDCAddressUpdated(_usdcToken);
    }
    
    /**
     * @dev Get burn value for a specific NFT contract
     * @param nftContract Address of NFT contract
     * @return Burn value in USDC (with 6 decimals)
     */
    function getBurnValue(address nftContract) external view returns (uint256) {
        return burnValues[nftContract];
    }
    
    /**
     * @dev Check if NFT contract is supported
     * @param nftContract Address of NFT contract
     * @return True if supported, false otherwise
     */
    function isSupported(address nftContract) external view returns (bool) {
        return supportedNFTContracts[nftContract];
    }
    
    /**
     * @dev Emergency withdraw USDC (only owner)
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawUSDC(uint256 amount) external onlyOwner {
        IERC20 usdc = IERC20(usdcToken);
        require(usdc.transfer(owner(), amount), "USDC transfer failed");
    }
}
