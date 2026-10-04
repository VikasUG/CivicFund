const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

console.log('Private key loaded:', PRIVATE_KEY ? 'Yes' : 'No');

module.exports = {
  defaultNetwork: "localhost",
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      gas: 8000000,
      gasPrice: 20000000000,
      blockGasLimit: 8000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      gas: 8000000,
      gasPrice: 20000000000,
      blockGasLimit: 8000000,
    },
    sepolia: {
      url: "https://sepolia.rpc.thirdweb.com",
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 20000000000,
    },
  },
};
