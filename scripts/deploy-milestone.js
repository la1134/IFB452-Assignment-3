const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MilestoneContract with account:", deployer.address);

  // ── PASTE THE DYNAMIC ESCROW INSTANCE ADDRESS RETURNED BY YOUR FACTORY HERE ──
  const ESCROW_ADDRESS = "0xYourEscrowInstanceAddressFromFactory";

  if (ESCROW_ADDRESS === "0xYourEscrowInstanceAddressFromFactory") {
    console.error("\n❌ Error: Please update ESCROW_ADDRESS with a real address from your factory deployment first.");
    process.exit(1);
  }

  // Example parameters for this specific milestone round
  const milestoneGoalWei = ethers.parseEther("0.5");
  const durationDays = 14;

  const MilestoneContract = await ethers.getContractFactory("MilestoneContract");
  
  console.log(`\n🚀 Deploying MilestoneContract linked to factory instance: ${ESCROW_ADDRESS}...`);
  
  // Deploying with the 3 required constructor arguments
  const milestone = await MilestoneContract.deploy(
    ESCROW_ADDRESS,
    milestoneGoalWei,
    durationDays
  );
  await milestone.waitForDeployment();

  const milestoneAddress = await milestone.getAddress();
  console.log("\n✅ MilestoneContract deployed successfully!");
  console.log("──────────────────────────────────────────────────");
  console.log("Milestone Contract Address: ", milestoneAddress);
  console.log("Linked Parent Escrow:        ", ESCROW_ADDRESS);
  console.log("Milestone Target Goal:      ", ethers.formatEther(milestoneGoalWei), "ETH");
  console.log("Milestone Timeline Grace:    ", durationDays, "days");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});