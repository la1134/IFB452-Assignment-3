// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // ── Deploy EscrowContract ──────────────────────────────────────────
  // Example: funding goal = 1 ETH, duration = 30 days
  const fundingGoalWei = ethers.parseEther("1.0");
  const durationDays = 30;

  const EscrowContract = await ethers.getContractFactory("EscrowContract");
  const escrow = await EscrowContract.deploy(fundingGoalWei, durationDays);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("✅ EscrowContract deployed to:", escrowAddress);
  console.log("   Funding goal:", ethers.formatEther(fundingGoalWei), "ETH");
  console.log("   Duration:", durationDays, "days");

  // ── Note about MilestoneContract ──────────────────────────────────
  // MilestoneContract can ONLY be deployed AFTER:
  //   1. The EscrowContract deadline has passed
  //   2. The EscrowContract funding goal was reached
  //   3. The creator has called escrow.withdraw()
  //
  // To deploy MilestoneContract later, use deploy-milestone.js
  console.log("\n📌 Save this escrow address for the Milestone deployment:");
  console.log("   ESCROW_ADDRESS =", escrowAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
