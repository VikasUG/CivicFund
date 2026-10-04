const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting deployment...');
  
  try {
    const signers = await hre.ethers.getSigners();
    console.log('Available signers:', signers.length);
    
    if (signers.length === 0) {
      throw new Error('No signers available. Please check your private key configuration.');
    }
    
    const [deployer] = signers;
    console.log('Deploying contracts with account:', deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', hre.ethers.utils.formatEther(balance), 'ETH');

    if (balance.eq(0)) {
      throw new Error('Insufficient balance for deployment. Please add ETH to your account.');
    }

    console.log('Creating contract factory...');
    const crowdFundingFactory = await hre.ethers.getContractFactory("CrowdFundingEscrow");
    
    console.log('Deploying contract...');
    const crowdFunding = await crowdFundingFactory.deploy();

    await crowdFunding.deployed();

    const deployedAddress = crowdFunding.address;
    const txHash = crowdFunding.deployTransaction?.hash || null;

    console.log(" CrowdFundingEscrow deployed to:", deployedAddress);
    console.log("Transaction hash:", txHash);

    const deploymentInfo = {
      address: deployedAddress,
      transactionHash: txHash,
      network: hre.network.name,
      deployedAt: new Date().toISOString(),
    };

    const deploymentInfoPath = path.resolve(__dirname, '..', 'deployment-info.json');
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(' Deployment info saved to:', deploymentInfoPath);
    
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
