const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy the Escrow Factory
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const factory = await EscrowFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✅ EscrowFactory deployed to: ${factoryAddress}`);

  console.log("\n🏭 Creating a new project through the Factory...");

  // 2. SAFE DEADLINE CALCULATION: Set a target 7 days into the future
  const currentBlockTime = Math.floor(Date.now() / 1000); // Current real Unix time
  const targetDeadline = currentBlockTime + (7 * 24 * 60 * 60); // + 7 days in seconds

  const fundingGoal = hre.ethers.parseEther("5.0"); // 5 ETH goal

  // 3. Fire the transaction with correct absolute formatting
  const tx = await factory.createEscrow(
    fundingGoal,
    targetDeadline, // Passed as an absolute timestamp
    "Local Test Campaign",
    "John Doe",
    "Testing crowdfunding deployment functionality via localhost hardhat framework."
  );

  const receipt = await tx.wait();
  console.log("🎉 Successfully created a test escrow project instance!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });