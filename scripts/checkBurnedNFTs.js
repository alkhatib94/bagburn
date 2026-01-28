const hre = require("hardhat");
const { formatUnits } = require("ethers");

async function main() {
  console.log("Checking burned NFTs status...\n");

  // Contract addresses
  const BAG_BURN_CONTRACT = "0xD53c1D0C340b4A6d375035dbc3fBa3b33C4A9461";
  const BAG_CARDANO_NFT = "0x6aa70c267E7de716116a518BF5203a7eF5Fc5c68";
  const BAG_BASE_NFT = "0x2D22e247eE09Fa27fFee2421A56Fe92D9A2A296C";

  // ERC721 ABI
  const ERC721_ABI = [
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  try {
    const provider = hre.ethers.provider;
    console.log("Connected to network:", hre.network.name);
    console.log("BAGBurn Contract:", BAG_BURN_CONTRACT);
    console.log("\n" + "=".repeat(60) + "\n");

    // Check Cardano NFT
    console.log("📊 BAG Cornucopias (Cardano)");
    console.log("-".repeat(60));
    const cardanoNFT = new hre.ethers.Contract(BAG_CARDANO_NFT, ERC721_ABI, provider);
    
    let cardanoTotalSupply;
    try {
      cardanoTotalSupply = await cardanoNFT.totalSupply();
      console.log(`✅ Total Supply: ${cardanoTotalSupply.toString()}`);
    } catch (error) {
      console.log(`⚠️  Total Supply: Not available (${error.message})`);
      cardanoTotalSupply = null;
    }

    const cardanoBurned = await cardanoNFT.balanceOf(BAG_BURN_CONTRACT);
    console.log(`🔥 Burned (in contract): ${cardanoBurned.toString()}`);

    if (cardanoTotalSupply) {
      const cardanoRemaining = cardanoTotalSupply - cardanoBurned;
      const burnPercentage = (Number(cardanoBurned) / Number(cardanoTotalSupply)) * 100;
      console.log(`📦 Remaining: ${cardanoRemaining.toString()}`);
      console.log(`📈 Burn Progress: ${burnPercentage.toFixed(2)}%`);
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // Check BASE NFT
    console.log("📊 BAG Cornucopias (BASE)");
    console.log("-".repeat(60));
    const baseNFT = new hre.ethers.Contract(BAG_BASE_NFT, ERC721_ABI, provider);
    
    let baseTotalSupply;
    try {
      baseTotalSupply = await baseNFT.totalSupply();
      console.log(`✅ Total Supply: ${baseTotalSupply.toString()}`);
    } catch (error) {
      console.log(`⚠️  Total Supply: Not available (${error.message})`);
      baseTotalSupply = null;
    }

    const baseBurned = await baseNFT.balanceOf(BAG_BURN_CONTRACT);
    console.log(`🔥 Burned (in contract): ${baseBurned.toString()}`);

    if (baseTotalSupply) {
      const baseRemaining = baseTotalSupply - baseBurned;
      const burnPercentage = (Number(baseBurned) / Number(baseTotalSupply)) * 100;
      console.log(`📦 Remaining: ${baseRemaining.toString()}`);
      console.log(`📈 Burn Progress: ${burnPercentage.toFixed(2)}%`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 SUMMARY");
    console.log("=".repeat(60));

    const totalBurned = cardanoBurned + baseBurned;
    console.log(`\n🔥 Total NFTs Burned: ${totalBurned.toString()}`);
    
    if (cardanoTotalSupply && baseTotalSupply) {
      const totalSupply = cardanoTotalSupply + baseTotalSupply;
      const totalRemaining = totalSupply - totalBurned;
      const totalBurnPercentage = (Number(totalBurned) / Number(totalSupply)) * 100;
      console.log(`📦 Total Remaining: ${totalRemaining.toString()}`);
      console.log(`📈 Overall Burn Progress: ${totalBurnPercentage.toFixed(2)}%`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("💡 HOW IT WORKS:");
    console.log("=".repeat(60));
    console.log(`
When an NFT is burned:
1. The NFT is transferred to the BAGBurn contract
2. Total Supply stays the same (NFTs are not deleted)
3. We track burned NFTs by checking balanceOf(BAG_BURN_CONTRACT)
4. Remaining = Total Supply - Burned

View on BaseScan:
- Cardano NFT: https://basescan.org/token/${BAG_CARDANO_NFT}?a=${BAG_BURN_CONTRACT}
- BASE NFT: https://basescan.org/token/${BAG_BASE_NFT}?a=${BAG_BURN_CONTRACT}
- BAGBurn Contract: https://basescan.org/address/${BAG_BURN_CONTRACT}#tokentxns
    `);

  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
