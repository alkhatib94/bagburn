const hre = require("hardhat");

async function main() {
  console.log("Deploying BAGBurn contract...");

  // USDC address on Base Mainnet
  // Update this if deploying to a different network
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy BAGBurn contract
  const BAGBurn = await hre.ethers.getContractFactory("BAGBurn");
  const bagBurn = await BAGBurn.deploy(USDC_ADDRESS);

  await bagBurn.waitForDeployment();
  const contractAddress = await bagBurn.getAddress();

  console.log("BAGBurn deployed to:", contractAddress);
  console.log("USDC Token Address:", USDC_ADDRESS);
  console.log("\nSupported NFT Contracts:");
  console.log("BAG Cornucopias (Cardano): 0x6aa70c267e7de716116a518bf5203a7ef5fc5c68");
  console.log("BAG Cornucopias (BASE): 0x2d22e247ee09fa27ffee2421a56fe92d9a2a296c");
  console.log("\nBurn Values:");
  console.log("Cardano NFT: 10.4 USDC");
  console.log("Base NFT: 8 USDC");

  // Verify contract on BaseScan (if on mainnet/testnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await bagBurn.deploymentTransaction().wait(5);

    console.log("Verifying contract on BaseScan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [USDC_ADDRESS],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\nDeployment completed!");
  console.log("\nIMPORTANT: Fund the contract with USDC before users can burn NFTs!");
  console.log(`Contract Address: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
