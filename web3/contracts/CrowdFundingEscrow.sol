// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "hardhat/console.sol";

contract CrowdFundingEscrow {
    struct Campaign {
        address owner;
        address contractor;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] donators;
        uint256[] donations;
        bool[] milestonesCompleted;   // index 0 = 50%, index 1 = 100%
        uint256 milestoneCount;
        uint256 milestoneAmount;
        uint256 totalReleased;
        bool fundsReleased;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public numberOfCampaigns;

    // Released (via EITHER release path) per campaign + milestone index.
    // Kept OUTSIDE the Campaign struct on purpose so the on-chain struct
    // layout / ABI is unchanged and existing client ABIs keep decoding
    // getCampaigns() correctly.
    mapping(uint256 => mapping(uint256 => bool)) public milestonePaid;

    // Events for transparency
    event CampaignCreated(uint256 indexed campaignId, address indexed owner, string title, uint256 target);
    event DonationMade(uint256 indexed campaignId, address indexed donator, uint256 amount);
    event ProjectAccepted(uint256 indexed campaignId, address indexed contractor);
    event MilestoneCompleted(uint256 indexed campaignId, uint256 milestoneIndex, address indexed contractor);
    event FundsReleased(uint256 indexed campaignId, address indexed contractor, uint256 amount);
    event RefundIssued(uint256 indexed campaignId, address indexed donator, uint256 amount);

    function _getCategoryCap(string memory _category) internal pure returns (uint256) {
        bytes32 categoryHash = keccak256(bytes(_category));

        if (categoryHash == keccak256("pothole_repair")) return 0.1 ether;
        if (categoryHash == keccak256("playground")) return 0.667 ether;
        if (categoryHash == keccak256("footpath_crossing")) return 0.25 ether;
        if (categoryHash == keccak256("street_furniture")) return 0.167 ether;
        if (categoryHash == keccak256("street_signage")) return 0.083 ether;

        return 0;
    }

    function _validateCategoryTarget(string memory _category, uint256 _score, uint256 _target) internal pure {
        require(bytes(_category).length > 0, "Category is required.");
        uint256 categoryCap = _getCategoryCap(_category);
        require(categoryCap > 0, "Unsupported campaign category.");
        require(_score > 0 && _score <= 100, "Score must be between 0 and 10.0.");

        uint256 maxAllowed = (categoryCap * _score) / 100;
        require(_target <= maxAllowed, "Target exceeds category cap");
    }

    function _createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) internal returns (uint256) {
        console.log("=== CREATE CAMPAIGN START ===");
        console.log("Owner:", _owner);
        console.log("Title length:", bytes(_title).length);
        console.log("Description length:", bytes(_description).length);
        console.log("Target:", _target);
        console.log("Deadline (seconds):", _deadline);
        console.log("Block timestamp:", block.timestamp);
        console.log("Image length:", bytes(_image).length);
        
        Campaign storage campaign = campaigns[numberOfCampaigns];
        console.log("Campaign slot:", numberOfCampaigns);

        require(_deadline > block.timestamp, "The deadline should be a date in the future.");
        console.log("Deadline check passed");
        require(_target > 0, "Target amount must be greater than 0.");
        console.log("Target check passed");

        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.image = _image;
        campaign.fundsReleased = false;
        
        // Set up milestones (2 milestones at 50% and 100%)
        campaign.milestoneCount = 2;
        campaign.milestoneAmount = _target / 2;
        campaign.milestonesCompleted = new bool[](2);
        campaign.totalReleased = 0;

        numberOfCampaigns++;
        console.log("Campaign created successfully! ID:", numberOfCampaigns - 1);
        console.log("=== CREATE CAMPAIGN END ===");

        emit CampaignCreated(numberOfCampaigns - 1, _owner, _title, _target);
        return numberOfCampaigns - 1;
    }

    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) public returns (uint256) {
        return _createCampaign(_owner, _title, _description, _target, _deadline, _image);
    }

    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image,
        string memory _category,
        uint256 _score
    ) public returns (uint256) {
        _validateCategoryTarget(_category, _score, _target);
        return _createCampaign(_owner, _title, _description, _target, _deadline, _image);
    }

    function donateToCampaign(uint256 _id) public payable {
        uint256 amount = msg.value;
        console.log("Donation attempt - Campaign ID: %s, Amount: %s, From: %s", _id, amount, msg.sender);
        require(amount > 0, "Donation amount must be greater than 0");

        Campaign storage campaign = campaigns[_id];
        console.log("Campaign owner: %s, Current collected: %s", campaign.owner, campaign.amountCollected);
        require(campaign.owner != address(0), "Campaign does not exist.");
        require(block.timestamp < campaign.deadline, "Campaign has ended.");
        require(!campaign.fundsReleased, "Funds already released to contractor.");
        require(campaign.amountCollected + amount <= campaign.target, "Donation exceeds remaining target amount");

        campaign.donators.push(msg.sender);
        campaign.donations.push(amount);

        // Funds are held in the contract, NOT sent to owner
        campaign.amountCollected = campaign.amountCollected + amount;
        console.log("Donation recorded successfully. New total: %s", campaign.amountCollected);

        emit DonationMade(_id, msg.sender, amount);
    }

    function acceptProject(uint256 _id) public returns (bool) {
        Campaign storage campaign = campaigns[_id];
        require(campaign.owner != address(0), "Campaign does not exist.");
        require(campaign.contractor == address(0), "Project already accepted.");
        require(campaign.owner != msg.sender, "Owner cannot accept their own campaign.");
        require(campaign.amountCollected >= campaign.target, "Campaign must be fully funded before acceptance.");

        campaign.contractor = msg.sender;
        
        emit ProjectAccepted(_id, msg.sender);
        return true;
    }

    // Calculate the amount to release for a given milestone index.
    // - Index 0 (50% stage): at most 50% of target, capped so total never exceeds target.
    // - Index 1 (100% stage): the remaining balance (full funds if claimed directly,
    //   or the remaining 50% if the 50% milestone was already paid).
    // The released amount is independent of the analysis/quality score.
    function _milestoneReleaseAmount(Campaign storage campaign, uint256 _milestoneIndex) internal view returns (uint256) {
        uint256 remaining = campaign.target > campaign.totalReleased
            ? campaign.target - campaign.totalReleased
            : 0;

        if (_milestoneIndex == 0) {
            // 50% milestone: release half of target, but never more than what remains.
            uint256 half = campaign.target / 2;
            return half < remaining ? half : remaining;
        } else {
            // 100% milestone: release everything that remains (full or remaining).
            return remaining;
        }
    }

    function submitProgressProof(uint256 _id, uint256 _milestoneIndex) public {
        Campaign storage campaign = campaigns[_id];
        console.log("Milestone submission - Campaign ID: %s, Milestone: %s, By: %s", _id, _milestoneIndex, msg.sender);
        require(campaign.contractor == msg.sender, "Only assigned contractor can submit proof.");
        require(_milestoneIndex < campaign.milestoneCount, "Invalid milestone index.");
        require(!campaign.milestonesCompleted[_milestoneIndex], "Milestone already completed.");
        require(!milestonePaid[_id][_milestoneIndex], "Milestone payment already released.");
        require(campaign.amountCollected >= campaign.milestoneAmount, "Insufficient funds for milestone.");

        // Mark milestone as completed
        campaign.milestonesCompleted[_milestoneIndex] = true;
        console.log("Milestone marked as completed");

        // Release milestone payment to contractor. The amount is capped by the
        // milestone index — NOT by the analysis score — so a 50% proof can never
        // release more than 50%, even if the score passes the 100% threshold.
        uint256 releaseAmount = _milestoneReleaseAmount(campaign, _milestoneIndex);
        console.log("Attempting to send milestone payment: %s to: %s", releaseAmount, campaign.contractor);
        require(releaseAmount > 0, "No milestone funds available to release.");
        (bool sent,) = payable(campaign.contractor).call{value: releaseAmount}("");
        console.log("Payment transfer result: %s", sent);
        require(sent, "Failed to send milestone payment.");

        campaign.totalReleased = campaign.totalReleased + releaseAmount;
        milestonePaid[_id][_milestoneIndex] = true;
        campaign.fundsReleased = true;

        emit MilestoneCompleted(_id, _milestoneIndex, msg.sender);
        emit FundsReleased(_id, msg.sender, releaseAmount);
    }

    function claimMilestonePayment(uint256 _id, uint256 _milestoneIndex) public {
        Campaign storage campaign = campaigns[_id];
        require(campaign.contractor == msg.sender, "Only contractor can claim milestone payment.");
        require(_milestoneIndex < campaign.milestoneCount, "Invalid milestone index.");
        require(campaign.milestonesCompleted[_milestoneIndex], "Milestone not yet completed.");
        require(!milestonePaid[_id][_milestoneIndex], "Milestone payment already released.");

        // Release the milestone payment (amount is capped by milestone index, NOT by score).
        uint256 releaseAmount = _milestoneReleaseAmount(campaign, _milestoneIndex);
        require(releaseAmount > 0, "No milestone funds available to release.");
        (bool sent,) = payable(campaign.contractor).call{value: releaseAmount}("");
        require(sent, "Failed to send milestone payment.");

        campaign.totalReleased = campaign.totalReleased + releaseAmount;
        milestonePaid[_id][_milestoneIndex] = true;
        campaign.fundsReleased = true;

        emit FundsReleased(_id, msg.sender, releaseAmount);
    }

    function refundDonations(uint256 _id) public {
        Campaign storage campaign = campaigns[_id];
        console.log("Refund request - Campaign ID: %s, By: %s", _id, msg.sender);
        require(campaign.owner == msg.sender || campaign.contractor == msg.sender, "Only owner or contractor can request refund.");
        require(block.timestamp > campaign.deadline, "Campaign has not ended yet.");
        require(campaign.amountCollected > 0, "No funds to refund.");
        require(campaign.contractor == address(0), "Project has been assigned to contractor.");

        console.log("Starting refund process for %s donators", campaign.donators.length);
        // Refund all donators
        for (uint256 i = 0; i < campaign.donators.length; i++) {
            address donator = campaign.donators[i];
            uint256 donationAmount = campaign.donations[i];
            console.log("Refunding donator %s address: %s amount: %s", i, donator, donationAmount);
            
            (bool sent,) = payable(donator).call{value: donationAmount}("");
            console.log("Refund transfer result for donator %s: %s", i, sent);
            require(sent, "Failed to refund donator.");

            emit RefundIssued(_id, donator, donationAmount);
        }
        console.log("All refunds completed successfully");

        // Reset campaign funds
        campaign.amountCollected = 0;
        campaign.donators = new address[](0);
        campaign.donations = new uint256[](0);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getDonators(uint256 _id) view public returns (address[] memory, uint256[] memory) {
        return (campaigns[_id].donators, campaigns[_id].donations);
    }

    function getCampaigns() public view returns (Campaign[] memory) {
        console.log("Getting all campaigns, total count: %s", numberOfCampaigns);
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for(uint i = 0; i < numberOfCampaigns; i++) {
            console.log("Processing campaign %s of %s", i, numberOfCampaigns);
            Campaign storage item = campaigns[i];
            allCampaigns[i] = item;
            // Keep image for display (removed clearing for demo purposes)
        }
        console.log("Campaigns retrieval completed");
        return allCampaigns;
    }

    function getCampaignMilestones(uint256 _id) public view returns (bool[] memory) {
        return campaigns[_id].milestonesCompleted;
    }

    function getMilestoneProgress(uint256 _id) public view returns (uint256 completed, uint256 total) {
        Campaign storage campaign = campaigns[_id];
        uint256 completedCount = 0;
        
        for (uint256 i = 0; i < campaign.milestoneCount; i++) {
            if (campaign.milestonesCompleted[i]) {
                completedCount++;
            }
        }
        
        return (completedCount, campaign.milestoneCount);
    }
}