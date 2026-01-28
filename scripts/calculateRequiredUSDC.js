const hre = require("hardhat");
const { formatUnits } = require("ethers");

async function main() {
  console.log("Calculating required USDC for burning Total Supply...\n");

  // NFT Contract addresses
  const BAG_CARDANO_NFT = "0x6aa70c267E7de716116a518BF5203a7eF5Fc5c68";
  const BAG_BASE_NFT = "0x2D22e247eE09Fa27fFee2421A56Fe92D9A2A296C";

  // Burn values (with 6 decimals)
  const BURN_VALUE_CARDANO = 10400000; // 10.4 USDC
  const BURN_VALUE_BASE = 8000000; // 8 USDC

  // ERC721 ABI for totalSupply
  const ERC721_ABI = [
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  try {
    // Connect to Base network
    const provider = hre.ethers.provider;
    console.log("Connected to network:", hre.network.name);

    // Get total supply for Cardano NFT
    const cardanoNFT = new hre.ethers.Contract(BAG_CARDANO_NFT, ERC721_ABI, provider);
    let cardanoSupply;
    try {
      cardanoSupply = await cardanoNFT.totalSupply();
      console.log(`✅ BAG Cornucopias (Cardano) Total Supply: ${cardanoSupply.toString()}`);
    } catch (error) {
      console.log(`⚠️  Could not fetch Cardano NFT totalSupply: ${error.message}`);
      console.log("   (Some NFT contracts don't implement totalSupply)");
      cardanoSupply = null;
    }

    // Get total supply for BASE NFT
    const baseNFT = new hre.ethers.Contract(BAG_BASE_NFT, ERC721_ABI, provider);
    let baseSupply;
    try {
      baseSupply = await baseNFT.totalSupply();
      console.log(`✅ BAG Cornucopias (BASE) Total Supply: ${baseSupply.toString()}`);
    } catch (error) {
      console.log(`⚠️  Could not fetch BASE NFT totalSupply: ${error.message}`);
      console.log("   (Some NFT contracts don't implement totalSupply)");
      baseSupply = null;
    }

    console.log("\n" + "=".repeat(60));
    console.log("CALCULATION RESULTS:");
    console.log("=".repeat(60) + "\n");

    let totalUSDC = 0n;
    let cardanoUSDC = 0n;
    let baseUSDC = 0n;

    if (cardanoSupply) {
      cardanoUSDC = BigInt(cardanoSupply) * BigInt(BURN_VALUE_CARDANO);
      const cardanoUSDCFormatted = formatUnits(cardanoUSDC, 6);
      console.log(`BAG Cornucopias (Cardano):`);
      console.log(`  Total Supply: ${cardanoSupply.toString()}`);
      console.log(`  Burn Value per NFT: ${formatUnits(BURN_VALUE_CARDANO, 6)} USDC`);
      console.log(`  Total Required: ${cardanoUSDCFormatted} USDC`);
      console.log(`  Total Required (raw): ${cardanoUSDC.toString()}\n`);
      totalUSDC += cardanoUSDC;
    } else {
      console.log(`BAG Cornucopias (Cardano):`);
      console.log(`  ⚠️  Total Supply not available - manual calculation needed\n`);
    }

    if (baseSupply) {
      baseUSDC = BigInt(baseSupply) * BigInt(BURN_VALUE_BASE);
      const baseUSDCFormatted = formatUnits(baseUSDC, 6);
      console.log(`BAG Cornucopias (BASE):`);
      console.log(`  Total Supply: ${baseSupply.toString()}`);
      console.log(`  Burn Value per NFT: ${formatUnits(BURN_VALUE_BASE, 6)} USDC`);
      console.log(`  Total Required: ${baseUSDCFormatted} USDC`);
      console.log(`  Total Required (raw): ${baseUSDC.toString()}\n`);
      totalUSDC += baseUSDC;
    } else {
      console.log(`BAG Cornucopias (BASE):`);
      console.log(`  ⚠️  Total Supply not available - manual calculation needed\n`);
    }

    console.log("=".repeat(60));
    console.log("TOTAL REQUIRED USDC:");
    console.log("=".repeat(60));
    
    if (totalUSDC > 0n) {
      const totalUSDCFormatted = formatUnits(totalUSDC, 6);
      console.log(`\n💰 Total USDC Required: ${totalUSDCFormatted} USDC`);
      console.log(`💰 Total USDC Required (raw): ${totalUSDC.toString()}`);
      console.log(`\n📝 Use this amount when transferring USDC to the contract:`);
      console.log(`   ${totalUSDC.toString()}`);
    } else {
      console.log(`\n⚠️  Could not calculate automatically.`);
      console.log(`\n📝 Manual Calculation:`);
      console.log(`   Cardano NFTs: Total Supply × 10.4 USDC`);
      console.log(`   BASE NFTs: Total Supply × 8 USDC`);
      console.log(`   Total = Cardano Total + BASE Total`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("CONTRACT ADDRESS:");
    console.log("=".repeat(60));
    console.log(`BAGBurn Contract: 0xD53c1D0C340b4A6d375035dbc3fBa3b33C4A9461`);
    console.log(`USDC Contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`);
    console.log("\n💡 To transfer USDC to the contract, use:");
    console.log(`   USDC.transfer(0xD53c1D0C340b4A6d375035dbc3fBa3b33C4A9461, ${totalUSDC > 0n ? totalUSDC.toString() : "AMOUNT"})`);

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
