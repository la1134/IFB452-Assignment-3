const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy EscrowFactory
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const factory = await EscrowFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✅ EscrowFactory deployed to: ${factoryAddress}`);

  // 2. Deploy MilestoneFactory
  const MilestoneFactory = await hre.ethers.getContractFactory("MilestoneFactory");
  const milestoneFactory = await MilestoneFactory.deploy();
  await milestoneFactory.waitForDeployment();
  const milestoneFactoryAddress = await milestoneFactory.getAddress();
  console.log(`✅ MilestoneFactory deployed to: ${milestoneFactoryAddress}`);

  // 3. Create a test escrow through the factory
  console.log("\n🏭 Creating a new project through the Factory...");
  const currentBlockTime = Math.floor(Date.now() / 1000);
  const targetDeadline = currentBlockTime + (7 * 24 * 60 * 60);
  const fundingGoal = hre.ethers.parseEther("5.0");

  const tx = await factory.createEscrow(
    fundingGoal,
    targetDeadline,
    "Local Test Campaign",
    "John Doe",
    "Testing crowdfunding deployment functionality via localhost hardhat framework."
  );
  await tx.wait();
  console.log("🎉 Successfully created a test escrow project instance!");

  console.log("\n──────────────────────────────────────────────────");
  console.log("Copy these into App.jsx:");
  console.log(`FACTORY_ADDRESS:           "${factoryAddress}"`);
  console.log(`MILESTONE_FACTORY_ADDRESS: "${milestoneFactoryAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });