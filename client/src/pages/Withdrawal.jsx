import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context';
import { CustomButton, FormField, Loader } from '../components';
import { formatEth } from '../utils';

const Withdrawal = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  const { 
    withdrawFunds,
    getUserCampaigns,
    address,
    getContractBalance
  } = useStateContext();

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (address) {
        const userCampaigns = await getUserCampaigns();
        setCampaigns(userCampaigns);
      }
    };

    fetchCampaigns();
  }, [address, getUserCampaigns]);

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!selectedCampaign) {
        throw new Error('Please select a campaign');
      }

      if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
        throw new Error('Please enter a valid withdrawal amount');
      }

      await withdrawFunds(selectedCampaign, withdrawalAmount);
      
      // Reset form
      setWithdrawalAmount('');
      setSelectedCampaign('');
      
      // Refresh campaigns to update balance
      const updatedCampaigns = await getUserCampaigns();
      setCampaigns(updatedCampaigns);
      
      alert(' Withdrawal successful!');
      
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert(' Withdrawal failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignSelect = (campaignId) => {
    const campaign = campaigns.find(c => c.pId === campaignId);
    setSelectedCampaign(campaignId);
    
    // Calculate available balance for selected campaign
    if (campaign) {
      const totalDonated = parseFloat(campaign.amountCollected || 0);
      setAvailableBalance(totalDonated);
    } else {
      setAvailableBalance(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-epilogue font-bold text-[24px] text-[var(--text-primary)]">
           Withdraw Funds
        </h2>
        <div className="text-[var(--text-secondary)] text-sm">
          Available Balance: {formatEth(availableBalance)} ETH
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-[15px] p-6 space-y-6">
        {/* Campaign Selection */}
        <div>
          <FormField
            labelName="Select Campaign *"
            inputType="select"
            value={selectedCampaign}
            handleChange={(e) => handleCampaignSelect(e.target.value)}
          >
            <option value="">Choose a campaign...</option>
            {campaigns.map((campaign) => (
              <option key={campaign.pId} value={campaign.pId}>
                {campaign.title} (ID: {campaign.pId})
              </option>
            ))}
          </FormField>
        </div>

        {selectedCampaign && (
          <div className="bg-[var(--bg-card)] p-4 rounded-lg">
            <h3 className="font-epilogue font-semibold text-[var(--text-primary)] text-lg mb-4">
              Campaign Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">Campaign:</span>
                <span className="text-[var(--text-primary)] ml-2 font-epilogue">
                  {campaigns.find(c => c.pId === selectedCampaign)?.title || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Target:</span>
                <span className="text-[var(--text-primary)] ml-2 font-epilogue">
                  {formatEth(campaigns.find(c => c.pId === selectedCampaign)?.target || 0)} ETH
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Raised:</span>
                <span className="text-[#1dc071] ml-2 font-epilogue">
                  {formatEth(campaigns.find(c => c.pId === selectedCampaign)?.amountCollected || 0)} ETH
                </span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[var(--text-secondary)]">Available for Withdrawal:</span>
              <span className="text-[#1dc071] ml-2 font-epilogue font-bold">
                {formatEth(availableBalance)} ETH
              </span>
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        <div>
          <FormField
            labelName="Withdrawal Amount (ETH) *"
            placeholder="Enter amount to withdraw"
            inputType="text"
            value={withdrawalAmount}
            handleChange={(e) => setWithdrawalAmount(e.target.value)}
          />
        </div>

        <CustomButton
          btnType="submit"
          title={isLoading ? "Processing..." : "Withdraw Funds"}
          styles="bg-[#1dc071] w-full"
          handleClick={handleWithdrawal}
          disabled={isLoading || !selectedCampaign || !withdrawalAmount}
        />
      </div>
    </div>
  );
};

export default Withdrawal;
