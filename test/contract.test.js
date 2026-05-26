const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// ─── EscrowContract Tests ──────────────────────────────────────────────────
describe("EscrowContract", function () {

  let escrow, creator, backer1, backer2;

  const GOAL = ethers.parseEther("1.0");

  beforeEach(async () => {

    [creator, backer1, backer2] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("EscrowContract");

    const latestBlock = await ethers.provider.getBlock("latest");

    const deadline =
      latestBlock.timestamp + (30 * 24 * 60 * 60);

    escrow = await Escrow.connect(creator).deploy(
      GOAL,
      deadline,
      "Test Project",
      "Sneh",
      "Test Description",
      creator.address
    );

    await escrow.waitForDeployment();

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should deploy with correct goal and creator", async () => {

    expect(await escrow.creator()).to.equal(
      creator.address
    );

    expect(await escrow.fundingGoal()).to.equal(
      GOAL
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should accept contributions", async () => {

    await escrow.connect(backer1).contribute({
      value: ethers.parseEther("0.5")
    });

    expect(await escrow.getBalance()).to.equal(
      ethers.parseEther("0.5")
    );

    expect(
      await escrow.contributions(backer1.address)
    ).to.equal(
      ethers.parseEther("0.5")
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject contributions after deadline", async () => {

    await time.increase(31 * 24 * 60 * 60);

    await expect(
      escrow.connect(backer1).contribute({
        value: ethers.parseEther("0.5")
      })
    ).to.be.revertedWith(
      "Funding deadline has passed"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should allow creator to withdraw when goal is met", async () => {

    await escrow.connect(backer1).contribute({
      value: GOAL
    });

    await time.increase(31 * 24 * 60 * 60);

    await escrow.connect(creator).withdraw();

    expect(await escrow.withdrawn()).to.equal(true);

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject withdrawal if goal not reached", async () => {

    await escrow.connect(backer1).contribute({
      value: ethers.parseEther("0.5")
    });

    await time.increase(31 * 24 * 60 * 60);

    await expect(
      escrow.connect(creator).withdraw()
    ).to.be.revertedWith(
      "Funding goal not reached"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject withdrawal from non-creator", async () => {

    await escrow.connect(backer1).contribute({
      value: GOAL
    });

    await time.increase(31 * 24 * 60 * 60);

    await expect(
      escrow.connect(backer1).withdraw()
    ).to.be.revertedWith(
      "Only the creator can withdraw"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should refund backers when deadline passes and goal not met", async () => {

    await escrow.connect(backer1).contribute({
      value: ethers.parseEther("0.5")
    });

    await time.increase(31 * 24 * 60 * 60);

    const before =
      await ethers.provider.getBalance(
        backer1.address
      );

    const tx = await escrow
      .connect(backer1)
      .refund();

    const receipt = await tx.wait();

    const gasUsed =
      receipt.gasUsed * receipt.gasPrice;

    const after =
      await ethers.provider.getBalance(
        backer1.address
      );

    expect(after + gasUsed).to.be.gt(before);

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject refund before deadline", async () => {

    await escrow.connect(backer1).contribute({
      value: ethers.parseEther("0.5")
    });

    await expect(
      escrow.connect(backer1).refund()
    ).to.be.revertedWith(
      "Deadline has not passed yet"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should return correct project details", async () => {

    const details =
      await escrow.getProjectDetails();

    expect(details[0]).to.equal(
      "Test Project"
    );

    expect(details[1]).to.equal(
      "Sneh"
    );

    expect(details[2]).to.equal(
      "Test Description"
    );

    expect(details[3]).to.equal(
      GOAL
    );

    expect(details[6]).to.equal(
      creator.address
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should return correct time remaining", async () => {

    const remaining =
      await escrow.timeRemaining();

    expect(remaining).to.be.gt(0);

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should show goal reached when funded", async () => {

    await escrow.connect(backer1).contribute({
      value: GOAL
    });

    expect(
      await escrow.goalReached()
    ).to.equal(true);

  });

});

// ─── MilestoneContract Tests ───────────────────────────────────────────────
describe("MilestoneContract", function () {

  let escrow;
  let milestone;

  let creator;
  let backer1;
  let backer2;

  const ESCROW_GOAL =
    ethers.parseEther("1.0");

  beforeEach(async () => {

    [creator, backer1, backer2] =
      await ethers.getSigners();

    // ─── Deploy Escrow ───────────────────────────────────────────────

    const Escrow =
      await ethers.getContractFactory(
        "EscrowContract"
      );

    const latestBlock =
      await ethers.provider.getBlock("latest");

    const deadline =
      latestBlock.timestamp +
      (30 * 24 * 60 * 60);

    escrow =
      await Escrow.connect(creator).deploy(
        ESCROW_GOAL,
        deadline,
        "Milestone Project",
        "Sneh",
        "Milestone Description",
        creator.address
      );

    await escrow.waitForDeployment();

    // ─── Fully fund escrow ───────────────────────────────────────────

    await escrow.connect(backer1).contribute({
      value: ESCROW_GOAL
    });

    // ─── Move beyond escrow deadline ────────────────────────────────

    await time.increase(
      31 * 24 * 60 * 60
    );

    // ─── Withdraw escrow funds ──────────────────────────────────────

    await escrow.connect(creator).withdraw();

    // ─── Deploy milestone contract ──────────────────────────────────

    const Milestone =
      await ethers.getContractFactory(
        "MilestoneContract"
      );

    milestone =
      await Milestone.connect(creator).deploy(
        await escrow.getAddress(),
        creator.address
      );

    await milestone.waitForDeployment();

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should create a new round", async () => {

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.5"),
        14
      );

    const info =
      await milestone.getRoundInfo(1);

    expect(info.goal).to.equal(
      ethers.parseEther("0.5")
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject round creation from non-creator", async () => {

    await expect(
      milestone
        .connect(backer1)
        .createRound(
          ethers.parseEther("0.5"),
          14
        )
    ).to.be.revertedWith(
      "Only the creator can call this"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject new round if previous round still active", async () => {

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.5"),
        14
      );

    await expect(
      milestone
        .connect(creator)
        .createRound(
          ethers.parseEther("0.3"),
          7
        )
    ).to.be.revertedWith(
      "Previous round is still active"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should accept contributions to a round", async () => {

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.5"),
        14
      );

    await milestone
      .connect(backer1)
      .contribute(1, {
        value: ethers.parseEther("0.3")
      });

    expect(
      await milestone.getRoundBalance(1)
    ).to.equal(
      ethers.parseEther("0.3")
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject contributions to invalid round", async () => {

    await expect(
      milestone
        .connect(backer1)
        .contribute(99, {
          value: ethers.parseEther("0.3")
        })
    ).to.be.revertedWith(
      "Invalid round ID"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should allow creator to withdraw completed round", async () => {

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.5"),
        14
      );

    await milestone
      .connect(backer1)
      .contribute(1, {
        value: ethers.parseEther("0.5")
      });

    const before =
      await ethers.provider.getBalance(
        creator.address
      );

    const tx =
      await milestone
        .connect(creator)
        .withdraw(1);

    const receipt =
      await tx.wait();

    const gasUsed =
      receipt.gasUsed *
      receipt.gasPrice;

    const after =
      await ethers.provider.getBalance(
        creator.address
      );

    expect(after + gasUsed).to.be.gt(
      before
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should reject withdraw if round goal not met", async () => {

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.5"),
        14
      );

    await milestone
      .connect(backer1)
      .contribute(1, {
        value: ethers.parseEther("0.2")
      });

    await expect(
      milestone
        .connect(creator)
        .withdraw(1)
    ).to.be.revertedWith(
      "Round goal not reached"
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should refund backers from failed round", async () => {

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.5"),
        14
      );

    await milestone
      .connect(backer1)
      .contribute(1, {
        value: ethers.parseEther("0.2")
      });

    await time.increase(
      15 * 24 * 60 * 60
    );

    const before =
      await ethers.provider.getBalance(
        backer1.address
      );

    const tx =
      await milestone
        .connect(backer1)
        .refund(1);

    const receipt =
      await tx.wait();

    const gasUsed =
      receipt.gasUsed *
      receipt.gasPrice;

    const after =
      await ethers.provider.getBalance(
        backer1.address
      );

    expect(after + gasUsed).to.be.gt(
      before
    );

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should support multiple sequential rounds", async () => {

    // ─── Round 1 ────────────────────────────────────────────────────

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.5"),
        14
      );

    await milestone
      .connect(backer1)
      .contribute(1, {
        value: ethers.parseEther("0.5")
      });

    await milestone
      .connect(creator)
      .withdraw(1);

    expect(
      await milestone.roundCount()
    ).to.equal(1);

    // ─── Round 2 ────────────────────────────────────────────────────

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.3"),
        7
      );

    await milestone
      .connect(backer2)
      .contribute(2, {
        value: ethers.parseEther("0.3")
      });

    await milestone
      .connect(creator)
      .withdraw(2);

    expect(
      await milestone.roundCount()
    ).to.equal(2);

    // ─── Round 3 ────────────────────────────────────────────────────

    await milestone
      .connect(creator)
      .createRound(
        ethers.parseEther("0.2"),
        7
      );

    expect(
      await milestone.roundCount()
    ).to.equal(3);

  });

  // ────────────────────────────────────────────────────────────────────────

  it("Should return correct parent project metadata", async () => {

    const metadata =
      await milestone.getParentProjectMetadata();

    expect(metadata[0]).to.equal(
      "Milestone Project"
    );

    expect(metadata[1]).to.equal(
      "Sneh"
    );

    expect(metadata[2]).to.equal(
      "Milestone Description"
    );

  });

});