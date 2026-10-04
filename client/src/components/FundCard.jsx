import React from "react";

import { tagType, thirdweb } from "../assets";

import { daysLeft, formatEth, parseEth } from "../utils";

import { FundStatus } from "./index";

const FundCard = ({
  owner,
  title,
  description,
  target,
  deadline,
  amountCollected,
  image,
  handleClick,
  pId,
  contractor,
  category,
  status = 'pending'
}) => {

  console.log(` FundCard rendering for campaign ${pId}:`, {
    image: image,
    imageLength: image?.length,
    imageType: typeof image,
    title: title
  });

  const remainingDays = daysLeft(deadline);

  const inferCategory = (titleText, descriptionText) => {
    const text = `${titleText || ''} ${descriptionText || ''}`.toLowerCase();

    const infrastructureRegex = /\b(pothole|road|asphalt|street|highway|roadway|sidewalk|pavement|drainage|bridge|culvert|infrastructure|repair|patch|roads)\b/;
    const educationRegex = /\b(school|education|learning|classroom|college|university|students|teaching|library|books|tutor)\b/;
    const parksRegex = /\b(park|playground|garden|green space|trees|landscaping|recreation)\b/;

    if (infrastructureRegex.test(text)) return 'Infrastructure';
    if (parksRegex.test(text)) return 'Parks';
    if (educationRegex.test(text)) return 'Education';
    return 'Community';
  };

  const campaignCategory = category || inferCategory(title, description);

  

  // Calculate percentage of funds raised
  const targetEth = formatEth(target);
  const collectedEth = formatEth(amountCollected);
  const targetValue = parseEth(target);
  const collectedValue = parseEth(amountCollected);
  const percentage = targetValue > 0 ? Math.min((collectedValue / targetValue) * 100, 100) : 0;



  return (

    <div

      className="sm:w-[288px] w-full rounded-[15px] bg-[var(--bg-secondary)] cursor-pointer"

      onClick={handleClick} //this is the function that will be called when the card is clicked, passed from props

    >

      <img

        src={image || ''}

        alt="fund"

        className="w-full h-[158px] object-cover rounded-[15px]"

        onError={(e) => {
          console.error(' Campaign image failed to load:', {
            image: image,
            imageLength: image?.length,
            imageType: typeof image,
            currentSrc: e.target.currentSrc,
            naturalWidth: e.target.naturalWidth,
            naturalHeight: e.target.naturalHeight,
            error: e.target.error
          });
          // Prevent infinite loop by only setting fallback once
          if (!e.target.dataset.fallbackSet) {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFjMWMyNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FtcGFpZ24gSW1hZ2U8L3RleHQ+PC9zdmc+';
            e.target.dataset.fallbackSet = 'true';
          }
        }}

        onLoad={(e) => {
          console.log(' Campaign image loaded successfully:', {
            image: image,
            currentSrc: e.target.currentSrc,
            naturalWidth: e.target.naturalWidth,
            naturalHeight: e.target.naturalHeight
          });
        }}

      />



      <div className="flex flex-col p-4">

        <div className="flex flex-row items-center mb-[18px]">
          <img
            src={tagType}
            alt="tag"
            className="w-[17px] h-[17px] object-contain"
          />
          <p className="ml-[12px] mt-[2px] font-epilogue font-medium text-[12px] text-[var(--text-secondary)]">
            {campaignCategory}
          </p>
          
          {/* Acceptance Status Badge */}
          <div className="ml-auto">
            {status === 'accepted' ? (
              <div className="px-2 py-1 bg-[#1dc07120] border border-[#1dc071] rounded-full">
                <span className="text-[10px] font-epilogue font-medium text-[#1dc071]">
                   Accepted
                </span>
              </div>
            ) : status === 'rejected' ? (
              <div className="px-2 py-1 bg-[#ef444420] border border-[#ef4444] rounded-full">
                <span className="text-[10px] font-epilogue font-medium text-[#ef4444]">
                   Rejected
                </span>
              </div>
            ) : (
              <div className="px-2 py-1 bg-[#f59e0b20] border border-[#f59e0b] rounded-full">
                <span className="text-[10px] font-epilogue font-medium text-[#f59e0b]">
                   Pending
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Below is just displaying content passed with some nice styles */}

        <div className="block">

          <h3 className="font-epilogue font-semibold text-[16px] text-[var(--text-primary)] text-left leading-[26px] truncate">

            {title}

          </h3>

          <p className="mt-[5px] font-epilogue font-normal text-[var(--text-secondary)] text-left leading-[18px] truncate">

            {description}

          </p>

        </div>



        <div className="flex justify-between flex-wrap mt-[15px] gap-2">

          <div className="flex flex-col">

            <h4 className="font-epilogue font-semibold text-[14px] text-[var(--text-tertiary)] leading-[22px]">

              {collectedEth} ETH

            </h4>

            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-[var(--text-secondary)] sm:max-w-[120px] truncate">

              Raised of {targetEth} ETH

            </p>

          </div>

          <div className="flex flex-col">

            <h4 className="font-epilogue font-semibold text-[14px] text-[var(--text-tertiary)] leading-[22px]">

              {remainingDays}

            </h4>

            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-[var(--text-secondary)] sm:max-w-[120px] truncate">

              Days Left

            </p>

          </div>

        </div>



        <div className="flex items-center mt-[20px] gap-[12px]">

          <div className="w-[30px] h-[30px] rounded-full flex justify-center items-center bg-[var(--bg-primary)]">

           <div className="w-[30px] h-[30px] rounded-full bg-[var(--bg-card)] flex justify-center items-center cursor-pointer">

             <img src={thirdweb} alt="user" className="w-[30px] h-[30px] rounded-full" />

           </div>

          </div>

          <p className="flex-1 font-epilogue font-normal text-[12px] text-[var(--text-secondary)] truncate">

            by <span className="text-[var(--text-tertiary)]">{owner}</span>

          </p>

        </div>

        {/* Fund Status Component */}
        <div className="mt-[20px]">
          <FundStatus 
            campaign={{
              pId,
              amountCollected,
              target,
              contractor
            }} 
          />
        </div>

      </div>

    </div>

  );

};



export default FundCard;

