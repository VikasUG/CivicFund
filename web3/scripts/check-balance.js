const hre = require('hardhat');

async function main() {
  console.log('Checking account balance...');
  
  try {
    const signers = await hre.ethers.getSigners();
    console.log('Available signers:', signers.length);
    
    if (signers.length > 0) {
      const [deployer] = signers;
      console.log('Account address:', deployer.address);
      
      const balance = await deployer.getBalance();
      console.log('Account balance:', hre.ethers.utils.formatEther(balance), 'ETH');
      
      if (balance.eq(0)) {
        console.log(' Account has 0 ETH');
      } else {
        console.log(' Account has ETH');
      }
    } else {
      console.log(' No signers available');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
