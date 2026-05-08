// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Escrow.sol";

contract MilestoneContract {

    // ─── Milestone Round Struct ────────────────────────────────────────
    struct MilestoneRound {
        uint256 goal;
        uint256 deadline;
        uint256 totalContributed;
        bool withdrawn;
        mapping(address => uint256) contributions;
    }

    // ─── State Variables ───────────────────────────────────────────────
    address public creator;
    EscrowContract public escrow;

    uint256 public roundCount;
    mapping(uint256 => MilestoneRound) public rounds; // roundId → MilestoneRound

    // ─── Events ────────────────────────────────────────────────────────
    event RoundCreated(uint256 indexed roundId, uint256 goal, uint256 deadline);
    event Contributed(uint256 indexed roundId, address indexed backer, uint256 amount);
    event Withdrawn(uint256 indexed roundId, address indexed creator, uint256 amount);
    event Refunded(uint256 indexed roundId, address indexed backer, uint256 amount);

    // ─── Constructor ───────────────────────────────────────────────────
    /**
     * @param _escrowAddress Address of the original EscrowContract
     *
     * Requirements:
     *  - Caller must be the same creator who deployed the EscrowContract
     *  - The EscrowContract deadline must have already passed
     *  - The EscrowContract must have been successfully funded and withdrawn
     */
    constructor(address _escrowAddress) {
        EscrowContract _escrow = EscrowContract(_escrowAddress);

        require(
            msg.sender == _escrow.creator(),
            "Only the escrow creator can deploy milestone contract"
        );
        require(
            block.timestamp >= _escrow.deadline(),
            "Escrow deadline has not passed yet"
        );
        require(
            _escrow.withdrawn(),
            "Escrow was not successfully funded and withdrawn"
        );

        creator   = msg.sender;
        escrow    = _escrow;
        roundCount = 0;
    }

    // ─── Modifiers ─────────────────────────────────────────────────────
    modifier onlyCreator() {
        require(msg.sender == creator, "Only the creator can call this");
        _;
    }

    modifier validRound(uint256 _roundId) {
        require(_roundId > 0 && _roundId <= roundCount, "Invalid round ID");
        _;
    }

    // ─── Create New Milestone Round ────────────────────────────────────
    /**
     * @notice Creator opens a new milestone funding round.
     * @param _goal         Target amount in wei for this round
     * @param _durationDays Number of days this round stays open
     *
     * Rules:
     *  - Only creator can open a new round
     *  - Previous round must be closed (withdrawn or deadline passed)
     *    before a new round can be created
     */
    function createRound(
        uint256 _goal,
        uint256 _durationDays
    ) external onlyCreator {
        require(_goal > 0,         "Goal must be greater than zero");
        require(_durationDays > 0, "Duration must be at least 1 day");

        // Previous round must be completed before opening a new one
        if (roundCount > 0) {
            MilestoneRound storage prev = rounds[roundCount];
            bool prevWithdrawn = prev.withdrawn;
            bool prevDeadlinePassed = block.timestamp >= prev.deadline;
            require(
                prevWithdrawn || prevDeadlinePassed,
                "Previous round is still active"
            );
        }

        roundCount++;
        MilestoneRound storage round = rounds[roundCount];
        round.goal     = _goal;
        round.deadline = block.timestamp + (_durationDays * 1 days);
        round.withdrawn = false;
        round.totalContributed = 0;

        emit RoundCreated(roundCount, _goal, round.deadline);
    }

    // ─── Contribute to a Round ─────────────────────────────────────────
    /**
     * @notice Backers contribute Ether to a specific milestone round.
     * @param _roundId The round to contribute to
     */
    function contribute(uint256 _roundId) external payable validRound(_roundId) {
        MilestoneRound storage round = rounds[_roundId];

        require(block.timestamp < round.deadline, "Round deadline has passed");
        require(msg.value > 0,                    "Contribution must be greater than zero");
        require(!round.withdrawn,                 "Round already completed");

        round.contributions[msg.sender] += msg.value;
        round.totalContributed += msg.value;

        emit Contributed(_roundId, msg.sender, msg.value);
    }

    // ─── Get Round Balance ─────────────────────────────────────────────
    /**
     * @notice Returns total Ether contributed to a specific round.
     * @param _roundId The round to check
     */
    function getRoundBalance(uint256 _roundId)
        external
        view
        validRound(_roundId)
        returns (uint256)
    {
        return rounds[_roundId].totalContributed;
    }

    // ─── Get Round Info ────────────────────────────────────────────────
    /**
     * @notice Returns key details about a specific round.
     * @param _roundId The round to query
     */
    function getRoundInfo(uint256 _roundId)
        external
        view
        validRound(_roundId)
        returns (
            uint256 goal,
            uint256 deadline,
            uint256 totalContributed,
            bool withdrawn,
            bool goalReached,
            uint256 timeRemaining
        )
    {
        MilestoneRound storage round = rounds[_roundId];
        return (
            round.goal,
            round.deadline,
            round.totalContributed,
            round.withdrawn,
            round.totalContributed >= round.goal,
            block.timestamp >= round.deadline ? 0 : round.deadline - block.timestamp
        );
    }

    // ─── Withdraw Round Funds ──────────────────────────────────────────
    /**
     * @notice Creator withdraws funds from a completed round.
     * @param _roundId The round to withdraw from
     *
     * Requirements:
     *  - Caller is the creator
     *  - Round goal has been reached
     *  - Round has not already been withdrawn
     *  - Original escrow was successfully funded
     */
    function withdraw(uint256 _roundId)
        external
        onlyCreator
        validRound(_roundId)
    {
        MilestoneRound storage round = rounds[_roundId];

        require(!round.withdrawn,                          "Round already withdrawn");
        require(round.totalContributed >= round.goal,      "Round goal not reached");
        require(escrow.withdrawn(),                        "Initial escrow was not funded");

        round.withdrawn = true;
        uint256 amount = round.totalContributed;

        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit Withdrawn(_roundId, creator, amount);
    }

    // ─── Refund from a Round ───────────────────────────────────────────
    /**
     * @notice Backers reclaim their contribution from a failed round.
     * @param _roundId The round to refund from
     *
     * Requirements:
     *  - Round deadline has passed
     *  - Round goal was NOT met
     *  - Caller has a contribution balance above zero in that round
     */
    function refund(uint256 _roundId)
        external
        validRound(_roundId)
    {
        MilestoneRound storage round = rounds[_roundId];

        require(block.timestamp >= round.deadline,         "Round deadline has not passed");
        require(round.totalContributed < round.goal,       "Round goal was met, no refunds");
        require(round.contributions[msg.sender] > 0,       "No contribution to refund");

        uint256 amount = round.contributions[msg.sender];
        round.contributions[msg.sender] = 0; // zero BEFORE transfer (re-entrancy guard)
        round.totalContributed -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit Refunded(_roundId, msg.sender, amount);
    }

    // ─── Helper: Get backer contribution for a round ───────────────────
    function getContribution(uint256 _roundId, address _backer)
        external
        view
        validRound(_roundId)
        returns (uint256)
    {
        return rounds[_roundId].contributions[_backer];
    }
}