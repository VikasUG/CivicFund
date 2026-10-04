const fs = require('fs');
const path = require('path');

// This script updates the frontend with the latest deployed contract address
async function main() {
  console.log(' Updating frontend contract address...');
  
  try {
    // Read the latest deployment info
    const deploymentsPath = path.join(__dirname, '..', 'deployments', 'localhost', 'CrowdFundingEscrow.json');
    
    if (fs.existsSync(deploymentsPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
      const deployedAddress = deployment.address;
      
      console.log(' Found deployed contract at:', deployedAddress);
      
      // Update frontend .env file
      const clientEnvPath = path.join(__dirname, '..', 'client', '.env');
      const envContent = `VITE_CONTRACT_ADDRESS=${deployedAddress}`;
      fs.writeFileSync(clientEnvPath, envContent);
      console.log(" Frontend .env updated");
      
      // Update context file
      const contextPath = path.join(__dirname, '..', 'client', 'src', 'context', 'index.jsx');
      const contextContent = fs.readFileSync(contextPath, 'utf8');
      
      const updatedContextContent = contextContent.replace(
        /const localhostAddress = '0x[a-fA-F0-9]{40}';/,
        `const localhostAddress = '${deployedAddress}';`
      );
      
      fs.writeFileSync(contextPath, updatedContextContent);
      console.log(" Frontend context updated");
      
      console.log(" Frontend updated successfully!");
    } else {
      console.log(" No deployment found. Please deploy the contract first.");
    }
    
  } catch (error) {
    console.error(' Update failed:', error.message);
  }
}

main();
