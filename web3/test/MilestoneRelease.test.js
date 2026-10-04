const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdFundingEscrow - Milestone Fund Release", function () {
  let crowdFunding;
  let owner, donor1, donor2, contractor;
  let campaignId;
  const TARGET = ethers.utils.parseEther("10.0");

  // Helper: fully fund + assign contractor so proofs can be submitted.
  async function setupFundedCampaign() {
    [owner, donor1, donor2, contractor] = await ethers.getSigners();
    const CrowdFunding = await ethers.getContractFactory("CrowdFundingEscrow");
    crowdFunding = await CrowdFunding.deploy();
    await crowdFunding.deployed();
    crowdFunding.createCampaign = (...args) =>
      crowdFunding["createCampaign(address,string,string,uint256,uint256,string)"](...args);

    const futureTime =
      (await ethers.provider.getBlock("latest")).timestamp + 86400;

    await crowdFunding.createCampaign(
      owner.address,
      "Road Repair",
      "Repair the road",
      TARGET,
      futureTime,
      "https://example.com/img.jpg"
    );
    campaignId = 0;

    // Fund the campaign fully (split across two donors).
    await crowdFunding
      .connect(donor1)
      .donateToCampaign(campaignId, { value: ethers.utils.parseEther("6.0") });
    await crowdFunding
      .connect(donor2)
      .donateToCampaign(campaignId, { value: ethers.utils.parseEther("4.0") });

    await crowdFunding.connect(contractor).acceptProject(campaignId);
  }

  // Use the CONTRACT balance (it never pays gas), so the delta equals the
  // exact released amount.
  async function contractBalance() {
    return await crowdFunding.getContractBalance();
  }

  it("50% proof releases exactly 50% (capped, regardless of analysis score)", async function () {
    await setupFundedCampaign();

    const before = await contractBalance();
    await crowdFunding.connect(contractor).submitProgressProof(campaignId, 0);
    const after = await contractBalance();

    const released = before.sub(after);
    expect(released.toString()).to.equal(TARGET.div(2).toString()); // exactly 50%
  });

  it("direct 100% proof (index 1) releases the FULL fund", async function () {
    await setupFundedCampaign();

    const before = await contractBalance();
    await crowdFunding.connect(contractor).submitProgressProof(campaignId, 1);
    const after = await contractBalance();

    const released = before.sub(after);
    expect(released.toString()).to.equal(TARGET.toString()); // full 100%
  });

  it("50% then 100% totals exactly 100% (no double-pay, capped at target)", async function () {
    await setupFundedCampaign();

    const before = await contractBalance();
    await crowdFunding.connect(contractor).submitProgressProof(campaignId, 0);
    await crowdFunding.connect(contractor).submitProgressProof(campaignId, 1);
    const after = await contractBalance();

    const released = before.sub(after);
    expect(released.toString()).to.equal(TARGET.toString()); // 50% + 50% = 100%
  });

  it("submitting the SAME milestone twice reverts (no double-pay)", async function () {
    await setupFundedCampaign();

    await crowdFunding.connect(contractor).submitProgressProof(campaignId, 0);
    try {
      await crowdFunding.connect(contractor).submitProgressProof(campaignId, 0);
      expect.fail("Should have reverted");
    } catch (error) {
      expect(error.message).to.include("Milestone already completed.");
    }
  });

  it("claimMilestonePayment reverts when already released via submitProgressProof", async function () {
    await setupFundedCampaign();

    await crowdFunding.connect(contractor).submitProgressProof(campaignId, 1);
    try {
      await crowdFunding.connect(contractor).claimMilestonePayment(campaignId, 1);
      expect.fail("Should have reverted");
    } catch (error) {
      expect(error.message).to.include("Milestone payment already released.");
    }
  });

  it("tracker: totalReleased matches sum of milestone releases", async function () {
    await setupFundedCampaign();

    await crowdFunding.connect(contractor).submitProgressProof(campaignId, 0);

    const camp = await crowdFunding.campaigns(campaignId);
    expect(camp.totalReleased.toString()).to.equal(TARGET.div(2).toString());

    // milestonesCompleted is a dynamic array, exposed via the view helper.
    const completed = await crowdFunding.getCampaignMilestones(campaignId);
    expect(completed[0]).to.equal(true);
    expect(completed[1]).to.equal(false);
  });
});