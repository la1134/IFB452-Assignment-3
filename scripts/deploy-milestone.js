const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MilestoneContract with account:", deployer.address);

  // ── REPLACE THIS with your deployed EscrowContract address ─────────
  const ESCROW_ADDRESS = "0xYourEscrowContractAddressHere";

  // Example: milestone goal = 0.5 ETH, duration = 14 days
  const milestoneGoalWei = ethers.parseEther("0.5");
  const durationDays = 14;

  const MilestoneContract = await ethers.getContractFactory("MilestoneContract");
  const milestone = await MilestoneContract.deploy(
    ESCROW_ADDRESS,
    milestoneGoalWei,
    durationDays
  );
  await milestone.waitForDeployment();

  const milestoneAddress = await milestone.getAddress();
  console.log("✅ MilestoneContract deployed to:", milestoneAddress);
  console.log("   Milestone goal:", ethers.formatEther(milestoneGoalWei), "ETH");
  console.log("   Duration:", durationDays, "days");
  console.log("   Linked to Escrow:", ESCROW_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
