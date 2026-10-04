
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";

contract CrowdFunding {
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
    }

    mapping(uint256 => Campaign) public campaigns;

    uint256 public numberOfCampaigns = 0;

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
        require(_deadline > block.timestamp, "The deadline should be a date in the future.");
        require(_target > 0, "Target amount must be greater than 0.");

        Campaign storage campaign = campaigns[numberOfCampaigns];

        campaign.owner = _owner;
        campaign.contractor = address(0);
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.image = _image;

        numberOfCampaigns++;

        return numberOfCampaigns - 1;
    }

    function createCampaign(address _owner, string memory _title, string memory _description, uint256 _target, uint256 _deadline, string memory _image) public returns (uint256) {
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
        console.log("Donation attempt - Campaign ID: %s, Amount: %s, From: %s", _id, msg.value, msg.sender);
        require(msg.value > 0, "Donation amount must be greater than 0");
        require(_id < numberOfCampaigns, "Campaign does not exist");
        
        uint256 amount = msg.value;
        Campaign storage campaign = campaigns[_id];
        console.log("Campaign owner: %s, Current collected: %s", campaign.owner, campaign.amountCollected);

        require(campaign.amountCollected + amount <= campaign.target, "Donation exceeds remaining target amount");
        
        // Transfer funds to campaign owner first
        console.log("Attempting transfer to owner...");
        (bool sent,) = payable(campaign.owner).call{value: amount}("");
        console.log("Transfer result: %s", sent);
        
        // Only record donation if transfer was successful
        require(sent, "Donation transfer failed. Please try again.");
        
        // Record donor and donation amount only after successful transfer
        campaign.donators.push(msg.sender);
        campaign.donations.push(amount);
        campaign.amountCollected = campaign.amountCollected + amount;
        console.log("Donation recorded successfully. New total: %s", campaign.amountCollected);
    }

    function acceptProject(uint256 _id) public returns (bool) {
        Campaign storage campaign = campaigns[_id];
        require(campaign.owner != address(0), "Campaign does not exist.");
        require(campaign.contractor == address(0), "Project already accepted.");
        require(campaign.owner != msg.sender, "Owner cannot accept their own campaign.");

        campaign.contractor = msg.sender;
        return true;
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
        }
        console.log("Campaigns retrieval completed");
        return allCampaigns;
    }
}