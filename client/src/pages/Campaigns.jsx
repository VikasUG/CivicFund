import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { DisplayCampaigns } from '../components';
import { useStateContext } from '../context';

const Campaigns = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const { address, connectWallet, getCampaigns, getCampaignsWithStatus, refreshKey, userType } = useStateContext();
  const navigate = useNavigate();

  const handleStartCampaign = async () => {
    if (address) {
      navigate('/create-campaign');
      return;
    }
    try {
      await connectWallet();
      navigate('/create-campaign');
    } catch (error) {
      console.error('Start campaign connect error:', error);
    }
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await getCampaigns();
      const campaignsWithStatus = getCampaignsWithStatus(data);
      setCampaigns(campaignsWithStatus);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [refreshKey]);

  useEffect(() => {
    const handleRefresh = () => fetchCampaigns();
    window.addEventListener('refreshCampaigns', handleRefresh);
    return () => window.removeEventListener('refreshCampaigns', handleRefresh);
  }, []);

  return (
    <section className="py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-epilogue text-[22px] font-bold text-[var(--text-primary)]">
          Discover Campaigns
        </h2>
        {userType !== 'contractor' && (
          <button
            onClick={handleStartCampaign}
            className="self-start rounded-lg bg-[var(--accent)] px-6 py-3 font-epilogue text-[15px] font-semibold text-white transition-opacity hover:opacity-90 sm:self-auto"
          >
            Start a Campaign
          </button>
        )}
      </div>
      <div className="mt-6">
        <DisplayCampaigns
          title="All Campaigns"
          isLoading={isLoading}
          campaigns={campaigns}
        />
      </div>
    </section>
  );
};

export default Campaigns;