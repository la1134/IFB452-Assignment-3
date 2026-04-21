# 1. Contracts-
## 1.1 Escrow Crontract: 
The smart contract is initialised with a constructor which sets the funding goal and deadline. It records the address of the person who deployed it. 
- The smart contract’s **contribution function** can be used to contribute Ether to the project. It records the amount of Ether contributed and links it to the person’s address. 
- Using the contract **balance function**, the progress of the project’s funding can be verified. It returns the total amount of Ether currently held by the smart contract. 
- The **withdraw function** can be used to transfer the total balance from the smart contract to the person calling it. They will only be able to withdraw funds if they pass a logic check confirming the total balance is greater than or equal to the funding goal and that their address is the same as the person who deployed the projects smart contract. 
- A **refund function** can be called to transfer money from the smart contract back to a backer. The refund will only occur if a logic check verifies that the deadline has passed, the funding goal was not met, and the person calling it has the address of a backer with a balance above zero.

## 1.2 Milestone Contract: