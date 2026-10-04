import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useStateContext } from "../context";
import { CountBox, CustomButton, Loader } from "../components";
import { calculateBarPercentage, daysLeft, formatEth, parseEth } from "../utils";
import { thirdweb } from "../assets";


const CampaignDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { donate, getDonations, contract, address } = useStateContext();

  const [campaign, setCampaign] = useState(state);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [donationError, setDonationError] = useState("");
  const [donators, setDonators] = useState([]);

  useEffect(() => {
    setCampaign(state);
  }, [state]);

  const remainingDays = daysLeft(campaign?.deadline);
  
  // Calculate percentage of funds raised
  const targetAmount = parseEth(campaign?.target);
  const collectedAmount = parseEth(campaign?.amountCollected);
  const remainingAmount = Math.max(targetAmount - collectedAmount, 0);
  const percentage = targetAmount > 0 ? Math.min((collectedAmount / targetAmount) * 100, 100) : 0;

  const validateDonationAmount = (value) => {
    if (!value || value === "") {
      setDonationError("");
      return false;
    }

    const donationAmount = parseFloat(value);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      setDonationError("Please enter a valid donation amount greater than 0.");
      return false;
    }

    if (donationAmount > remainingAmount) {
      setDonationError(`Donation amount cannot exceed the remaining target. You can donate at most ${remainingAmount.toFixed(2)} ETH.`);
      return false;
    }

    setDonationError("");
    return true;
  };

  /**
   * Fetches the list of donators for the campaign.
   */
  const fetchDonators = async () => {
    const campaignId = campaign?.pId ?? state?.pId;
    if (campaignId == null) return;

    const data = await getDonations(campaignId);
    setDonators(data);

    // Re-fetch the campaign details to update amountCollected
    if (contract) {
      const updatedCampaigns = await contract.call("getCampaigns");
      const updatedCampaign = updatedCampaigns[campaignId];

      if (updatedCampaign) {
        setCampaign(prev => ({
          ...prev,
          amountCollected: updatedCampaign.amountCollected?.toString?.() ?? prev?.amountCollected,
        }));
      }
    }
  };

  useEffect(() => {
    if (contract) fetchDonators();
  }, [contract, address, campaign?.pId]);

  /**
   * Handles the donation to a campaign.
   */
  const handleDonate = async () => {
    // Validate amount before processing
    if (!amount || amount === '') {
      const emptyMessage = 'Please enter a donation amount';
      setDonationError(emptyMessage);
      alert(emptyMessage);
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      const invalidMessage = 'Please enter a valid donation amount greater than 0';
      setDonationError(invalidMessage);
      alert(invalidMessage);
      return;
    }

    if (donationAmount > remainingAmount) {
      const tooHighMessage = `Donation amount cannot exceed the remaining target. You can donate at most ${remainingAmount.toFixed(2)} ETH.`;
      setDonationError(tooHighMessage);
      alert(tooHighMessage);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting donation process with amount:', amount);
      await donate(campaign?.pId ?? state?.pId, amount);
      await fetchDonators();
      
      // Only navigate on successful donation
      alert(' Donation successful! Thank you for your support!');
      navigate("/");
    } catch (error) {
      console.error('Donation failed:', error);
      
      // Show detailed error to user without navigating away
      const errorMessage = error.message || 'Unknown error occurred';
      alert(` Donation failed!\n\n${errorMessage}\n\nPlease check your wallet balance and try again.`);
      
      // Don't navigate on failure - user stays on the page to retry
    } finally {
      setIsLoading(false);
    }
  };

  console.log(
    "Target:",
    state.target,
    "Amount Collected:",
    state.amountCollected
  );

  return (
    <div>
      {isLoading && <Loader />}

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img
            src={state.image}
            alt="campaign"
            className="w-full h-[410px] object-cover rounded-xl"
          />
          
          {/* Enhanced Progress Bar with Percentage */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-epilogue font-medium text-[14px] text-[var(--text-secondary)]">
                Funding Progress
              </span>
              <span className={`font-epilogue font-bold text-[16px] ${
                percentage >= 100 ? 'text-[#1dc071]' :
                percentage >= 50 ? 'text-[#f59e0b]' : 'text-[#8c6dfd]'
              }`}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full h-[8px] bg-[var(--border-color)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  percentage >= 100 ? 'bg-[#1dc071]' :
                  percentage >= 50 ? 'bg-[#f59e0b]' : 'bg-[#8c6dfd]'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-epilogue text-sm text-[var(--text-secondary)]">
                {collectedAmount.toFixed(2)} ETH raised
              </span>
              <span className="font-epilogue text-sm text-[var(--text-secondary)]">
                Goal: {targetAmount.toFixed(2)} ETH
              </span>
            </div>
          </div>
        </div>

        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox title="Days Left" value={remainingDays} />
          <CountBox
            title={`Raised of ${formatEth(campaign?.target)} ETH`}
            value={`${formatEth(campaign?.amountCollected)} ETH`}
          />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">
              Creator
            </h4>
            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[65px] h-[65px] rounded-full bg-[var(--bg-card)] flex justify-center items-center cursor-pointer">
                <img
                  src={thirdweb}
                  alt="user"
                  className="w-[65px] h-[65px] rounded-full"
                />
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-[var(--text-primary)] break-all">
                  {state.owner}
                </h4>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">
              Story
            </h4>
            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] leading-[26px] text-justify">
                {state.description}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">
              Donators
            </h4>
            <div className="mt-[20px] flex flex-col gap-4">
              {donators.length > 0 ? (
                donators.map((item, index) => (
                  <div
                    key={`${item.donator}-${index}`}
                    className="flex justify-between items-center gap-4"
                  >
                <p className="font-epilogue font-normal text-[16px] text-[var(--text-tertiary)] leading-[26px] break-all">
                      {index + 1}. {item.donator}
                    </p>
                    <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] leading-[26px] break-all">
                      {item.donation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] leading-[26px] text-justify">
                  No donators yet. Be the first one!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          {percentage >= 100 ? (
            <div className="mt-[20px] flex flex-col p-4 bg-[var(--bg-secondary)] rounded-[10px]">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[var(--text-primary)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h4 className="font-epilogue font-semibold text-[20px] leading-[30px] text-center text-[#1dc071] mb-2">
                  Campaign Fully Funded!
                </h4>
                <p className="font-epilogue font-medium text-[16px] leading-[24px] text-center text-[var(--text-secondary)] mb-4">
                  This campaign has reached its funding goal of {targetAmount.toFixed(2)} ETH
                </p>
                <div className="bg-[var(--bg-primary)] rounded-[10px] p-4">
                  <p className="font-epilogue font-normal text-[14px] leading-[20px] text-[var(--text-secondary)] text-center">
                    The campaign is now ready for contractor acceptance. Funds are securely held in escrow until milestones are completed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">
                Fund
              </h4>

              <div className="mt-[20px] flex flex-col p-4 bg-[var(--bg-secondary)] rounded-[10px]">
                <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-[var(--text-secondary)]">
                  Fund the campaign
                </p>
                <div className="mt-[30px]">
                  <input
                    type="number"
                    placeholder="ETH 0.1"
                    step="0.01"
                    className="w-full py-[10px] sm:px-[20px] px-[15px] outline-none border-[1px] border-[var(--border-color)] bg-transparent font-epilogue text-[var(--text-primary)] text-[18px] leading-[30px] placeholder:text-[var(--text-placeholder)] rounded-[10px]"
                    value={amount}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setAmount(nextValue);
                      validateDonationAmount(nextValue);
                    }}
                  />

                  {donationError ? (
                    <p className="mt-[8px] font-epilogue text-[14px] text-red-400">
                      {donationError}
                    </p>
                  ) : (
                    <p className="mt-[8px] font-epilogue text-[14px] text-[var(--text-secondary)]">
                      You can donate up to {remainingAmount.toFixed(2)} ETH.
                    </p>
                  )}

                  <div className="my-[20px] p-4 bg-[var(--bg-primary)] rounded-[10px]">
                    <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-[var(--text-primary)]">
                      Back it because you believe in it.
                    </h4>
                    <p className="mt-[10px] font-epilogue font-normal leading-[22px] text-[var(--text-secondary)]">
                      Support the project for no reward, just because it speaks to
                      you.
                    </p>
                    <p className="mt-[8px] font-epilogue font-medium text-[14px] text-[#8c6dfd]">
                      Remaining to fund: {remainingAmount.toFixed(2)} ETH
                    </p>
                  </div>

                  <CustomButton
                    btnType="button"
                    title="Fund Campaign"
                    styles="w-full bg-[#8c6dfd]"
                    handleClick={handleDonate}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
