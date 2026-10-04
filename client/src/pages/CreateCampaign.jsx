import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { CustomButton, FormField, Loader, CivicImageAnalysis } from '../components';
import { checkIfImage } from '../utils';
import { money } from '../assets';

import { useStateContext } from '../context';

const CATEGORY_MAX_VALUES = {
  pothole_repair: { label: 'Pothole Repair', maxEth: 0.1 },
  playground: { label: 'Playground', maxEth: 0.667 },
  footpath_crossing: { label: 'Footpath / Crossing', maxEth: 0.25 },
  street_furniture: { label: 'Street Furniture', maxEth: 0.167 },
  street_signage: { label: 'Street Signage', maxEth: 0.083 }
};

const formatEthValue = (value) => {
  if (typeof value === 'number') {
    return Number(value.toFixed(3)).toString();
  }
  return value;
};

const getCategoryLimit = (category) => {
  if (!category || !CATEGORY_MAX_VALUES[category]) {
    return null;
  }

  return CATEGORY_MAX_VALUES[category];
};

const getScoreBasedTarget = (category, score) => {
  const config = getCategoryLimit(category);
  if (!config || typeof score !== 'number' || Number.isNaN(score)) {
    return null;
  }

  const safeScore = Math.min(10, Math.max(0, score));
  const limit = config.maxEth;
  const value = (limit * safeScore) / 10;
  return Number(value.toFixed(3));
};

/**
 * Component for creating a campaign.
 * 
 * @returns {JSX.Element} The CreateCampaign component.
 */
const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const { createCampaign } = useStateContext();
  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    target: '', 
    deadline: '',
    image: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm({ ...form, image: reader.result });
        setShowAnalysis(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);

    const recommendedTarget = getScoreBasedTarget(result?.category, result?.overallScore);
    if (recommendedTarget != null && (!form.target || form.target.trim() === '')) {
      setForm((prevForm) => ({
        ...prevForm,
        target: `ETH ${formatEthValue(recommendedTarget)}`
      }));
    }
  };

  /**
   * Handles the change event of a form field.
   * 
   * @param {string} fieldName - The name of the form field.
   * @param {object} e - The event object.
   */
  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value })
  }

  const parseDeadlineDate = (deadline) => {
    if (deadline == null || deadline === '') return null;
    if (deadline instanceof Date) {
      return Number.isNaN(deadline.getTime()) ? null : deadline;
    }

    if (typeof deadline === 'number') {
      const date = String(deadline).length <= 10 ? new Date(deadline * 1000) : new Date(deadline);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const normalized = String(deadline).trim();
    if (!normalized) return null;

    if (/^\d+$/.test(normalized)) {
      const value = Number(normalized);
      const date = normalized.length <= 10 ? new Date(value * 1000) : new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const date = new Date(`${normalized}T00:00:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  /**
   * Handles the form submission.
   * 
   * @param {object} e - The event object.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: Log current form state
    console.log('Current form state:', form);
    console.log('Deadline value:', form.deadline);
    console.log('Deadline type:', typeof form.deadline);

    // Check if image is provided and validate lengths
    if (!form.image) {
      alert('Please provide a campaign image');
      return;
    }

    // Validate string lengths to prevent high gas costs
    if (form.title.length > 100) {
      alert('Title is too long. Maximum 100 characters allowed.');
      return;
    }
    if (form.description.length > 1000) {
      alert('Description is too long. Maximum 1000 characters allowed.');
      return;
    }
    if (form.image.length > 15000) {
      alert('Image is too large. Please use a smaller image (max 10KB) or convert to IPFS hash.');
      return;
    }

    // Check if YOLO analysis is complete and valid
    if (!analysisResult) {
      alert('Please wait for image analysis to complete');
      return;
    }

    // Validate deadline is not in the past using local date parsing
    const selectedDate = parseDeadlineDate(form.deadline);
    if (!selectedDate) {
      alert('Invalid campaign deadline. Please select a valid date.');
      return;
    }

    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of current day

    if (selectedDate <= today) {
      alert('Please select a future date for the campaign deadline');
      return;
    }

    // Validate YOLO score - high score means needs attention (good for campaign), low score means doesn't need attention
    if (analysisResult.overallScore < 6.0) {
      alert(`Campaign rejected: Image analysis shows score of ${analysisResult.overallScore}/10. This suggests the area doesn\'t need significant work/repairs. Campaigns should focus on areas that need attention.`);
      return;
    }

    // Additional validation for deadline
    if (!form.deadline || form.deadline === '' || form.deadline === undefined) {
      alert('Please select a campaign deadline');
      return;
    }

    // Validate and parse target amount
    let targetAmount;
    if (!form.target || form.target === '') {
      alert('Please enter a campaign goal amount');
      return;
    }

    try {
      // Remove "ETH " prefix if present and convert to number
      const targetValue = form.target.replace('ETH', '').trim();
      const parsedTarget = Number(targetValue);

      if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
        throw new Error('Invalid target amount');
      }

      const targetCategory = analysisResult?.category || 'pothole_repair';
      const categoryLimit = getCategoryLimit(targetCategory);
      const recommendedCap = getScoreBasedTarget(targetCategory, analysisResult?.overallScore ?? 0);

      if (categoryLimit && recommendedCap != null && parsedTarget > recommendedCap + 0.0001) {
        alert(`Target exceeds the allowed maximum for this category (${categoryLimit.label}). Maximum allowed at ${analysisResult?.overallScore ?? 0}/10 is ${recommendedCap.toFixed(3)} ETH.`);
        return;
      }

      targetAmount = ethers.utils.parseUnits(targetValue, 18);
      console.log('Parsed target amount:', targetAmount.toString());
    } catch (error) {
      alert('Invalid target amount. Please enter a valid number like "0.01"');
      return;
    }

    setIsLoading(true);
    
    try {
      const deadlineDate = parseDeadlineDate(form.deadline);
      if (!deadlineDate) {
        alert('Invalid campaign deadline. Please select a valid future date.');
        setIsLoading(false);
        return;
      }
      deadlineDate.setHours(23, 59, 59, 999);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
      if (Number.isNaN(deadlineTimestamp) || deadlineTimestamp <= 0) {
        alert('Invalid campaign deadline. Please select a valid future date.');
        setIsLoading(false);
        return;
      }

      // Create a copy of form with properly formatted values
      const campaignForm = {
        ...form,
        target: targetAmount, // Use the parsed wei amount
        deadline: deadlineTimestamp, // Use unix timestamp seconds for the smart contract
        category: analysisResult?.category || 'pothole_repair',
        score: Math.round((analysisResult?.overallScore ?? 0) * 10)
      };
      
      console.log('Submitting campaign with form:', campaignForm);
      
      await createCampaign(campaignForm);
      setIsLoading(false);
      navigate('/user-campaigns');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      
      // Show detailed error in alert
      const errorMessage = error?.reason || error?.message || (typeof error === 'string' ? error : 'Unknown error occurred');
      alert(`Campaign creation failed!\n\nError: ${errorMessage}\n\nPlease check your wallet connection and try again.`);
      
      // Also show error details in console if available
      if (typeof window !== 'undefined' && window.lastError) {
        console.log('Last error details:', window.lastError);
        
        // Show error details in a more user-friendly way
        const errorDetails = `
Error Details:
- Message: ${window.lastError.message}
- Code: ${window.lastError.code}
- Reason: ${window.lastError.reason || 'N/A'}
- Time: ${window.lastError.timestamp}
        `;
        console.log(errorDetails);
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <Loader />}
      <div className='flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[var(--border-color)] rounded-[10px]'>
        <h1 className='font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-[var(--text-primary)]'>Start a campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className='w-full mt-[65px] flex flex-col gap-[30px]'>
        <div className="flex flex-wrap gap-[40px]">
          <FormField 
            labelName="Your Name *"
            placeholder="John Doe"
            inputType="text"
            value={form.name}
            handleChange={(e) => handleFormFieldChange('name', e)}
          />
          <FormField 
            labelName="Campaign Title *"
            placeholder="Write a title"
            inputType="text"
            value={form.title}
            handleChange={(e) => handleFormFieldChange('title', e)}
          />
        </div>
        <FormField 
          labelName="Description *"
          placeholder="Write a description of your campaign"
          isTextArea
          value={form.description}
          handleChange={(e) => handleFormFieldChange('description', e)}
        />
        <div className="flex flex-wrap gap-[40px]">
          <FormField 
            labelName="Goal *"
            placeholder="ETH 0.50"
            inputType="text"
            value={form.target}
            handleChange={(e) => handleFormFieldChange('target', e)}
          />
          <FormField 
            labelName="End Date *"
            placeholder="End Date"
            inputType="date"
            value={form.deadline}
            handleChange={(e) => handleFormFieldChange('deadline', e)}
            min={new Date().toISOString().split('T')[0]} // Set minimum date to today
          />
        </div>
        <div>
          <label className="flex-1 flex flex-col">
            <span className="font-epilogue font-medium text-[14px] text-[var(--text-secondary)] mb-[10px]">
              Campaign image *
            </span>
            <div className="relative">
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="campaign-image-upload"
              />
              <label 
                htmlFor="campaign-image-upload"
                className="flex-1 flex flex-col items-center justify-center w-full h-[200px] bg-[var(--bg-card)] rounded-[10px] border-2 border-dashed border-[var(--text-placeholder)] cursor-pointer hover:border-[var(--text-tertiary)] transition-all"
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={imagePreview} 
                      alt="Campaign preview" 
                      className="w-full h-full object-contain rounded-[8px]"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview('');
                        setForm({ ...form, image: '' });
                        setShowAnalysis(false);
                        setAnalysisResult(null);
                      }}
                      className="absolute top-2 right-2 bg-[#ef4444] text-[var(--text-primary)] p-2 rounded-full hover:bg-[#ef444480] transition-all"
                    >
                      
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-[var(--border-color)] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 4v6m0-4h8m-8-4v16m8-16v4" />
                      </svg>
                    </div>
                    <span className="text-[var(--text-secondary)] text-sm">Click to upload campaign image</span>
                  </div>
                )}
              </label>
            </div>
          </label>
        </div>

        {/* Show YOLO Analysis Results */}
        {showAnalysis && (
          <div className="mt-4">
            <CivicImageAnalysis
              imageUrl={imagePreview}
              analysisMode="campaign"
              milestone={100}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        )}

        {/* Show Analysis Results */}
        {analysisResult && (
          <div className="mt-4 p-4 bg-[var(--bg-card)] rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-epilogue font-medium text-[14px] text-[var(--text-secondary)]">
                Image Analysis Score
              </span>
              <span className={`font-epilogue font-bold text-lg ${
                analysisResult.overallScore >= 6.0 ? 'text-[#1dc071]' : 'text-[#ef4444]'
              }`}>
                {analysisResult.overallScore}/10
              </span>
            </div>
            <div className={`text-sm p-3 rounded ${
              analysisResult.overallScore >= 6.0 ? 'bg-[#1dc07120] text-[#1dc071]' : 'bg-[#ef444420] text-[#ef4444]'
            }`}>
              {analysisResult.overallScore >= 6.0 
                ? ' High Score - Area needs attention (Good for campaign!)' 
                : ' Low Score - Area doesn\'t need significant work'}
            </div>
            {analysisResult.category && (
              <div className="mt-3 text-sm text-[var(--text-secondary)]">
                <span className="font-medium">Detected category:</span> {getCategoryLimit(analysisResult.category)?.label || analysisResult.category}
                <span className="mx-2">•</span>
                <span className="font-medium">Max:</span> {getCategoryLimit(analysisResult.category)?.maxEth ?? 'N/A'} ETH
                <span className="mx-2">•</span>
                <span className="font-medium">Suggested target:</span> {getScoreBasedTarget(analysisResult.category, analysisResult.overallScore)?.toFixed(3) ?? 'N/A'} ETH
              </div>
            )}
            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div className="mt-3">
                <p className="font-epilogue text-sm text-[var(--text-secondary)] mb-2">Analysis Recommendations:</p>
                <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {/* Debug Panel - Show last error */}
        {typeof window !== 'undefined' && window.lastError && (
          <div className="mt-4 p-3 bg-[#ef444420] border border-[#ef4444] rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-epilogue font-medium text-[#ef4444] text-sm mb-1">Debug Info:</p>
                <p className="font-epilogue text-xs text-[var(--text-secondary)] mb-1">Error: {window.lastError.message}</p>
                <p className="font-epilogue text-xs text-[var(--text-secondary)]">Code: {window.lastError.code || 'N/A'}</p>
                <p className="font-epilogue text-xs text-[var(--text-secondary)]">Time: {window.lastError.timestamp}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.lastError = null;
                    // Force re-render
                    window.location.reload();
                  }
                }}
                className="ml-2 text-[#ef4444] hover:text-[#ef444480]"
              >
                
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-center items-center mt-[40px]">
          <CustomButton 
            btnType="submit"
            title="Submit new campaign"
            styles="bg-[#1dc071]"
          />
        </div>
      </form>
    </div>
  )
}

export default CreateCampaign