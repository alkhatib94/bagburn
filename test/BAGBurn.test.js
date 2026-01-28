const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BAGBurn", function () {
  let bagBurn;
  let usdcToken;
  let nftCardano;
  let nftBase;
  let owner;
  let user1;
  let user2;
  let MockERC20Factory;
  let MockERC721Factory;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC (6 decimals)
    MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdcToken = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await usdcToken.waitForDeployment();

    // Deploy mock NFTs
    MockERC721Factory = await ethers.getContractFactory("MockERC721");
    nftCardano = await MockERC721Factory.deploy("BAG Cardano", "BAGC");
    await nftCardano.waitForDeployment();
    
    nftBase = await MockERC721Factory.deploy("BAG Base", "BAGB");
    await nftBase.waitForDeployment();

    // Deploy BAGBurn contract
    const BAGBurnFactory = await ethers.getContractFactory("BAGBurn");
    bagBurn = await BAGBurnFactory.deploy(await usdcToken.getAddress());
    await bagBurn.waitForDeployment();

    // Fund contract with USDC
    const contractAddress = await bagBurn.getAddress();
    await usdcToken.mint(contractAddress, ethers.parseUnits("1000000", 6)); // 1M USDC

    // Mint NFTs to users
    await nftCardano.mint(user1.address, 1);
    await nftCardano.mint(user1.address, 2);
    await nftBase.mint(user1.address, 1);
    await nftBase.mint(user2.address, 1);
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await bagBurn.usdcToken()).to.equal(await usdcToken.getAddress());
    });

    it("Should set correct burn values", async function () {
      const cardanoValue = await bagBurn.getBurnValue("0x6aa70c267e7de716116a518bf5203a7ef5fc5c68");
      const baseValue = await bagBurn.getBurnValue("0x2d22e247ee09fa27ffee2421a56fe92d9a2a296c");
      
      // Note: In real tests, you'd use the actual addresses, but for mock testing
      // we'll test with the deployed mock contracts
      expect(await bagBurn.BURN_VALUE_CARDANO()).to.equal(ethers.parseUnits("10.4", 6));
      expect(await bagBurn.BURN_VALUE_BASE()).to.equal(ethers.parseUnits("8", 6));
    });
  });

  describe("Single NFT Burn", function () {
    it("Should burn NFT and transfer USDC", async function () {
      const tokenId = 1;
      const nftAddress = await nftCardano.getAddress();
      
      // Add NFT contract to supported list
      await bagBurn.setSupportedNFT(nftAddress, ethers.parseUnits("10.4", 6));
      
      // Approve NFT transfer
      await nftCardano.connect(user1).approve(await bagBurn.getAddress(), tokenId);
      
      const initialBalance = await usdcToken.balanceOf(user1.address);
      
      // Burn NFT
      await expect(bagBurn.connect(user1).burnNFT(tokenId, nftAddress))
        .to.emit(bagBurn, "NFTBurned")
        .withArgs(user1.address, nftAddress, tokenId, ethers.parseUnits("10.4", 6));
      
      const finalBalance = await usdcToken.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseUnits("10.4", 6));
      
      // Verify NFT is burned (transferred to contract)
      expect(await nftCardano.ownerOf(tokenId)).to.equal(await bagBurn.getAddress());
    });

    it("Should reject burn if user is not owner", async function () {
      const tokenId = 1;
      const nftAddress = await nftCardano.getAddress();
      
      await bagBurn.setSupportedNFT(nftAddress, ethers.parseUnits("10.4", 6));
      
      await expect(
        bagBurn.connect(user2).burnNFT(tokenId, nftAddress)
      ).to.be.revertedWith("Not the owner of this NFT");
    });

    it("Should reject burn if NFT contract not supported", async function () {
      const tokenId = 1;
      const nftAddress = await nftCardano.getAddress();
      
      await expect(
        bagBurn.connect(user1).burnNFT(tokenId, nftAddress)
      ).to.be.revertedWith("NFT contract not supported");
    });
  });

  describe("Multiple NFTs Burn", function () {
    it("Should burn multiple NFTs and transfer total USDC", async function () {
      const tokenIds = [1, 2];
      const nftAddress = await nftCardano.getAddress();
      
      await bagBurn.setSupportedNFT(nftAddress, ethers.parseUnits("10.4", 6));
      
      // Approve NFTs
      await nftCardano.connect(user1).setApprovalForAll(await bagBurn.getAddress(), true);
      
      const initialBalance = await usdcToken.balanceOf(user1.address);
      const expectedAmount = ethers.parseUnits("20.8", 6); // 10.4 * 2
      
      await expect(bagBurn.connect(user1).burnMultipleNFTs(tokenIds, nftAddress))
        .to.emit(bagBurn, "MultipleNFTsBurned")
        .withArgs(user1.address, nftAddress, tokenIds, expectedAmount);
      
      const finalBalance = await usdcToken.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(expectedAmount);
    });

    it("Should reject if contract has insufficient USDC", async function () {
      const tokenIds = [1];
      const nftAddress = await nftCardano.getAddress();
      
      // Set very high burn value
      await bagBurn.setSupportedNFT(nftAddress, ethers.parseUnits("10000000", 6));
      
      await nftCardano.connect(user1).approve(await bagBurn.getAddress(), 1);
      
      await expect(
        bagBurn.connect(user1).burnNFT(1, nftAddress)
      ).to.be.revertedWith("Insufficient USDC in contract");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to add supported NFT", async function () {
      const nftAddress = await nftCardano.getAddress();
      const burnValue = ethers.parseUnits("5", 6);
      
      await bagBurn.setSupportedNFT(nftAddress, burnValue);
      expect(await bagBurn.isSupported(nftAddress)).to.be.true;
      expect(await bagBurn.getBurnValue(nftAddress)).to.equal(burnValue);
    });

    it("Should allow owner to remove supported NFT", async function () {
      const nftAddress = await nftCardano.getAddress();
      await bagBurn.setSupportedNFT(nftAddress, ethers.parseUnits("5", 6));
      
      await bagBurn.removeSupportedNFT(nftAddress);
      expect(await bagBurn.isSupported(nftAddress)).to.be.false;
    });

    it("Should allow owner to update USDC address", async function () {
      const newUSDC = await MockERC20Factory.deploy("New USDC", "USDC2", 6);
      await newUSDC.waitForDeployment();
      
      await expect(bagBurn.setUSDCAddress(await newUSDC.getAddress()))
        .to.emit(bagBurn, "USDCAddressUpdated")
        .withArgs(await newUSDC.getAddress());
    });

    it("Should reject non-owner from calling owner functions", async function () {
      await expect(
        bagBurn.connect(user1).setSupportedNFT(await nftCardano.getAddress(), 1000000)
      ).to.be.revertedWithCustomError(bagBurn, "OwnableUnauthorizedAccount");
    });
  });
});
