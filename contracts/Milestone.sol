// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Escrow.sol";

contract MilestoneContract {
    // ─── State Variables ───────────────────────────────────────────────
    address public creator;
    uint256 public milestoneGoal;   // in wei
    uint256 public deadline;        // unix timestamp

    EscrowContract public escrow;   // reference to the parent escrow

    mapping(address => uint256) public contributions; // backer → amount
    bool public withdrawn = false;

    // ─── Events ────────────────────────────────────────────────────────
    event Contributed(address indexed backer, uint256 amount);
    event Withdrawn(address indexed creator, uint256 amount);
    event Refunded(address indexed backer, uint256 amount);

    // ─── Constructor ───────────────────────────────────────────────────
    /**
     * @param _escrowAddress Address of the original EscrowContract
     * @param _milestoneGoal Target amount in wei for this milestone
     * @param _durationDays  Days from deployment until milestone deadline
     *
     * Requirements:
     *  - Caller must be the same creator who deployed the EscrowContract
     *  - The EscrowContract's deadline must have already passed
     *  - The EscrowContract must have met its funding goal (funds withdrawn)
     */
    constructor(
        address _escrowAddress,
        uint256 _milestoneGoal,
        uint256 _durationDays
    ) {
        require(_milestoneGoal > 0, "Milestone goal must be greater than zero");
        require(_durationDays > 0,  "Duration must be at least 1 day");

        EscrowContract _escrow = EscrowContract(_escrowAddress);

        // Only the original escrow creator can deploy a milestone contract
        require(
            msg.sender == _escrow.creator(),
            "Only the escrow creator can deploy a milestone contract"
        );

        // Escrow deadline must have passed
        require(
            block.timestamp >= _escrow.deadline(),
            "Escrow deadline has not passed yet"
        );

        // Escrow must have successfully funded (creator withdrew funds)
        require(
            _escrow.withdrawn(),
            "Escrow was not successfully funded and withdrawn"
        );

        creator       = msg.sender;
        escrow        = _escrow;
        milestoneGoal = _milestoneGoal;
        deadline      = block.timestamp + (_durationDays * 1 days);
    }

    // ─── Contribute ────────────────────────────────────────────────────
    /**
     * @notice Backers contribute Ether toward this milestone.
     */
    function contribute() external payable {
        require(block.timestamp < deadline, "Milestone deadline has passed");
        require(msg.value > 0,              "Contribution must be greater than zero");

        contributions[msg.sender] += msg.value;

        emit Contributed(msg.sender, msg.value);
    }

    // ─── Contract Balance ──────────────────────────────────────────────
    /**
     * @notice Returns total Ether currently held by this milestone contract.
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Withdraw ──────────────────────────────────────────────────────
    /**
     * @notice Creator withdraws milestone funds if all conditions are met:
     *         - Caller is the creator
     *         - Milestone goal has been reached
     *         - The original escrow was successfully funded and withdrawn
     */
    function withdraw() external {
        require(msg.sender == creator,                  "Only the creator can withdraw");
        require(address(this).balance >= milestoneGoal, "Milestone goal not reached");
        require(escrow.withdrawn(),                     "Initial escrow was not funded");
        require(!withdrawn,                             "Funds already withdrawn");

        withdrawn = true;
        uint256 amount = address(this).balance;

        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit Withdrawn(creator, amount);
    }

    // ─── Refund ────────────────────────────────────────────────────────
    /**
     * @notice Backers reclaim their milestone contribution if:
     *         - The milestone deadline has passed
     *         - The milestone goal was NOT met
     *         - They have a contribution balance above zero
     */
    function refund() external {
        require(block.timestamp >= deadline,            "Milestone deadline has not passed yet");
        require(address(this).balance < milestoneGoal,  "Milestone goal was met, no refunds");
        require(contributions[msg.sender] > 0,          "No contribution to refund");

        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0; // zero BEFORE transfer (re-entrancy guard)

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit Refunded(msg.sender, amount);
    }

    // ─── Helper: Check if milestone goal was reached ───────────────────
    function goalReached() external view returns (bool) {
        return address(this).balance >= milestoneGoal;
    }

    // ─── Helper: Time remaining in seconds ─────────────────────────────
    function timeRemaining() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }
}
