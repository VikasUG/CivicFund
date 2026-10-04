import React, { useState, useEffect } from 'react'

import { DisplayCampaigns } from '../components';
import { useStateContext } from '../context';

/**
 * UserCampaigns component displays the citizen's own campaigns as a simple list.
 * Contractor-oriented status tabs (Accepted/Pending/Rejected) and milestone
 * breakdowns were removed to keep the citizen experience clean and minimal.
 * @returns {JSX.Element} The rendered UserCampaigns component.
 */
const UserCampaigns = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const { address, getUserCampaigns, getCampaignsWithStatus, refreshKey } = useStateContext();

  /**
   * Fetches user campaigns and manages the loading state.
   * @returns {Promise<void>} A promise that resolves when the campaigns are fetched and loading state is managed.
   */
  const fetchUserCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await getUserCampaigns();
      const campaignsWithStatus = getCampaignsWithStatus(data);
      setCampaigns(campaignsWithStatus);
    } catch (error) {
      console.error('Failed to fetch user campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchUserCampaigns();
    } else {
      setCampaigns([]);
    }
  }, [address, refreshKey]);

  return (
    <div>
      <DisplayCampaigns
        title="My Campaigns"
        isLoading={isLoading}
        campaigns={campaigns}
      />
    </div>
  )
}

export default UserCampaigns