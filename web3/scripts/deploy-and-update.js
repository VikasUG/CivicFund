const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log(' Starting deployment and frontend update...');
  
  try {
    const signers = await hre.ethers.getSigners();
    console.log('Available signers:', signers.length);
    
    if (signers.length === 0) {
      throw new Error('No signers available. Please check your private key configuration.');
    }
    
    const [deployer] = signers;
    console.log('Deploying contracts with account:', deployer.address);
    
    const balance = await deployer.getBalance();
    console.log('Account balance:', hre.ethers.utils.formatEther(balance), 'ETH');

    if (balance.eq(0)) {
      throw new Error('Insufficient balance for deployment. Please add ETH to your account.');
    }

    console.log('Creating contract factory...');
    const crowdFundingFactory = await hre.ethers.getContractFactory("CrowdFundingEscrow");
    
    console.log('Deploying contract...');
    const crowdFunding = await crowdFundingFactory.deploy();

    console.log('Waiting for deployment confirmation...');
    await crowdFunding.deployed();

    const deployedAddress = crowdFunding.address;
    console.log(" CrowdFundingEscrow deployed to:", deployedAddress);
    console.log("Transaction hash:", crowdFunding.deployTransaction.hash);
    
    // Update frontend .env file with new contract address
    const clientEnvPath = path.resolve(__dirname, '..', '..', 'client', '.env');
    const envContent = `VITE_CONTRACT_ADDRESS=${deployedAddress}`;
    
    fs.writeFileSync(clientEnvPath, envContent);
    console.log(" Frontend .env updated with new contract address");

    const deploymentInfoPath = path.resolve(__dirname, '..', 'deployment-info.json');
    const deploymentInfo = {
      address: deployedAddress,
      transactionHash: crowdFunding.deployTransaction.hash,
      network: hre.network.name,
      deployedAt: new Date().toISOString(),
    };
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(' Deployment info saved to:', deploymentInfoPath);
    
    // Also update the context file with new address if it exists
    const contextPath = path.resolve(__dirname, '..', '..', 'client', 'src', 'context', 'index.jsx');
    if (fs.existsSync(contextPath)) {
      const contextContent = fs.readFileSync(contextPath, 'utf8');
      const updatedContextContent = contextContent.replace(
        /const localhostAddress = '0x[a-fA-F0-9]{40}';/,
        `const localhostAddress = '${deployedAddress}';`
      );
      fs.writeFileSync(contextPath, updatedContextContent);
      console.log(" Frontend context updated with new contract address");
    } else {
      console.warn(` Frontend context file not found: ${contextPath}. Skipping context address update.`);
    }
    
    console.log(" Deployment and update complete!");
    console.log(" Contract Address:", deployedAddress);
    console.log(" Frontend updated automatically");
    
  } catch (error) {
    console.error(' Deployment failed:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
