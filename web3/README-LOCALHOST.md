# Localhost Testing Guide

## Requirements

- Node.js 18 or later
- npm
- MetaMask for browser-based wallet testing

Install dependencies from the repository root:

```powershell
npm --prefix client install
npm --prefix web3 install
```

## Start the Local App

In a PowerShell terminal at the repository root, start the local Hardhat node and deploy the contract:

```powershell
npm run start:full
```

Keep this terminal open. In a second terminal at the repository root, start the frontend:

```powershell
npm --prefix client run dev
```

Open http://localhost:5173. The startup script writes local deployment settings; those files are ignored by Git.

## Run Contract Tests

From the repository root:

```powershell
npm --prefix web3 exec hardhat -- test
```

## MetaMask Network

- Network name: Hardhat Local
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency symbol: ETH

Use only the test accounts and private keys printed by the local Hardhat node. Never use a real wallet key for local testing.
