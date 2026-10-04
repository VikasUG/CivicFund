import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useStateContext } from '../context';
import { formatEth } from '../utils';

const FundStatus = ({ campaign }) => {
  const { getContractBalance, getMilestoneProgress, getCampaignMilestones, userType } = useStateContext();
  const [contractBalance, setContractBalance] = useState('0');
  const [milestoneProgress, setMilestoneProgress] = useState({ completed: 0, total: 2 });
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const isContractor = userType === 'contractor';

  useEffect(() => {
    const loadFundData = async () => {
      try {
        setLoading(true);

        // Get total contract balance
        const balance = await getContractBalance();
        setContractBalance(balance);

        if (campaign?.pId == null) {
          console.warn('FundStatus: missing campaign.pId, skipping milestone fetch', campaign);
          return;
        }

        // Milestone details are only needed for the contractor view.
        if (isContractor) {
          const progress = await getMilestoneProgress(campaign.pId);
          setMilestoneProgress(progress);

          const campaignMilestones = await getCampaignMilestones(campaign.pId);
          setMilestones(campaignMilestones);
        } else {
          const progress = await getMilestoneProgress(campaign.pId);
          setMilestoneProgress(progress);
        }
      } catch (error) {
        console.error('Failed to load fund status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (campaign) {
      loadFundData();
    }
  }, [campaign, getContractBalance, getMilestoneProgress, getCampaignMilestones, isContractor]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-[10px] p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--border-color)] rounded mb-2"></div>
          <div className="h-3 bg-[var(--border-color)] rounded mb-2"></div>
          <div className="h-3 bg-[var(--border-color)] rounded"></div>
        </div>
      </div>
    );
  }

  const progressPercentage = milestoneProgress.total > 0
    ? (milestoneProgress.completed / milestoneProgress.total) * 100
    : 0;

  const formatCampaignValue = (value) => {
    if (value == null) return '0.0';
    if (typeof value === 'object' && value._isBigNumber) {
      return parseFloat(ethers.utils.formatEther(value)).toFixed(1);
    }

    const stringValue = value.toString();
    const numericValue = Number(stringValue);
    if (Number.isNaN(numericValue)) return '0.0';

    // If value is >= 1e15, it's wei - convert to ETH
    if (numericValue >= 1e15) {
      return (numericValue / 1e18).toFixed(1);
    }

    return numericValue.toFixed(1);
  };

  const milestoneTarget = () => {
    const ethTarget = parseFloat(formatEth(campaign.target, 3));
    const milestoneAmount = (ethTarget / 2).toFixed(3);
    console.log(' Milestone calculation:', {
      campaignTarget: campaign.target,
      ethTarget,
      milestoneAmount,
      calculation: `${ethTarget} / 2 = ${milestoneAmount}`,
      rawCalculation: ethTarget / 2
    });
    return milestoneAmount;
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-[10px] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-epilogue font-semibold text-[16px] text-[var(--text-primary)]">Fund Status</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-500">Escrow Protected</span>
        </div>
      </div>

      {/* Contract Balance */}
      <div className="bg-[var(--bg-card)] rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-secondary)]">Total Held in Escrow</span>
          <span className="font-epilogue font-bold text-lg text-[var(--text-primary)]">{contractBalance} ETH</span>
        </div>
      </div>

      {/* Campaign Specific Info */}
      <div className="bg-[var(--bg-card)] rounded-lg p-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-[var(--text-secondary)]">Campaign Raised</span>
            <div className="font-epilogue font-semibold text-[var(--text-primary)]">
              {formatCampaignValue(campaign.amountCollected)} ETH
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)]">Campaign Target</span>
            <div className="font-epilogue font-semibold text-[var(--text-primary)]">
              {formatCampaignValue(campaign.target)} ETH
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-secondary)]">Completion Progress</span>
          <span className="text-xs text-[var(--text-primary)]">
            {milestoneProgress.completed}/{milestoneProgress.total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[var(--border-color)] rounded-full h-2">
          <div
            className="bg-[#1dc071] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Individual Milestones - contractor only */}
      {isContractor && milestones.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-[var(--text-secondary)]">Milestone Breakdown</span>
          <div className="space-y-1">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-[var(--bg-card)] rounded">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.completed ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-xs text-[var(--text-primary)]">Milestone {index + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {milestoneTarget()} ETH
                  </span>
                  {milestone.completed && (
                    <span className="text-xs text-green-500"> Released</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fund Flow Explanation */}
      <div className="border-t border-[var(--border-color)] pt-3">
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <p><strong>Fund Flow:</strong></p>
          <p>1. Donations to Smart Contract (Escrow)</p>
          <p>2. Milestone Completion to Contractor Payment</p>
          <p>3. All funds protected until milestones met</p>
        </div>
      </div>

      {/* Contractor Status */}
      {campaign.contractor && campaign.contractor !== '0x0000000000000000000000000000000000000000' && (
        <div className="bg-[#8c6dfd20] border border-[#8c6dfd] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8c6dfd]">Contractor Assigned</span>
            <span className="text-xs text-[var(--text-primary)]">
              {campaign.contractor.slice(0, 6)}...{campaign.contractor.slice(-4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundStatus;