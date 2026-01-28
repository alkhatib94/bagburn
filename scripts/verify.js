const hre = require("hardhat");

async function main() {
  // Get contract address from environment variable
  // Usage: BAG_BURN_ADDRESS=0x... npm run verify:base
  // Or set it in .env file
  const contractAddress = process.env.BAG_BURN_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Please provide contract address:");
    console.error("\nOption 1 - Set in .env file:");
    console.error("  BAG_BURN_ADDRESS=0xD53c1D0C340b4A6d375035dbc3fBa3b33C4A9461");
    console.error("\nOption 2 - Set as environment variable:");
    console.error("  $env:BAG_BURN_ADDRESS='0xD53c1D0C340b4A6d375035dbc3fBa3b33C4A9461'; npm run verify:base");
    console.error("\nOption 3 - Use hardhat directly:");
    console.error("  npx hardhat verify --network base 0xD53c1D0C340b4A6d375035dbc3fBa3b33C4A9461 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
    process.exit(1);
  }

  // USDC address on Base Mainnet
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  console.log("Verifying contract on BaseScan...");
  console.log("Contract Address:", contractAddress);
  console.log("Constructor Arguments:", [USDC_ADDRESS]);
  console.log("Network:", hre.network.name);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [USDC_ADDRESS],
    });
    console.log("\n✅ Contract verified successfully!");
    console.log(`View on BaseScan: https://basescan.org/address/${contractAddress}#code`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
    } else {
      console.error("\n❌ Verification failed:", error.message);
      console.log("\nYou can also verify manually on BaseScan:");
      console.log(`https://basescan.org/address/${contractAddress}#code`);
      console.log("\nConstructor Arguments (ABI-encoded):");
      console.log("USDC_ADDRESS:", USDC_ADDRESS);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
