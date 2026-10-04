import React from 'react';

import { useNavigate } from 'react-router-dom';

import { useStateContext } from '../context';
import { middleImage } from '../assets';

const Home = () => {
  const { address, connectWallet, userType } = useStateContext();
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

  const handleExplore = () => navigate('/campaigns');

  return (
    <div>
      {/* Hero */}
      <section className="grid grid-cols-1 items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        {/* Left content */}
        <div className="flex flex-col items-start">
          <span className="mb-5 inline-block text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Automated Proof of Work &bull; Civic Crowdfunding
          </span>

          <h1 className="font-epilogue text-[34px] font-bold leading-[1.15] text-[var(--text-primary)] sm:text-[46px]">
            Crowdfund Public Works with Automated Trust
          </h1>

          <p className="mt-5 max-w-xl font-epilogue text-[16px] leading-[1.7] text-[var(--text-secondary)]">
            Connect local communities with verified contractors to repair public infrastructure.
            Citizens create and back campaigns with escrowed funds, while registered contractors
            accept and fulfill jobs&mdash;receiving instant payouts once image analysis confirms
            proof of completion.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            {userType !== 'contractor' && (
              <button
                onClick={handleStartCampaign}
                className="rounded-lg bg-[var(--accent)] px-6 py-3 font-epilogue text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Start a Campaign
              </button>
            )}
            <button
              onClick={handleExplore}
              className="font-epilogue text-[15px] font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Explore Campaigns
            </button>
          </div>
        </div>

        {/* Right illustration: reference middle image */}
        <div className="flex justify-center lg:justify-end">
          <img
            src={middleImage}
            alt="Civic proof-of-work inspection"
            className="w-full max-w-[520px] rounded-2xl object-contain shadow-lg ring-1 ring-[var(--border-color)]"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;