const { ethers } = require("hardhat");

async function main() {
  const [deployer, backer1, backer2] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // ── Deploy EscrowContract ──────────────────────────────────────────
  const fundingGoal = ethers.parseEther("1.0"); // 1 ETH
  const durationDays = 1;                        // 1 day for testing

  const Escrow = await ethers.getContractFactory("EscrowContract");
  const escrow = await Escrow.deploy(fundingGoal, durationDays);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("\n✅ EscrowContract deployed to:", escrowAddress);

  // ── Backer contributes to Escrow ──────────────────────────────────
  console.log("\n📤 Backer contributing 1 ETH to escrow...");
  await escrow.connect(backer1).contribute({ value: ethers.parseEther("1.0") });
  console.log("Balance:", ethers.formatEther(await escrow.getBalance()), "ETH");

  // ── Creator withdraws from Escrow ─────────────────────────────────
  console.log("\n💰 Creator withdrawing from escrow...");
  await escrow.connect(deployer).withdraw();
  console.log("Escrow withdrawn:", await escrow.withdrawn());

  // ── Fast forward time (simulate deadline passing) ──────────────────
  await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // 2 days
  await ethers.provider.send("evm_mine");
  console.log("\n⏩ Time fast-forwarded past escrow deadline");

  // ── Deploy MilestoneContract ───────────────────────────────────────
  const Milestone = await ethers.getContractFactory("MilestoneContract");
  const milestone = await Milestone.deploy(escrowAddress);
  await milestone.waitForDeployment();
  const milestoneAddress = await milestone.getAddress();
  console.log("\n✅ MilestoneContract deployed to:", milestoneAddress);

  // ── Create Round 1 ────────────────────────────────────────────────
  console.log("\n🔵 Creating Milestone Round 1...");
  await milestone.connect(deployer).createRound(ethers.parseEther("0.5"), 1);
  console.log("Round 1 created");

  // ── Backer contributes to Round 1 ─────────────────────────────────
  console.log("\n📤 Backer contributing 0.5 ETH to Round 1...");
  await milestone.connect(backer1).contribute(1, { value: ethers.parseEther("0.5") });
  const round1Balance = await milestone.getRoundBalance(1);
  console.log("Round 1 balance:", ethers.formatEther(round1Balance), "ETH");

  // ── Creator withdraws Round 1 ──────────────────────────────────────
  console.log("\n💰 Creator withdrawing Round 1...");
  await milestone.connect(deployer).withdraw(1);
  console.log("Round 1 withdrawn ✅");

  // ── Create Round 2 ────────────────────────────────────────────────
  console.log("\n🔵 Creating Milestone Round 2...");
  await milestone.connect(deployer).createRound(ethers.parseEther("0.3"), 1);
  console.log("Round 2 created");

  console.log("\n🎉 Full deployment and test complete!");
  console.log("─────────────────────────────────────");
  console.log("EscrowContract:    ", escrowAddress);
  console.log("MilestoneContract: ", milestoneAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});