# 🧪 CrowdFunding Platform - Manual Testing Guide with Hardhat

## 📋 Overview
This guide provides comprehensive instructions for manually testing the CrowdFunding platform using Hardhat. It covers smart contract testing, frontend integration, and YOLO validation simulation.

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Navigate to web3 directory
cd c:/Users/Admin/CrowdFunding-web3/web3

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run all tests
npx hardhat test
```

### 2. Deploy Test Environment
```bash
# Deploy contract for testing
npx hardhat run scripts/deploy.js --network hardhat

# Run comprehensive test deployment
npx hardhat run scripts/test-deployment.js --network hardhat
```

## 🧪 Test Categories

### 1. Smart Contract Tests
```bash
# Run all contract tests
npx hardhat test

# Run specific test file
npx hardhat test test/CrowdFunding.test.js

# Run tests with verbose output
npx hardhat test --verbose
```

### 2. Campaign Creation Tests
```bash
# Test campaign creation with valid data
npx hardhat console
> const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
> const cf = await CrowdFunding.deploy();
> await cf.deployed();
> const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
> await cf.createCampaign(
...   "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
...   "Test Campaign",
...   "Test Description",
...   ethers.utils.parseEther("5.0"),
...   futureTime,
...   "test.jpg"
... );
```

### 3. YOLO Validation Simulation
```bash
# Test high YOLO score campaign (should pass)
await cf.createCampaign(
  owner.address,
  "Repair Damaged Bridge - High Priority",
  "Critical infrastructure with YOLO score 8.5/10",
  ethers.utils.parseEther("10.0"),
  futureTime,
  "https://example.com/damaged-bridge.jpg"
);

# Test low YOLO score campaign (would be rejected by frontend)
await cf.createCampaign(
  owner.address,
  "Minor Bench Repair - Low Priority",
  "Cosmetic damage with YOLO score 3.2/10",
  ethers.utils.parseEther("2.0"),
  futureTime,
  "https://example.com/minor-bench.jpg"
);
```

## 📊 Test Scenarios

### Scenario 1: Complete Campaign Flow
```bash
# Step 1: Create campaign
const campaignId = await cf.createCampaign(
  owner.address,
  "Fix Potholes on Main Street",
  "Repair dangerous potholes damaging vehicles",
  ethers.utils.parseEther("5.0"),
  futureTime,
  "pothole-image.jpg"
);

# Step 2: Accept project as contractor
await cf.connect(contractor).acceptProject(campaignId);

# Step 3: Donate to campaign
await cf.connect(donor1).donateToCampaign(campaignId, { value: ethers.utils.parseEther("2.0") });
await cf.connect(donor2).donateToCampaign(campaignId, { value: ethers.utils.parseEther("1.0") });

# Step 4: Check progress
const campaign = await cf.campaigns(campaignId);
const progress = campaign.amountCollected.mul(100).div(campaign.target);
console.log(`Progress: ${progress}%`);
```

### Scenario 2: Error Handling Tests
```bash
# Test invalid deadline (past date)
const pastTime = (await ethers.provider.getBlock("latest")).timestamp - 86400;
await cf.createCampaign(
  owner.address,
  "Invalid Campaign",
  "Should fail",
  ethers.utils.parseEther("1.0"),
  pastTime,
  "invalid.jpg"
); // Should revert

# Test owner accepting own campaign
await cf.connect(owner).acceptProject(campaignId); // Should revert

# Test double acceptance
await cf.connect(contractor2).acceptProject(campaignId); // Should revert
```

### Scenario 3: Edge Cases
```bash
# Test zero donation
await cf.connect(donor).donateToCampaign(campaignId, { value: 0 });

# Test multiple donations from same address
await cf.connect(donor).donateToCampaign(campaignId, { value: ethers.utils.parseEther("1.0") });
await cf.connect(donor).donateToCampaign(campaignId, { value: ethers.utils.parseEther("2.0") });

# Test large number of campaigns
for (let i = 0; i < 50; i++) {
  await cf.createCampaign(
    owner.address,
    `Campaign ${i}`,
    `Description ${i}`,
    ethers.utils.parseEther("1.0"),
    futureTime,
    `image${i}.jpg`
  );
}
```

## 🎯 YOLO Integration Testing

### Frontend Simulation
```javascript
// Simulate YOLO analysis in frontend
const simulateYOLOAnalysis = (imageUrl) => {
  // Mock YOLO scores for testing
  const mockScores = {
    'damaged-bridge.jpg': 8.5,  // High score - approve
    'minor-bench.jpg': 3.2,     // Low score - reject
    'potholes.jpg': 7.8,        // High score - approve
    'well-maintained.jpg': 4.1  // Low score - reject
  };
  
  return mockScores[imageUrl.split('/').pop()] || 5.0;
};

// Test campaign validation
const validateCampaign = (yoloScore) => {
  return yoloScore >= 6.0; // Threshold for approval
};
```

### Smart Contract + Frontend Integration
```bash
# Test complete flow with YOLO validation
# 1. Frontend validates image with YOLO
# 2. If score >= 6.0, create campaign
# 3. If score < 6.0, reject campaign

# High score campaign (should succeed)
const highScoreCampaign = await cf.createCampaign(
  owner.address,
  "High Priority Infrastructure",
  "YOLO score 8.5/10 - approved",
  ethers.utils.parseEther("10.0"),
  futureTime,
  "damaged-bridge.jpg"
);

# Low score campaign (rejected by frontend, not sent to contract)
# This would be handled in the frontend validation logic
```

## 🔍 Debugging Tools

### 1. Console Testing
```bash
# Start Hardhat console
npx hardhat console

# Get contract instance
const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
const cf = await CrowdFunding.deploy();
await cf.deployed();

# Check contract state
console.log("Number of campaigns:", await cf.numberOfCampaigns());
console.log("Campaign details:", await cf.campaigns(0));
console.log("Donators:", await cf.getDonators(0));
```

### 2. Event Monitoring
```bash
# Listen for events in tests
const tx = await cf.createCampaign(...);
const receipt = await tx.wait();
console.log("Events:", receipt.events);

# Filter specific events
const filter = cf.filters.CampaignCreated();
const events = await cf.queryFilter(filter);
```

### 3. Gas Analysis
```bash
# Check gas usage
const tx = await cf.createCampaign(...);
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());
```

## 📱 Frontend Integration Testing

### 1. Update Contract Address
```javascript
// In client/src/context/index.jsx
const contractAddress = "0x..." // Use deployed contract address
```

### 2. Test Web3 Connection
```bash
# Start frontend
cd ../client
npm run dev

# Test wallet connection
# Connect MetaMask to Hardhat network
# Add Hardhat network to MetaMask:
# Network Name: Hardhat Local
# RPC URL: http://127.0.0.1:8545
# Chain ID: 31337
# Symbol: ETH
```

### 3. Test Complete Flow
1. **Connect Wallet**: Connect MetaMask to Hardhat network
2. **Select User Type**: Choose "User" or "Contractor"
3. **Create Campaign**: Upload image, wait for YOLO analysis
4. **Validate YOLO**: Check if score >= 6.0 (approve) or < 6.0 (reject)
5. **Accept Project**: As contractor, accept the campaign
6. **Donate**: As user, donate to campaign
7. **Submit Progress**: As contractor, submit progress proof
8. **Release Funds**: Based on YOLO score validation

## 🚨 Common Issues & Solutions

### Issue 1: Contract Not Deployed
```bash
# Solution: Ensure Hardhat network is running
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### Issue 2: MetaMask Connection Failed
```bash
# Solution: Add Hardhat network to MetaMask
# Network Name: Hardhat Local
# RPC URL: http://127.0.0.1:8545
# Chain ID: 31337
```

### Issue 3: YOLO Analysis Not Working
```bash
# Solution: Check CivicImageAnalysis component
# Ensure image upload is working
# Check console for JavaScript errors
```

### Issue 4: Test Failures
```bash
# Solution: Check test dependencies
npm install
npx hardhat clean
npx hardhat compile
npx hardhat test
```

## 📊 Test Results Checklist

### ✅ Smart Contract Tests
- [ ] Campaign creation works
- [ ] Donation system works
- [ ] Contractor acceptance works
- [ ] Error handling works
- [ ] Edge cases covered

### ✅ YOLO Integration Tests
- [ ] High score campaigns approved
- [ ] Low score campaigns rejected
- [ ] Image analysis simulation works
- [ ] Frontend validation works

### ✅ Frontend Integration Tests
- [ ] Wallet connection works
- [ ] User type selection works
- [ ] Campaign creation flow works
- [ ] Progress tracking works
- [ ] Fund release automation works

### ✅ End-to-End Tests
- [ ] Complete user journey works
- [ ] Contractor dashboard works
- [ ] Progress proof submission works
- [ ] Fund release based on YOLO scores works

## 🎯 Next Steps

1. **Run all tests**: `npx hardhat test`
2. **Deploy locally**: `npx hardhat run scripts/test-deployment.js`
3. **Test frontend**: Connect MetaMask and test complete flow
4. **Validate YOLO**: Test image upload and analysis
5. **Test fund release**: Complete contractor workflow

## 📞 Support

If you encounter issues:
1. Check console logs for errors
2. Verify contract deployment
3. Ensure MetaMask is connected to correct network
4. Check YOLO analysis component
5. Review test results for debugging info

---

**🎉 Happy Testing!**
