# CivicFund

Blockchain crowdfunding platform for civic infrastructure projects.

## Overview

CivicFund is a decentralized crowdfunding application built for funding public infrastructure and community improvement projects. It allows users to create campaigns, contribute ETH, and track project progress using blockchain-backed transparency.

This project combines a React frontend with Solidity smart contracts and Hardhat for local Ethereum development.

## Key Features

- Create civic project campaigns
- Score and validate infrastructure categories
- Set funding caps based on category and evaluation score
- Support ETH-based donations
- View campaign details and progress
- Integrate MetaMask and blockchain wallet interaction
- Deploy and test locally with Hardhat

## Tech Stack

- Frontend: React, Vite
- Smart Contracts: Solidity
- Blockchain: Ethereum / Hardhat
- Wallet Integration: MetaMask, Ethers.js
- Styling: Tailwind CSS

## Project Structure

```text
CIVICFUND/
├── client/                 # Frontend application
├── web3/                   # Smart contracts and Hardhat setup
├── .gitignore              # Ignore rules for local secrets and generated files
├── LICENSE                 # MIT license
├── package.json            # Root scripts
├── README.md              # Project documentation
├── start-hardhat-with-update.ps1
└── TECHNOLOGIES.md         # Tech notes and stack reference
```

## Prerequisites

Before running the project, install:

- Node.js 18+
- npm
- MetaMask browser extension

## Installation

From the project root:

```bash
npm install
cd client
npm install
cd ../web3
npm install
```

## Running the App

### Start the full local setup

From the root folder:

```bash
npm run start:full
```

This command starts the local Hardhat node, deploys the contract, and updates the frontend with the latest deployed address.

### Start the frontend only

```bash
cd client
npm run dev
```

Then open the local app in the browser.

## Local Blockchain Setup

The project is designed to run locally with Hardhat. This allows testing without real ETH.

```bash
cd web3
npx hardhat node
```

Then deploy the contract in a second terminal:

```bash
cd web3
npx hardhat run scripts/deploy.js --network localhost
```

## Build Verification

To verify the frontend build:

```bash
cd client
npm run build
```

## Notes

- Keep local environment files out of Git.
- Use .env.example templates where needed.
- Do not commit private keys or real wallet secrets.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a pull request
