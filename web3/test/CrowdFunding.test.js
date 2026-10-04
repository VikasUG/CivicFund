const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdFunding Platform Tests", function () {
  let crowdFunding;
  let owner, addr1, addr2, addr3, contractor;
  let campaignId;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3, contractor] = await ethers.getSigners();
    
    // Deploy contract
    const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
    crowdFunding = await CrowdFunding.deploy();
    await crowdFunding.deployed();

    crowdFunding.createCampaign = (...args) => {
      if (args.length === 8) {
        return crowdFunding["createCampaign(address,string,string,uint256,uint256,string,string,uint256)"](...args);
      }

      return crowdFunding["createCampaign(address,string,string,uint256,uint256,string)"](...args);
    };
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign successfully", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400; // 24 hours from now
      
      const tx = await crowdFunding.createCampaign(
        owner.address,
        "Fix Potholes on Main Street",
        "Repair dangerous potholes that are damaging vehicles",
        ethers.utils.parseEther("5.0"),
        futureTime,
        "https://example.com/pothole-image.jpg"
      );
      
      const receipt = await tx.wait();
      
      expect(receipt.status).to.equal(1); // Transaction successful
      campaignId = 0;
    });

    it("Should fail if deadline is in the past", async function () {
      const pastTime = (await ethers.provider.getBlock("latest")).timestamp - 86400; // 24 hours ago
      
      try {
        await crowdFunding.createCampaign(
          owner.address,
          "Invalid Campaign",
          "This should fail",
          ethers.utils.parseEther("1.0"),
          pastTime,
          "https://example.com/image.jpg"
        );
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("The deadline should be a date in the future");
      }
    });

    it("Should reject a target above the category cap when score is provided", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;

      try {
        await crowdFunding.createCampaign(
          owner.address,
          "Over Budget Campaign",
          "This should fail",
          ethers.utils.parseEther("0.2"),
          futureTime,
          "https://example.com/image.jpg",
          "pothole_repair",
          100
        );
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Target exceeds category cap");
      }
    });

    it("Should increment numberOfCampaigns", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      
      await crowdFunding.createCampaign(
        owner.address,
        "Campaign 1",
        "Description 1",
        ethers.utils.parseEther("1.0"),
        futureTime,
        "image1.jpg"
      );
      
      const count1 = await crowdFunding.numberOfCampaigns();
      expect(count1.toString()).to.equal("1");
      
      await crowdFunding.createCampaign(
        owner.address,
        "Campaign 2",
        "Description 2",
        ethers.utils.parseEther("2.0"),
        futureTime,
        "image2.jpg"
      );
      
      const count2 = await crowdFunding.numberOfCampaigns();
      expect(count2.toString()).to.equal("2");
    });
  });

  describe("Campaign Donation", function () {
    beforeEach(async function () {
      // Create a test campaign
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      const tx = await crowdFunding.createCampaign(
        owner.address,
        "Test Campaign",
        "Test Description",
        ethers.utils.parseEther("5.0"),
        futureTime,
        "test.jpg"
      );
      campaignId = 0;
    });

    it("Should allow donation to campaign", async function () {
      const donationAmount = ethers.utils.parseEther("0.5");
      
      await crowdFunding.connect(addr1).donateToCampaign(campaignId, { value: donationAmount });
      
      const campaign = await crowdFunding.campaigns(campaignId);
      expect(campaign.amountCollected.toString()).to.equal(donationAmount.toString());
    });

    it("Should reject donations larger than the remaining target amount", async function () {
      const targetAmount = ethers.utils.parseEther("0.5");
      const firstDonation = ethers.utils.parseEther("0.4");
      const secondDonation = ethers.utils.parseEther("0.2");

      await crowdFunding.createCampaign(
        owner.address,
        "Targeted Campaign",
        "Should enforce the remaining cap",
        targetAmount,
        (await ethers.provider.getBlock("latest")).timestamp + 86400,
        "test.jpg"
      );

      const targetCampaignId = 1;
      await crowdFunding.connect(addr1).donateToCampaign(targetCampaignId, { value: firstDonation });

      try {
        await crowdFunding.connect(addr2).donateToCampaign(targetCampaignId, { value: secondDonation });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Donation exceeds remaining target amount");
      }
    });

    it("Should track donators correctly", async function () {
      const donationAmount1 = ethers.utils.parseEther("0.5");
      const donationAmount2 = ethers.utils.parseEther("1.0");
      
      await crowdFunding.connect(addr1).donateToCampaign(campaignId, { value: donationAmount1 });
      await crowdFunding.connect(addr2).donateToCampaign(campaignId, { value: donationAmount2 });
      
      const [donators, donations] = await crowdFunding.getDonators(campaignId);
      
      expect(donators.length).to.equal(2);
      expect(donations.length).to.equal(2);
      expect(donators[0]).to.equal(addr1.address);
      expect(donators[1]).to.equal(addr2.address);
      expect(donations[0].toString()).to.equal(donationAmount1.toString());
      expect(donations[1].toString()).to.equal(donationAmount2.toString());
    });

    it("Should allow multiple donations from same address", async function () {
      const donationAmount = ethers.utils.parseEther("0.5");
      
      await crowdFunding.connect(addr1).donateToCampaign(campaignId, { value: donationAmount });
      await crowdFunding.connect(addr1).donateToCampaign(campaignId, { value: donationAmount });
      
      const [donators, donations] = await crowdFunding.getDonators(campaignId);
      
      expect(donators.length).to.equal(2);
      expect(donators[0]).to.equal(addr1.address);
      expect(donators[1]).to.equal(addr1.address);
      expect(donations[0].toString()).to.equal(donationAmount.toString());
      expect(donations[1].toString()).to.equal(donationAmount.toString());
    });
  });

  describe("Project Acceptance", function () {
    beforeEach(async function () {
      // Create a test campaign
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      const tx = await crowdFunding.createCampaign(
        owner.address,
        "Test Campaign",
        "Test Description",
        ethers.utils.parseEther("5.0"),
        futureTime,
        "test.jpg"
      );
      campaignId = 0;
    });

    it("Should allow contractor to accept project", async function () {
      const tx = await crowdFunding.connect(contractor).acceptProject(campaignId);
      
      const campaign = await crowdFunding.campaigns(campaignId);
      expect(campaign.contractor).to.equal(contractor.address);
    });

    it("Should fail if owner tries to accept their own campaign", async function () {
      try {
        await crowdFunding.connect(owner).acceptProject(campaignId);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Owner cannot accept their own campaign");
      }
    });

    it("Should fail if project already has contractor", async function () {
      await crowdFunding.connect(contractor).acceptProject(campaignId);
      
      try {
        await crowdFunding.connect(addr1).acceptProject(campaignId);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Project already accepted");
      }
    });

    it("Should fail if campaign doesn't exist", async function () {
      try {
        await crowdFunding.connect(contractor).acceptProject(999);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Campaign does not exist");
      }
    });
  });

  describe("Campaign Retrieval", function () {
    it("Should return empty array when no campaigns exist", async function () {
      const campaigns = await crowdFunding.getCampaigns();
      expect(campaigns.length).to.equal(0);
    });

    it("Should return all campaigns", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      
      // Create multiple campaigns
      await crowdFunding.createCampaign(
        owner.address,
        "Campaign 1",
        "Description 1",
        ethers.utils.parseEther("1.0"),
        futureTime,
        "image1.jpg"
      );
      
      await crowdFunding.createCampaign(
        owner.address,
        "Campaign 2",
        "Description 2",
        ethers.utils.parseEther("2.0"),
        futureTime,
        "image2.jpg"
      );
      
      const campaigns = await crowdFunding.getCampaigns();
      expect(campaigns.length).to.equal(2);
      expect(campaigns[0].title).to.equal("Campaign 1");
      expect(campaigns[1].title).to.equal("Campaign 2");
    });

    it("Should return campaign details correctly", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      const targetAmount = ethers.utils.parseEther("5.0");
      
      await crowdFunding.createCampaign(
        owner.address,
        "Test Campaign",
        "Test Description",
        targetAmount,
        futureTime,
        "test.jpg"
      );
      
      const campaign = await crowdFunding.campaigns(0);
      expect(campaign.owner).to.equal(owner.address);
      expect(campaign.title).to.equal("Test Campaign");
      expect(campaign.description).to.equal("Test Description");
      expect(campaign.target.toString()).to.equal(targetAmount.toString());
      expect(campaign.deadline.toString()).to.equal(futureTime.toString());
      expect(campaign.image).to.equal("test.jpg");
      expect(campaign.amountCollected.toString()).to.equal("0");
      expect(campaign.contractor).to.equal(ethers.constants.AddressZero);
    });
  });

  describe("Edge Cases", function () {
    it("Should reject zero donation", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      await crowdFunding.createCampaign(
        owner.address,
        "Test Campaign",
        "Test Description",
        ethers.utils.parseEther("5.0"),
        futureTime,
        "test.jpg"
      );
      campaignId = 0;
      
      try {
        await crowdFunding.connect(addr1).donateToCampaign(campaignId, { value: 0 });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Donation amount must be greater than 0");
      }
    });

    it("Should handle donation to non-existent campaign", async function () {
      try {
        await crowdFunding.connect(addr1).donateToCampaign(999, { value: ethers.utils.parseEther("1.0") });
        expect.fail("Should have reverted");
      } catch (error) {
        // Should revert due to out-of-bounds access or campaign not existing
        expect(error.message).to.include("revert");
      }
    });

    it("Should handle very large campaigns array", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      
      // Create 50 campaigns
      for (let i = 0; i < 50; i++) {
        await crowdFunding.createCampaign(
          owner.address,
          `Campaign ${i}`,
          `Description ${i}`,
          ethers.utils.parseEther("1.0"),
          futureTime,
          `image${i}.jpg`
        );
      }
      
      const campaigns = await crowdFunding.getCampaigns();
      expect(campaigns.length).to.equal(50);
      const count = await crowdFunding.numberOfCampaigns();
      expect(count.toString()).to.equal("50");
    });
  });

  describe("YOLO Integration Simulation", function () {
    it("Should simulate YOLO-based campaign validation", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      
      // Simulate high YOLO score (should allow campaign creation)
      const highScoreCampaign = await crowdFunding.createCampaign(
        owner.address,
        "Repair Damaged Bridge - High Priority",
        "Critical infrastructure repair with YOLO score 8.5/10",
        ethers.utils.parseEther("10.0"),
        futureTime,
        "https://example.com/damaged-bridge.jpg"
      );
      
      expect(highScoreCampaign).to.not.be.undefined;
      
      // Simulate low YOLO score (would be rejected in frontend)
      // This would be handled in the frontend YOLO validation logic
      // The smart contract allows all campaigns, but frontend filters them
    });

    it("Should test YOLO campaign rejection logic", async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      
      // Simulate frontend YOLO validation logic
      const simulateYOLOAnalysis = (imageUrl) => {
        const mockScores = {
          'https://example.com/damaged-bridge.jpg': 8.5,  // High score - approve
          'https://example.com/minor-bench.jpg': 3.2,     // Low score - reject
          'https://example.com/potholes.jpg': 7.8,        // High score - approve
          'https://example.com/well-maintained.jpg': 4.1  // Low score - reject
        };
        return mockScores[imageUrl] || 5.0;
      };
      
      const validateCampaign = (yoloScore) => {
        return yoloScore >= 6.0; // Threshold for approval
      };
      
      // Test high score campaign (should be approved)
      const highScoreImage = 'https://example.com/damaged-bridge.jpg';
      const highScore = simulateYOLOAnalysis(highScoreImage);
      const highScoreApproved = validateCampaign(highScore);
      
      expect(highScore).to.be.greaterThan(6.0);
      expect(highScoreApproved).to.be.true;
      
      // This campaign would be created in the smart contract
      const highScoreCampaign = await crowdFunding.createCampaign(
        owner.address,
        "High Priority Infrastructure",
        `YOLO score ${highScore}/10 - approved`,
        ethers.utils.parseEther("10.0"),
        futureTime,
        highScoreImage
      );
      expect(highScoreCampaign).to.not.be.undefined;
      
      // Test low score campaign (should be rejected by frontend)
      const lowScoreImage = 'https://example.com/well-maintained.jpg';
      const lowScore = simulateYOLOAnalysis(lowScoreImage);
      const lowScoreApproved = validateCampaign(lowScore);
      
      expect(lowScore).to.be.lessThan(6.0);
      expect(lowScoreApproved).to.be.false;
      
      // This campaign would be REJECTED by frontend and NOT sent to smart contract
      // The frontend validation would prevent the transaction from being sent
      
      // Simulate frontend rejection logic
      if (!lowScoreApproved) {
        // Frontend would show alert and prevent campaign creation
        const rejectionMessage = `Campaign rejected: Image analysis shows score of ${lowScore}/10. This suggests the area doesn't need significant work/repairs. Campaigns should focus on areas that need attention.`;
        expect(rejectionMessage).to.include("rejected");
        expect(rejectionMessage).to.include(lowScore.toString());
      }
    });

    it("Should test YOLO score threshold validation", async function () {
      // Test edge cases around the 6.0 threshold
      const testScores = [
        { score: 5.9, expected: false, description: "Just below threshold" },
        { score: 6.0, expected: true, description: "Exactly at threshold" },
        { score: 6.1, expected: true, description: "Just above threshold" },
        { score: 5.5, expected: false, description: "Well below threshold" },
        { score: 8.5, expected: true, description: "High score" },
        { score: 2.0, expected: false, description: "Very low score" }
      ];
      
      const validateCampaign = (yoloScore) => {
        return yoloScore >= 6.0; // Threshold for approval
      };
      
      testScores.forEach(test => {
        const approved = validateCampaign(test.score);
        expect(approved).to.equal(test.expected);
        console.log(`YOLO Score ${test.score}: ${approved ? 'APPROVED' : 'REJECTED'} (${test.description})`);
      });
    });
  });

  describe("Progress Proof and Fund Release", function () {
    beforeEach(async function () {
      const futureTime = (await ethers.provider.getBlock("latest")).timestamp + 86400;
      await crowdFunding.createCampaign(
        owner.address,
        "Test Campaign",
        "Test Description",
        ethers.utils.parseEther("5.0"),
        futureTime,
        "test.jpg"
      );
      campaignId = 0;
      
      // Accept project
      await crowdFunding.connect(contractor).acceptProject(campaignId);
      
      // Add some donations
      await crowdFunding.connect(addr1).donateToCampaign(campaignId, { value: ethers.utils.parseEther("2.0") });
      await crowdFunding.connect(addr2).donateToCampaign(campaignId, { value: ethers.utils.parseEther("1.0") });
    });

    it("Should show correct funding progress", async function () {
      const campaign = await crowdFunding.campaigns(campaignId);
      const target = ethers.utils.parseEther("5.0");
      const collected = campaign.amountCollected;
      
      expect(collected.toString()).to.equal(ethers.utils.parseEther("3.0").toString());
      
      // Progress percentage (this would be calculated in frontend)
      const progress = collected.mul(100).div(target);
      expect(progress.toString()).to.equal("60"); // 60% funded
    });

    it("Should have contractor assigned", async function () {
      const campaign = await crowdFunding.campaigns(campaignId);
      expect(campaign.contractor).to.equal(contractor.address);
      expect(campaign.contractor).to.not.equal(ethers.constants.AddressZero);
    });
  });
});
