const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Read the compiled contract artifact
    const artifactPath = path.join(__dirname, '../artifacts/contracts/CrowdFunding.sol/CrowdFunding.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Extract ABI
    const abi = artifact.abi;
    
    // Write ABI to a file
    const abiPath = path.join(__dirname, '../CrowdFundingABI.json');
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    
    console.log(' ABI exported successfully to:', abiPath);
    console.log(' ABI contains', abi.length, 'functions');
    
    // Display the ABI
    console.log('\n Contract ABI:');
    console.log(JSON.stringify(abi, null, 2));
    
  } catch (error) {
    console.error(' Error exporting ABI:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
