const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// ─── EscrowContract Tests ──────────────────────────────────────────────────
describe("EscrowContract", function () {
  let escrow, creator, backer1, backer2;
  const GOAL = ethers.parseEther("1.0");
  const DURATION = 30;

  beforeEach(async () => {
    [creator, backer1, backer2] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("EscrowContract");
    escrow = await Escrow.connect(creator).deploy(GOAL, DURATION);
    await escrow.waitForDeployment();
  });

  it("Should deploy with correct goal and creator", async () => {
    expect(await escrow.creator()).to.equal(creator.address);
    expect(await escrow.fundingGoal()).to.equal(GOAL);
  });

  it("Should accept contributions", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") });
    expect(await escrow.getBalance()).to.equal(ethers.parseEther("0.5"));
    expect(await escrow.contributions(backer1.address)).to.equal(ethers.parseEther("0.5"));
  });

  it("Should reject contributions after deadline", async () => {
    await time.increase(31 * 24 * 60 * 60);
    await expect(
      escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Funding deadline has passed");
  });

  it("Should allow creator to withdraw when goal is met", async () => {
    await escrow.connect(backer1).contribute({ value: GOAL });
    await escrow.connect(creator).withdraw();
    expect(await escrow.withdrawn()).to.equal(true);
  });

  it("Should reject withdrawal if goal not reached", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") });
    await expect(escrow.connect(creator).withdraw())
      .to.be.revertedWith("Funding goal not reached");
  });

  it("Should reject withdrawal from non-creator", async () => {
    await escrow.connect(backer1).contribute({ value: GOAL });
    await expect(escrow.connect(backer1).withdraw())
      .to.be.revertedWith("Only the creator can withdraw");
  });

  it("Should refund backers when deadline passes and goal not met", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") });
    await time.increase(31 * 24 * 60 * 60);
    const before = await ethers.provider.getBalance(backer1.address);
    await escrow.connect(backer1).refund();
    const after = await ethers.provider.getBalance(backer1.address);
    expect(after).to.be.gt(before);
  });

  it("Should reject refund before deadline", async () => {
    await escrow.connect(backer1).contribute({ value: ethers.parseEther("0.5") });
    await expect(escrow.connect(backer1).refund())
      .to.be.revertedWith("Deadline has not passed yet");
  });
});

// ─── MilestoneContract Tests ───────────────────────────────────────────────
describe("MilestoneContract", function () {
  let escrow, milestone, creator, backer1, backer2;
  const ESCROW_GOAL = ethers.parseEther("1.0");

  beforeEach(async () => {
    [creator, backer1, backer2] = await ethers.getSigners();

    // Deploy and fully fund escrow
    const Escrow = await ethers.getContractFactory("EscrowContract");
    escrow = await Escrow.connect(creator).deploy(ESCROW_GOAL, 30);
    await escrow.waitForDeployment();
    await escrow.connect(backer1).contribute({ value: ESCROW_GOAL });
    await escrow.connect(creator).withdraw();

    // Fast forward past escrow deadline
    await time.increase(31 * 24 * 60 * 60);

    // Deploy MilestoneContract
    const Milestone = await ethers.getContractFactory("MilestoneContract");
    milestone = await Milestone.connect(creator).deploy(await escrow.getAddress());
    await milestone.waitForDeployment();
  });

  // ── Round creation ────────────────────────────────────────────────
  it("Should create a new round", async () => {
    await milestone.connect(creator).createRound(ethers.parseEther("0.5"), 14);
    const info = await milestone.getRoundInfo(1);
    expect(info.goal).to.equal(ethers.parseEther("0.5"));
  });

  it("Should reject round creation from non-creator", async () => {
    await expect(
      milestone.connect(backer1).createRound(ethers.parseEther("0.5"), 14)
    ).to.be.revertedWith("Only the creator can call this");
  });

  it("Should reject new round if previous round still active", async () => {
    await milestone.connect(creator).createRound(ethers.parseEther("0.5"), 14);
    await expect(
      milestone.connect(creator).createRound(ethers.parseEther("0.3"), 7)
    ).to.be.revertedWith("Previous round is still active");
  });

  // ── Contributions ─────────────────────────────────────────────────
  it("Should accept contributions to a round", async () => {
    await milestone.connect(creator).createRound(ethers.parseEther("0.5"), 14);
    await milestone.connect(backer1).contribute(1, { value: ethers.parseEther("0.3") });
    expect(await milestone.getRoundBalance(1)).to.equal(ethers.parseEther("0.3"));
  });

  it("Should reject contributions to invalid round", async () => {
    await expect(
      milestone.connect(backer1).contribute(99, { value: ethers.parseEther("0.3") })
    ).to.be.revertedWith("Invalid round ID");
  });

  // ── Withdraw ──────────────────────────────────────────────────────
  it("Should allow creator to withdraw completed round", async () => {
    await milestone.connect(creator).createRound(ethers.parseEther("0.5"), 14);
    await milestone.connect(backer1).contribute(1, { value: ethers.parseEther("0.5") });
    const before = await ethers.provider.getBalance(creator.address);
    await milestone.connect(creator).withdraw(1);
    const after = await ethers.provider.getBalance(creator.address);
    expect(after).to.be.gt(before);
  });

  it("Should reject withdraw if round goal not met", async () => {
    await milestone.connect(creator).createRound(ethers.parseEther("0.5"), 14);
    await milestone.connect(backer1).contribute(1, { value: ethers.parseEther("0.2") });
    await expect(milestone.connect(creator).withdraw(1))
      .to.be.revertedWith("Round goal not reached");
  });

  // ── Refund ────────────────────────────────────────────────────────
  it("Should refund backers from failed round", async () => {
    await milestone.connect(creator).createRound(ethers.parseEther("0.5"), 14);
    await milestone.connect(backer1).contribute(1, { value: ethers.parseEther("0.2") });
    await time.increase(15 * 24 * 60 * 60);
    const before = await ethers.provider.getBalance(backer1.address);
    await milestone.connect(backer1).refund(1);
    const after = await ethers.provider.getBalance(backer1.address);
    expect(after).to.be.gt(before);
  });

  // ── Multiple rounds ───────────────────────────────────────────────
  it("Should support multiple sequential rounds", async () => {
    // Round 1
    await milestone.connect(creator).createRound(ethers.parseEther("0.5"), 14);
    await milestone.connect(backer1).contribute(1, { value: ethers.parseEther("0.5") });
    await milestone.connect(creator).withdraw(1);
    expect(await milestone.roundCount()).to.equal(1);

    // Round 2
    await milestone.connect(creator).createRound(ethers.parseEther("0.3"), 7);
    await milestone.connect(backer2).contribute(2, { value: ethers.parseEther("0.3") });
    await milestone.connect(creator).withdraw(2);
    expect(await milestone.roundCount()).to.equal(2);

    // Round 3
    await milestone.connect(creator).createRound(ethers.parseEther("0.2"), 7);
    expect(await milestone.roundCount()).to.equal(3);
  });
});