const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const signers = await hre.ethers.getSigners();
    if (signers.length === 0) {
      console.log(' No signers available');
      process.exit(1);
    }

    let contractAddress = null;
    const infoPath = path.resolve(__dirname, '..', 'deployment-info.json');
    if (fs.existsSync(infoPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      if (deploymentInfo && /^0x[a-fA-F0-9]{40}$/.test(deploymentInfo.address)) {
        contractAddress = deploymentInfo.address;
      }
    }

    if (!contractAddress) {
      contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    }

    console.log(' Checking contract at:', contractAddress);
    
    const contract = await hre.ethers.getContractAt("CrowdFundingEscrow", contractAddress);
    const campaignCount = await contract.numberOfCampaigns();
    console.log(' Contract is deployed and working');
    console.log(' Contract Address:', contractAddress);
    console.log(' Campaign Count:', campaignCount.toString());
    
    process.exit(0);
  } catch (error) {
    console.log(' Contract not found or not working');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

main();
