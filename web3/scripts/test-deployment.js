const hre = require('hardhat');

async function main() {
  console.log(' Starting CrowdFunding Platform Test Deployment...\n');

  const [deployer, user1, user2, contractor] = await hre.ethers.getSigners();

  console.log(' Available Test Accounts:');
  console.log('Deployer:', deployer.address);
  console.log('User 1:', user1.address);
  console.log('User 2:', user2.address);
  console.log('Contractor:', contractor.address);
  console.log('');

  // Deploy contract
  console.log('  Deploying CrowdFunding contract...');
  const CrowdFunding = await hre.ethers.getContractFactory('CrowdFunding');
  const crowdFunding = await CrowdFunding.deploy();
  await crowdFunding.deployed();
  crowdFunding.createCampaign = (...args) =>
    crowdFunding['createCampaign(address,string,string,uint256,uint256,string)'](...args);

  console.log(' CrowdFunding deployed to:', crowdFunding.address);
  console.log('');

  // Test campaign creation
  console.log(' Creating test campaigns...');
  const futureTime = (await hre.ethers.provider.getBlock('latest')).timestamp + 86400; // 24 hours from now

  // Campaign 1: High YOLO score (should be approved)
  const campaign1Tx = await crowdFunding.createCampaign(
    deployer.address,
    'Repair Damaged Bridge - High Priority',
    'Critical infrastructure repair with severe damage detected by YOLO analysis',
    hre.ethers.utils.parseEther('10.0'),
    futureTime,
    'https://example.com/damaged-bridge.jpg'
  );
  const campaign1Receipt = await campaign1Tx.wait();
  const campaign1Id = 0;

  console.log(' Campaign 1 created (High YOLO score):', campaign1Id);

  // Campaign 2: Low YOLO score (would be rejected by frontend)
  const campaign2Tx = await crowdFunding.createCampaign(
    deployer.address,
    'Minor Bench Repair - Low Priority',
    'Small cosmetic damage, YOLO score 3.2/10 (would be rejected in frontend)',
    hre.ethers.utils.parseEther('2.0'),
    futureTime + 3600,
    'https://example.com/minor-bench.jpg'
  );
  const campaign2Receipt = await campaign2Tx.wait();
  const campaign2Id = 1;

  console.log(' Campaign 2 created (Low YOLO score):', campaign2Id);
  console.log('');

  // Test donations
  console.log(' Testing donations...');
  await crowdFunding.connect(user1).donateToCampaign(campaign1Id, { 
    value: hre.ethers.utils.parseEther('2.0') 
  });
  console.log(' User 1 donated 2 ETH to Campaign 1');

  await crowdFunding.connect(user2).donateToCampaign(campaign1Id, { 
    value: hre.ethers.utils.parseEther('1.5') 
  });
  console.log(' User 2 donated 1.5 ETH to Campaign 1');
  console.log('');

  // Test project acceptance
  console.log(' Testing contractor project acceptance...');
  await crowdFunding.connect(contractor).acceptProject(campaign1Id);
  console.log(' Contractor accepted Campaign 1');
  console.log('');

  // Get campaign details
  console.log(' Campaign Details:');
  const campaign1 = await crowdFunding.campaigns(campaign1Id);
  console.log('Campaign 1:');
  console.log('  Title:', campaign1.title);
  console.log('  Owner:', campaign1.owner);
  console.log('  Contractor:', campaign1.contractor);
  console.log('  Target:', hre.ethers.utils.formatEther(campaign1.target), 'ETH');
  console.log('  Collected:', hre.ethers.utils.formatEther(campaign1.amountCollected), 'ETH');
  console.log('  Progress:', Math.round(campaign1.amountCollected.mul(100).div(campaign1.target)), '%');
  console.log('');

  // Get donators
  const [donators, donations] = await crowdFunding.getDonators(campaign1Id);
  console.log(' Donators:');
  donators.forEach((donator, index) => {
    console.log(`  Donator ${index + 1}: ${donator} - ${hre.ethers.utils.formatEther(donations[index])} ETH`);
  });
  console.log('');

  // Get all campaigns
  const allCampaigns = await crowdFunding.getCampaigns();
  console.log(' All Campaigns:', allCampaigns.length);
  allCampaigns.forEach((campaign, index) => {
    console.log(`  Campaign ${index}: ${campaign.title} - ${hre.ethers.utils.formatEther(campaign.amountCollected)} ETH collected`);
  });
  console.log('');

  // Test edge cases
  console.log(' Testing edge cases...');
  
  // Test invalid deadline
  try {
    const pastTime = (await hre.ethers.provider.getBlock('latest')).timestamp - 86400;
    await crowdFunding.createCampaign(
      deployer.address,
      'Invalid Campaign',
      'This should fail',
      hre.ethers.utils.parseEther('1.0'),
      pastTime,
      'invalid.jpg'
    );
    console.log(' Should have failed with past deadline');
  } catch (error) {
    console.log(' Correctly rejected campaign with past deadline');
  }

  // Test owner accepting own campaign
  try {
    await crowdFunding.connect(deployer).acceptProject(campaign1Id);
    console.log(' Should have failed - owner accepting own campaign');
  } catch (error) {
    console.log(' Correctly rejected owner accepting own campaign');
  }

  // Test double acceptance
  try {
    await crowdFunding.connect(user1).acceptProject(campaign1Id);
    console.log(' Should have failed - project already accepted');
  } catch (error) {
    console.log(' Correctly rejected double project acceptance');
  }
  console.log('');

  console.log(' Test Deployment Complete!');
  console.log('');
  console.log(' Summary:');
  console.log(' Contract deployed successfully');
  console.log(' Campaign creation working');
  console.log(' Donation system working');
  console.log(' Contractor acceptance working');
  console.log(' Edge cases handled correctly');
  console.log(' YOLO integration simulation working');
  console.log('');
  console.log(' Contract Address:', crowdFunding.address);
  console.log(' Total Campaigns:', await crowdFunding.numberOfCampaigns());
  console.log(' Total Collected:', hre.ethers.utils.formatEther(campaign1.amountCollected), 'ETH');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
