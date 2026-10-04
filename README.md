# CivicFund

A blockchain-based civic crowdfunding platform for funding public infrastructure and community improvements using Ethereum, smart contracts, and a React frontend.

## Overview

CivicFund allows communities to create campaigns for public works such as pothole repair, playground maintenance, street signage, footpath improvements, and street furniture upgrades. Each campaign is scored and validated using project metadata, and funding is driven by transparent on-chain processes.

This project combines:
- React + Vite frontend
- Solidity smart contracts
- Hardhat local blockchain development
- Ethers.js wallet integration
- MetaMask-based transaction flow

## Features

- Campaign creation with category-based validation
- Score-driven funding caps based on project severity and category
- MetaMask wallet integration
- On-chain funding and campaign tracking
- Local Hardhat development environment
- Deployment and frontend address sync automation

## Tech Stack

- Frontend: React, Vite
- Smart Contracts: Solidity
- Blockchain: Hardhat + Ethereum
- Wallets: MetaMask / Ethers.js
- UI libraries: Tailwind CSS

## Project Structure

```text
CIVICFUND/
├─ client/                  # React frontend
├─ web3/                    # Hardhat + Solidity contracts
├─ .gitignore               # Git ignore rules
├─ package.json             # Root scripts
├─ start-hardhat-with-update.ps1
├─ README.md
├─ TECHNOLOGIES.md
└─ LICENSE
```

## Prerequisites

Before running the project, install:
- Node.js 18+
- npm
- MetaMask browser wallet

## Quick Start

### 1) Install project dependencies

From the project root, install the frontend and contract dependencies:

```bash
npm --prefix client install
npm --prefix web3 install
```

### 2) Start the local blockchain

From the root directory:

```bash
npm run start:full
```

This script will:
- start a local Hardhat node
- deploy the contract locally
- update the frontend contract address automatically
- keep the local blockchain running

### 3) Run the frontend separately

If you only want the frontend:

```bash
cd client
npm run dev
```

Then open:
- http://localhost:5173

## Local Development Notes

The local startup script deploys the contract and updates the frontend configuration. Local environment files are ignored by Git; never put private keys or credentials in tracked files.

For manual configuration, use the example file as a template and save local values in `client/.env.local`:

```powershell
Copy-Item client\.env.example client\.env.local
```

Then set the contract address from your local deployment.

## Smart Contract Workflow

The project includes local contract deployment and UAT-like validation using Hardhat. The root startup script handles the full cycle for local testing without needing a public testnet.

## Build Verification

The frontend is build-tested with:

```bash
cd client
npm run build
```

## Production / GitHub Readiness

Before pushing to GitHub:
- do not commit real env files
- do not commit private keys
- keep secret values in local-only .env files
- use .env.example template files for setup guidance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit with a clear message
5. Open a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Contact

For questions or collaboration, contact the project maintainer through the repository or the project’s configured communication channel.
