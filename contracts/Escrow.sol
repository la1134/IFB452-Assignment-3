// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EscrowContract {
    // ─── State Variables ───────────────────────────────────────────────
    address public creator;
    uint256 public fundingGoal;   // in wei
    uint256 public deadline;      // unix timestamp
    
    // On-chain metadata parameters
    string public title;
    string public ownerName;
    string public description;

    mapping(address => uint256) public contributions; // backer address → amount contributed
    bool public withdrawn = false;

    // ─── Events ────────────────────────────────────────────────────────
    event Contributed(address indexed backer, uint256 amount);
    event Withdrawn(address indexed creator, uint256 amount);
    event Refunded(address indexed backer, uint256 amount);

    // ─── Constructor ───────────────────────────────────────────────────
    /**
     * @param _fundingGoal    Target amount in wei the project must reach
     * @param _deadline       The absolute Unix timestamp for the deadline
     * @param _title          Project Title (Max 50 characters)
     * @param _ownerName      Name of the Project Owner/Creator (Max 40 characters)
     * @param _description    Short project pitch or overview (Max 280 characters)
     */
    constructor(
        uint256 _fundingGoal, 
        uint256 _deadline,
        string memory _title,
        string memory _ownerName,
        string memory _description,
        address _creatorAddress
    ) {
        require(_fundingGoal > 0, "Funding goal must be greater than zero");
        require(_deadline > block.timestamp, "Deadline must be in the future"); // Updated requirement
        require(bytes(_title).length > 0 && bytes(_title).length <= 50, "Title must be 1-50 chars");
        require(bytes(_ownerName).length > 0 && bytes(_ownerName).length <= 40, "Name must be 1-40 chars");
        require(bytes(_description).length > 0 && bytes(_description).length <= 280, "Description must be 1-280 chars");

        creator     = _creatorAddress; 
        fundingGoal = _fundingGoal;
        deadline    = _deadline; // Assigned directly as an absolute timestamp now
        title       = _title;
        ownerName   = _ownerName;
        description = _description;
    }

    // ─── Contribute ────────────────────────────────────────────────────
    function contribute() external payable {
        require(block.timestamp < deadline,  "Funding deadline has passed");
        require(msg.value > 0,               "Contribution must be greater than zero");

        contributions[msg.sender] += msg.value;

        emit Contributed(msg.sender, msg.value);
    }

    // ─── Contract Balance ──────────────────────────────────────────────
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Withdraw ──────────────────────────────────────────────────────
    function withdraw() external {
        require(msg.sender == creator,                  "Only the creator can withdraw");
        require(block.timestamp >= deadline,          "Deadline has not passed yet");
        require(address(this).balance >= fundingGoal,   "Funding goal not reached");
        require(!withdrawn,                             "Funds already withdrawn");

        withdrawn = true;
        uint256 amount = address(this).balance;

        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit Withdrawn(creator, amount);
    }

    // ─── Refund ────────────────────────────────────────────────────────
    function refund() external {
        require(block.timestamp >= deadline,            "Deadline has not passed yet");
        require(address(this).balance < fundingGoal,    "Funding goal was met - no refunds");
        require(contributions[msg.sender] > 0,          "No contribution to refund");

        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0; // Re-entrancy guard

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

    // ─── Get Full Project Information ──────────────────────────
    function getProjectDetails() external view returns (
        string memory _title,
        string memory _ownerName,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _deadline,
        uint256 _balance,
        address _creator
    ) {
        return (title, ownerName, description, fundingGoal, deadline, address(this).balance, creator);
    }
}