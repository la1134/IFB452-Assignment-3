# Ethstarter

A decentralised crowdfunding platform built on Ethereum. Project creators launch campaigns backed by smart contracts — funds are held in escrow and only released when goals are met, giving backers trustless protection.

https://github.com/la1134/IFB452-Assignment-3
---

## Features

- **Create & manage projects** — launch campaigns with a funding goal and deadline
- **Contribute with ETH** — back projects directly from your MetaMask wallet
- **Escrow-protected funds** — contributions are locked in a smart contract until the goal is reached
- **Automatic refunds** — backers can claim a refund if the deadline passes without the goal being met
- **Milestone funding rounds** — creators can open sequential funding rounds via the Milestone contract
- **Wallet authentication** — connect via MetaMask or log in manually with a wallet address and private key
- **Project search** — filter the project grid by title in real time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Blockchain | Ethereum (ethers.js v6) |
| Wallet | MetaMask (EIP-1193) |
| Smart Contracts | Solidity — Escrow & Milestone contracts |
| Local data | JSON Server (REST mock API on port 3001) |

---

## Project Structure

```
src/
├── components/
│   ├── ContributeView.jsx   # Contribution modal
│   ├── EditView.jsx         # Create / edit project form
│   ├── Header.jsx           # Search bar and wallet auth
│   ├── Layout.jsx           # App shell with Header + Outlet
│   ├── LoadingSpinner.jsx   # Shared loading indicator
│   ├── LoginView.jsx        # MetaMask / manual login modal
│   ├── ProjectGrid.jsx      # Main project listing grid
│   ├── ProjectView.jsx      # Project detail modal
│   └── WalletContext.jsx    # Global wallet state (React Context)
├── contracts/
│   ├── EscrowContract.js    # Escrow ABI + deployed address
│   └── MilestoneContract.js # Milestone ABI + deployed address
├── web3.js                  # ethers.js helpers (connect, provider, listeners)
├── App.jsx                  # Route definitions and global handlers
└── main.jsx                 # App entry point
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension
- A local Ethereum node or testnet RPC (e.g. Hardhat, Anvil, or Sepolia)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/ethstarter.git
cd ethstarter

# 2. Install dependencies
npm install

# 3. Start the mock REST API (projects database)
npx json-server --watch db.json --port 3001

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Smart Contract Setup

### Escrow Contract

The `EscrowContract` holds all contributions for a single campaign in escrow.

**Constructor parameters:**

| Parameter | Type | Description |
|---|---|---|
| `_fundingGoal` | `uint256` | Target amount in wei |
| `_durationDays` | `uint256` | Campaign length in days |

**Key functions:**

| Function | Access | Description |
|---|---|---|
| `contribute()` | Payable | Send ETH to the campaign |
| `withdraw()` | Creator only | Withdraw funds after goal is reached and deadline has passed |
| `refund()` | Backers | Claim refund if deadline passed and goal was not reached |
| `getBalance()` | View | Current contract balance |
| `timeRemaining()` | View | Seconds until deadline |
| `goalReached()` | View | Whether the funding goal has been met |

After deploying, paste the contract address into `src/contracts/EscrowContract.js`:

```js
export const ESCROW_ADDRESS = "0xYourDeployedAddress";
```

### Milestone Contract

The `MilestoneContract` enables creators to run sequential funding rounds, each with its own goal and deadline. It references a deployed `EscrowContract`.

**Key functions:**

| Function | Access | Description |
|---|---|---|
| `createRound(goal, durationDays)` | Creator only | Open a new funding round |
| `contribute(roundId)` | Payable | Back a specific round |
| `withdraw(roundId)` | Creator only | Withdraw from a completed round |
| `refund(roundId)` | Backers | Claim refund for a failed round |
| `getRoundInfo(roundId)` | View | Full status of a round |

After deploying, paste the address into `src/contracts/MilestoneContract.js`:

```js
export const MILESTONE_ADDRESS = "0xYourDeployedAddress";
```

---

## Wallet Connection

Ethstarter supports two authentication methods:

**MetaMask** — click *Login* in the header and select *Connect MetaMask Wallet*. The app listens for account and network changes and updates state automatically.

**Manual login** — enter a wallet address and private key directly. Useful for testing with local accounts.

The connected wallet address is stored in `WalletContext` and is accessible throughout the app via the `useWallet()` hook.

---

## Business Rules

| Scenario | Behaviour |
|---|---|
| Deadline not passed | Backers can contribute; no withdrawals or refunds |
| Goal reached + deadline passed | Creator can withdraw funds |
| Deadline passed + goal not met | Backers can claim a refund |
| Connected wallet = creator address | Edit and Withdraw buttons are shown |
| Connected wallet ≠ creator address | Fund and Refund buttons are shown |

---

## Database Schema (JSON Server)

Each project in `db.json` follows this shape:

```json
{
  "id": "1748123456789",
  "title": "My Project",
  "owner": "Alice",
  "creatorAddress": "0xAbc123...",
  "goal": 5,
  "balance": 1.5,
  "deadline": "2025-12-31T00:00:00.000Z",
  "description": "A short description of the project."
}
```

---

## Environment Notes

- The mock API runs on `http://localhost:3001/projects`. Make sure JSON Server is running before starting the frontend.
- Contract addresses default to placeholder values. The app will not interact with the blockchain until real deployed addresses are set in the contract files.
- The app reloads automatically when MetaMask switches networks (`chainChanged` event).

---

## License

MIT