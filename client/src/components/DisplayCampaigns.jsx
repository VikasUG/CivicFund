import React from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from "uuid";
import FundCard from './FundCard';
import { loader } from '../assets';

//custom component to display campaigns with diff titles & info
const DisplayCampaigns = ({ title, isLoading, campaigns }) => {
  const navigate = useNavigate();

    //function to navigate to campaign details page
  const handleNavigate = (campaign) => {
    navigate(`/campaign-details/${campaign.pId}`, { state: campaign })
  }
  
  return (
    <div>
      <h1 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] text-left">{title} ({campaigns.length})</h1>

      <div className="flex flex-wrap mt-[20px] gap-[26px]">
        {/* Only show loader when actually loading and no campaigns exist yet */}
        {isLoading && campaigns.length === 0 && (
          <div className="flex justify-center w-full">
            <img src={loader} alt="loader" className="w-[100px] h-[100px] object-contain" />
          </div>
        )}

        {/* Show campaigns when not loading or when campaigns exist */}
        {!isLoading && campaigns.length === 0 && (
          <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-[var(--text-secondary)] w-full">
            No campaigns available yet. Be the first to start one.
          </p>
        )}

        {/* map thru cards - show when campaigns exist */}
        {campaigns.length > 0 && campaigns.map((campaign) => <FundCard 
          key={uuidv4()}
            //passing as props to FundCard component
          {...campaign}
          handleClick={() => handleNavigate(campaign)}
        />)}
      </div>
    </div>
  )
}

export default DisplayCampaigns