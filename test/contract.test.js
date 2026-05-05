const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EscrowContract", function () {
  let escrow, creator, backer1, backer2;
  const GOAL = ethers.parseEther("1.0");
  const DURATION_DAYS = 30;

  beforeEach(async () => {
    [creator, backer1, backer2] = await ethers.getSigners();
    const EscrowContract = await ethers.getContractFactory("EscrowContract");
    escrow = await EscrowContract.connect(creator).deploy(GOAL, DURATION_DAYS);
    await escrow.waitForDeployment();
  });

  // ── Contribution Tests ─────────────────────────────────────────────
  it("Should accept contributions and record them", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") });
    expect(await escrow.contributions(backer1.address)).to.equal(ethers.parseEther("0.5"));
    expect(await escrow.getBalance()).to.equal(ethers.parseEther("0.5"));
  });

  it("Should reject contributions after deadline", async () => {
    await time.increase(31 * 24 * 60 * 60); // fast-forward 31 days
    await expect(
      escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Funding deadline has passed");
  });

  it("Should reject zero contributions", async () => {
    await expect(
      escrow.connect(backer1).contribute({ value: 0 })
    ).to.be.revertedWith("Contribution must be greater than zero");
  });

  // ── Withdraw Tests ─────────────────────────────────────────────────
  it("Should allow creator to withdraw when goal is met", async () => {
    await escrow.connect(backer1).contribute({ value: GOAL });
    const balanceBefore = await ethers.provider.getBalance(creator.address);
    await escrow.connect(creator).withdraw();
    const balanceAfter = await ethers.provider.getBalance(creator.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("Should reject withdrawal if goal not reached", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") });
    await expect(escrow.connect(creator).withdraw()).to.be.revertedWith(
      "Funding goal not reached"
    );
  });

  it("Should reject withdrawal from non-creator", async () => {
    await escrow.connect(backer1).contribute({ value: GOAL });
    await expect(escrow.connect(backer1).withdraw()).to.be.revertedWith(
      "Only the creator can withdraw"
    );
  });

  // ── Refund Tests ───────────────────────────────────────────────────
  it("Should refund backers when deadline passes and goal not met", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.3") });
    await time.increase(31 * 24 * 60 * 60); // fast-forward past deadline

    const balanceBefore = await ethers.provider.getBalance(backer1.address);
    await escrow.connect(backer1).refund();
    const balanceAfter = await ethers.provider.getBalance(backer1.address);

    expect(balanceAfter).to.be.gt(balanceBefore);
    expect(await escrow.contributions(backer1.address)).to.equal(0);
  });

  it("Should reject refund if deadline has not passed", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.3") });
    await expect(escrow.connect(backer1).refund()).to.be.revertedWith(
      "Deadline has not passed yet"
    );
  });

  it("Should reject refund if funding goal was met", async () => {
    await escrow.connect(backer1).contribute({ value: GOAL });
    await time.increase(31 * 24 * 60 * 60);
    await expect(escrow.connect(backer1).refund()).to.be.revertedWith(
      "Funding goal was met — no refunds"
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("MilestoneContract", function () {
  let escrow, milestone, creator, backer1;
  const ESCROW_GOAL = ethers.parseEther("1.0");
  const MILESTONE_GOAL = ethers.parseEther("0.5");
  const ESCROW_DAYS = 30;
  const MILESTONE_DAYS = 14;

  beforeEach(async () => {
    [creator, backer1] = await ethers.getSigners();

    // Deploy and fully fund escrow
    const EscrowContract = await ethers.getContractFactory("EscrowContract");
    escrow = await EscrowContract.connect(creator).deploy(ESCROW_GOAL, ESCROW_DAYS);
    await escrow.waitForDeployment();

    await escrow.connect(backer1).contribute({ value: ESCROW_GOAL });
    await escrow.connect(creator).withdraw(); // mark as withdrawn

    // Fast-forward past escrow deadline
    await time.increase(31 * 24 * 60 * 60);

    // Now deploy MilestoneContract
    const MilestoneContract = await ethers.getContractFactory("MilestoneContract");
    milestone = await MilestoneContract.connect(creator).deploy(
      await escrow.getAddress(),
      MILESTONE_GOAL,
      MILESTONE_DAYS
    );
    await milestone.waitForDeployment();
  });

  it("Should accept contributions to milestone", async () => {
    await milestone.connect(backer1).contribute({ value: ethers.parseEther("0.3") });
    expect(await milestone.getBalance()).to.equal(ethers.parseEther("0.3"));
  });

  it("Should allow creator to withdraw when milestone goal is met", async () => {
    await milestone.connect(backer1).contribute({ value: MILESTONE_GOAL });
    const balanceBefore = await ethers.provider.getBalance(creator.address);
    await milestone.connect(creator).withdraw();
    const balanceAfter = await ethers.provider.getBalance(creator.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("Should refund backers if milestone deadline passes and goal not met", async () => {
    await milestone.connect(backer1).contribute({ value: ethers.parseEther("0.1") });
    await time.increase(15 * 24 * 60 * 60); // past milestone deadline

    const balanceBefore = await ethers.provider.getBalance(backer1.address);
    await milestone.connect(backer1).refund();
    const balanceAfter = await ethers.provider.getBalance(backer1.address);

    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("Should reject deployment if escrow was not withdrawn", async () => {
    // Deploy a new escrow that was NOT funded/withdrawn
    const EscrowContract = await ethers.getContractFactory("EscrowContract");
    const freshEscrow = await EscrowContract.connect(creator).deploy(ESCROW_GOAL, ESCROW_DAYS);
    await freshEscrow.waitForDeployment();
    await time.increase(31 * 24 * 60 * 60);

    const MilestoneContract = await ethers.getContractFactory("MilestoneContract");
    await expect(
      MilestoneContract.connect(creator).deploy(
        await freshEscrow.getAddress(),
        MILESTONE_GOAL,
        MILESTONE_DAYS
      )
    ).to.be.revertedWith("Escrow was not successfully funded and withdrawn");
  });
});
