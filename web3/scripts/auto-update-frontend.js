const fs = require('fs');
const path = require('path');

async function main() {
  console.log(" Auto-updating frontend contract address...");
  
  try {
    const deploymentInfoPath = path.join(__dirname, '..', 'deployment-info.json');
    let contractAddress = null;

    if (fs.existsSync(deploymentInfoPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
      if (deploymentInfo && /^0x[a-fA-F0-9]{40}$/.test(deploymentInfo.address)) {
        contractAddress = deploymentInfo.address;
        console.log(' Loaded deployed contract address from deployment-info.json:', contractAddress);
      }
    }

    if (!contractAddress) {
      const envPath = path.join(__dirname, '../../client/.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/VITE_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/);
        if (match) {
          contractAddress = match[1];
          console.log(' Loaded deployed contract address from existing client/.env:', contractAddress);
        }
      }
    }

    if (!contractAddress) {
      throw new Error('Could not determine deployed contract address. Run a deployment script first.');
    }

    const envPath = path.join(__dirname, '../../client/.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n').filter(Boolean);
    let updated = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('VITE_CONTRACT_ADDRESS=')) {
        lines[i] = `VITE_CONTRACT_ADDRESS=${contractAddress}`;
        updated = true;
        break;
      }
    }

    if (!updated) {
      lines.push(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
    }

    fs.writeFileSync(envPath, lines.join('\n') + '\n');
    console.log(' Frontend .env file updated successfully');

    const contextPath = path.join(__dirname, '../../client/src/context/index.jsx');
    if (fs.existsSync(contextPath)) {
      let contextContent = fs.readFileSync(contextPath, 'utf8');
      const fallbackRegex = /const fallbackAddress = '0x[^']*';/g;
      if (fallbackRegex.test(contextContent)) {
        contextContent = contextContent.replace(fallbackRegex, `const fallbackAddress = '${contractAddress}';`);
        fs.writeFileSync(contextPath, contextContent);
        console.log(' Context fallback address updated successfully');
      } else {
        console.log(' No fallback address pattern found in context file; skipping context update');
      }
    } else {
      console.warn(` Context file not found: ${path.relative(process.cwd(), contextPath)}. Skipping context update.`);
    }

    console.log(' Auto-update completed successfully!');
  } catch (error) {
    console.error(' Auto-update failed:', error.message);

    // Fallback: use known contract address
    console.log(' Using fallback contract address...');
    const fallbackAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    
    try {
      const envPath = path.join(__dirname, '../../client/.env');
      const envContent = `VITE_CONTRACT_ADDRESS=${fallbackAddress}\n`;
      fs.writeFileSync(envPath, envContent);
      console.log(' Frontend .env file updated with fallback method');
      
      const contextPath = path.join(__dirname, '../../client/src/context/index.jsx');
      if (fs.existsSync(contextPath)) {
        let contextContent = fs.readFileSync(contextPath, 'utf8');
        const fallbackRegex = /const fallbackAddress = '0x[^']*';/g;
        if (fallbackRegex.test(contextContent)) {
          contextContent = contextContent.replace(fallbackRegex, `const fallbackAddress = '${fallbackAddress}';`);
          fs.writeFileSync(contextPath, contextContent);
          console.log(' Context fallback address updated with fallback method');
        } else {
          console.log(' No fallback address pattern found in context file; skipping context update');
        }
      } else {
        console.warn(` Context file not found: ${path.relative(process.cwd(), contextPath)}.`);
      }
    } catch (fallbackError) {
      console.error(' Fallback method also failed:', fallbackError.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
