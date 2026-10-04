const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(' Starting Automated Localhost Testing Setup...\n');

// Function to execute commands
function executeCommand(command, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(` ${description}...`);
    const process = exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(` Error: ${error.message}`);
        reject(error);
      } else {
        console.log(` ${description} completed`);
        resolve(stdout);
      }
    });
  });
}

// Function to check if process is running
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

// Main setup function
async function setupLocalhostTesting() {
  try {
    const web3Path = path.resolve(__dirname, '..');
    const clientPath = path.resolve(__dirname, '..', '..', 'client');
    
    // Step 1: Check if Hardhat node is already running
    console.log(' Checking if Hardhat node is already running...');
    
    try {
      const response = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
      });
      
      if (response.ok) {
        console.log(' Hardhat node is already running on localhost:8545');
      } else {
        throw new Error('Node not responding');
      }
    } catch (error) {
      console.log(' Starting Hardhat node...');
      
      // Start Hardhat node in background
      const hardhatProcess = exec('npx hardhat node', { cwd: web3Path });
      
      // Wait for node to start
      console.log(' Waiting for Hardhat node to start...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify node is running
      let nodeStarted = false;
      for (let i = 0; i < 10; i++) {
        try {
          const response = await fetch('http://localhost:8545', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
          });
          
          if (response.ok) {
            nodeStarted = true;
            break;
          }
        } catch (e) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!nodeStarted) {
        throw new Error('Failed to start Hardhat node');
      }
      
      console.log(' Hardhat node started successfully');
    }
    
    // Step 2: Deploy contract
    console.log('\n Deploying smart contract...');
    const deployResult = await executeCommand(
      'npx hardhat run scripts/deploy.js --network localhost',
      web3Path,
      'Contract deployment'
    );
    
    // Extract contract address from deployment output
    const contractAddressMatch = deployResult.match(/CrowdFunding deployed to: (0x[a-fA-F0-9]{40})/);
    if (!contractAddressMatch) {
      throw new Error('Could not extract contract address from deployment');
    }
    
    const contractAddress = contractAddressMatch[1];
    console.log(` Contract deployed to: ${contractAddress}`);
    
    // Step 3: Update frontend configuration
    console.log('\n Updating frontend configuration...');
    
    // Update context file with contract address
    const contextPath = path.join(clientPath, 'src', 'context', 'index.jsx');
    let contextContent = fs.readFileSync(contextPath, 'utf8');
    
    // Update contract address
    contextContent = contextContent.replace(
      /const contract = useContract\('0x[a-fA-F0-9]{40}'\);/,
      `const contract = useContract('${contractAddress}');`
    );
    
    fs.writeFileSync(contextPath, contextContent);
    console.log(' Frontend configuration updated');
    
    // Step 4: Create environment file for frontend
    const envPath = path.join(clientPath, '.env.local');
    const envContent = `
VITE_CONTRACT_ADDRESS=${contractAddress}
VITE_RPC_URL=http://localhost:8545
VITE_CHAIN_ID=31337
VITE_NETWORK_NAME=localhost
`;
    
    fs.writeFileSync(envPath, envContent.trim());
    console.log(' Environment file created');
    
    // Step 5: Start frontend development server
    console.log('\n Starting frontend development server...');
    
    const frontendProcess = exec('npm run dev', { cwd: clientPath });
    
    frontendProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    frontendProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    // Step 6: Display testing instructions
    setTimeout(() => {
      console.log('\n Localhost Testing Environment Ready!');
      console.log('\n Testing Instructions:');
      console.log('1. Open browser and navigate to: http://localhost:5173');
      console.log('2. Connect MetaMask to Hardhat network:');
      console.log('   - Network Name: Hardhat Local');
      console.log('   - RPC URL: http://localhost:8545');
      console.log('   - Chain ID: 31337');
      console.log('   - Symbol: ETH');
      console.log('3. Import test accounts from Hardhat node output');
      console.log('4. Test complete user flow:');
      console.log('   - Connect wallet');
      console.log('   - Select user type (User/Contractor)');
      console.log('   - Create campaign with YOLO validation');
      console.log('   - Test donation system');
      console.log('   - Test contractor acceptance');
      console.log('   - Test progress submission');
      console.log('\n Contract Address:', contractAddress);
      console.log(' Frontend URL: http://localhost:5173');
      console.log(' RPC URL: http://localhost:8545');
      console.log('\n Press Ctrl+C to stop the servers');
    }, 3000);
    
  } catch (error) {
    console.error(' Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n Shutting down localhost testing environment...');
  process.exit(0);
});

// Run setup
setupLocalhostTesting();
