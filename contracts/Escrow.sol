// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EscrowContract {
    // ─── State Variables ───────────────────────────────────────────────
    address public creator;
    uint256 public fundingGoal;   // in wei
    uint256 public deadline;      // unix timestamp

    mapping(address => uint256) public contributions; // backer address → amount contributed
    bool public withdrawn = false;

    // ─── Events ────────────────────────────────────────────────────────
    event Contributed(address indexed backer, uint256 amount);
    event Withdrawn(address indexed creator, uint256 amount);
    event Refunded(address indexed backer, uint256 amount);

    // ─── Constructor ───────────────────────────────────────────────────
    /**
     * @param _fundingGoal  Target amount in wei the project must reach
     * @param _durationDays Number of days from deployment until deadline
     */
    constructor(uint256 _fundingGoal, uint256 _durationDays) {
        require(_fundingGoal > 0, "Funding goal must be greater than zero");
        require(_durationDays > 0, "Duration must be at least 1 day");

        creator     = msg.sender;
        fundingGoal = _fundingGoal;
        deadline    = block.timestamp + (_durationDays * 1 days);
    }

    // ─── Contribute ────────────────────────────────────────────────────
    /**
     * @notice Backers call this to send Ether to the project.
     *         Records the contribution linked to their address.
     */
    function contribute() external payable {
        require(block.timestamp < deadline,  "Funding deadline has passed");
        require(msg.value > 0,               "Contribution must be greater than zero");

        contributions[msg.sender] += msg.value;

        emit Contributed(msg.sender, msg.value);
    }

    // ─── Contract Balance ──────────────────────────────────────────────
    /**
     * @notice Returns the total Ether currently held by this contract.
     *         Anyone can call this to check funding progress.
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Withdraw ──────────────────────────────────────────────────────
    /**
     * @notice Creator withdraws all funds if the funding goal was met.
     *         Only callable by the creator, and only if goal is reached.
     */
    function withdraw() external {
        require(msg.sender == creator,                  "Only the creator can withdraw");
        require(address(this).balance >= fundingGoal,   "Funding goal not reached");
        require(!withdrawn,                             "Funds already withdrawn");

        withdrawn = true;
        uint256 amount = address(this).balance;

        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit Withdrawn(creator, amount);
    }

    // ─── Refund ────────────────────────────────────────────────────────
    /**
     * @notice Backers call this to reclaim their contribution if:
     *         - The deadline has passed
     *         - The funding goal was NOT met
     *         - They have a contribution balance above zero
     */
    function refund() external {
        require(block.timestamp >= deadline,            "Deadline has not passed yet");
        require(address(this).balance < fundingGoal,    "Funding goal was met, no refunds");
        require(contributions[msg.sender] > 0,          "No contribution to refund");

        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0; // set to zero BEFORE transfer (re-entrancy guard)

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit Refunded(msg.sender, amount);
    }

    // ─── Helper: Check if goal was reached ─────────────────────────────
    function goalReached() external view returns (bool) {
        return address(this).balance >= fundingGoal;
    }

    // ─── Helper: Time remaining in seconds ─────────────────────────────
    function timeRemaining() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }
}
