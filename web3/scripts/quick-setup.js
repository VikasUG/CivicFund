#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(' Quick Localhost Testing Setup\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if Hardhat node is running
async function checkHardhatNode() {
  try {
    const response = await fetch('http://localhost:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Deploy contract
async function deployContract() {
  return new Promise((resolve, reject) => {
    const web3Path = path.resolve(__dirname, '..');
    const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
      cwd: web3Path,
      stdio: 'pipe'
    });

    let output = '';
    deployProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    deployProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    deployProcess.on('close', (code) => {
      if (code === 0) {
        const match = output.match(/CrowdFunding deployed to: (0x[a-fA-F0-9]{40})/);
        resolve(match ? match[1] : null);
      } else {
        reject(new Error('Deployment failed'));
      }
    });
  });
}

// Start frontend
function startFrontend() {
  const clientPath = path.resolve(__dirname, '..', '..', 'client');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: clientPath,
    stdio: 'inherit'
  });

  return frontendProcess;
}

// Main function
async function quickSetup() {
  try {
    log(' Checking Hardhat node...', colors.yellow);
    
    const isNodeRunning = await checkHardhatNode();
    if (!isNodeRunning) {
      log(' Hardhat node not running. Please start it with:', colors.red);
      log('   npx hardhat node', colors.blue);
      log('\nThen run this script again.', colors.yellow);
      process.exit(1);
    }

    log(' Hardhat node is running', colors.green);

    log('\n Deploying contract...', colors.yellow);
    const contractAddress = await deployContract();
    
    if (!contractAddress) {
      log(' Failed to get contract address', colors.red);
      process.exit(1);
    }

    log(` Contract deployed: ${contractAddress}`, colors.green);

    // Update frontend config
    log('\n Updating frontend configuration...', colors.yellow);
    const clientPath = path.resolve(__dirname, '..', '..', 'client');
    const contextPath = path.join(clientPath, 'src', 'context', 'index.jsx');
    
    if (fs.existsSync(contextPath)) {
      let contextContent = fs.readFileSync(contextPath, 'utf8');
      contextContent = contextContent.replace(
        /const contract = useContract\('0x[a-fA-F0-9]{40}'\);/,
        `const contract = useContract('${contractAddress}');`
      );
      fs.writeFileSync(contextPath, contextContent);
      log(' Frontend configuration updated', colors.green);
    }

    // Create env file
    const envPath = path.join(clientPath, '.env.local');
    const envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}
VITE_RPC_URL=http://localhost:8545
VITE_CHAIN_ID=31337
VITE_NETWORK_NAME=localhost`;
    fs.writeFileSync(envPath, envContent);
    log(' Environment file created', colors.green);

    log('\n Starting frontend...', colors.yellow);
    const frontendProcess = startFrontend();

    // Display instructions
    setTimeout(() => {
      log('\n Quick Setup Complete!', colors.green);
      log('\n Next Steps:', colors.blue);
      log('1. Open browser: http://localhost:5173', colors.white);
      log('2. Connect MetaMask to Hardhat network:', colors.white);
      log('   - Network Name: Hardhat Local', colors.white);
      log('   - RPC URL: http://localhost:8545', colors.white);
      log('   - Chain ID: 31337', colors.white);
      log('   - Symbol: ETH', colors.white);
      log('3. Import test accounts from Hardhat node output', colors.white);
      log('\n Contract: ' + contractAddress, colors.yellow);
      log(' Frontend: http://localhost:5173', colors.yellow);
      log('\n Press Ctrl+C to stop', colors.blue);
    }, 3000);

    // Handle shutdown
    process.on('SIGINT', () => {
      log('\n Shutting down...', colors.yellow);
      frontendProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    log(' Setup failed: ' + error.message, colors.red);
    process.exit(1);
  }
}

// Run setup
quickSetup();
