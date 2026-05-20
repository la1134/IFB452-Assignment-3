// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Escrow.sol"; // Note: Verified your file name from previous step

contract EscrowFactory {
    address[] public allEscrows;

    event EscrowCreated(address indexed escrowAddress, address indexed creator, string title);

    /**
     * @notice Deploys a new EscrowContract on behalf of the user and records its address.
     * @param _fundingGoal    Target amount in wei the project must reach
     * @param _deadline       The absolute Unix timestamp for the deadline
     */
    function createEscrow(
        uint256 _fundingGoal,
        uint256 _deadline,
        string memory _title,
        string memory _ownerName,
        string memory _description
    ) external returns (address) {
        // Correctly forwards parameters to the updated child constructor
        EscrowContract newEscrow = new EscrowContract(
            _fundingGoal,
            _deadline, // Forwards absolute timestamp
            _title,
            _ownerName,
            _description,
            msg.sender
        );

        address escrowAddr = address(newEscrow);
        allEscrows.push(escrowAddr);

        emit EscrowCreated(escrowAddr, msg.sender, _title);
        return escrowAddr;
    }

    /**
     * @notice Returns the entire array of deployed project addresses.
     */
    function getAllEscrows() external view returns (address[] memory) {
        return allEscrows;
    }
}