import React, { useState } from 'react';
import { CustomButton, FormField, Loader, CivicImageAnalysis } from '../components';
import { useStateContext } from '../context';

const ProgressProof = ({ projectId, currentMilestone, onProofSubmit, onClose, projectType = 'infrastructure', referenceImageUrl }) => {
  const [form, setForm] = useState({
    milestone: Number(currentMilestone) || 50,
    description: '',
    image: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Proof workflow now uses two stages: 50% and 100%
  const milestones = [
    { value: 50, label: '50% - Midpoint Proof' },
    { value: 100, label: '100% - Final Proof (Complete)' },
  ];

  const handleFormFieldChange = (fieldName, e) => {
    const value = fieldName === 'milestone' ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [fieldName]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm({ ...form, image: reader.result });
        setShowAnalysis(true); // Show analysis when image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysisComplete = (analysis) => {
    setAnalysisResult(analysis);
    // Auto-adjust description based on analysis
    if (analysis.overallScore < 6 && !form.description) {
      setForm({ 
        ...form, 
        description: `Work completed with quality score: ${analysis.overallScore}/10. ${analysis.recommendations[0] || ''}`
      });
    }
  };

  const bestFitScore = analysisResult?.bestFitScore ?? 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const safeAnalysis = analysisResult || {
        overallScore: 0,
        bestFitScore: 6,
        canReleaseFunds: false,
        meetsThreshold: false,
        recommendations: ['Analysis unavailable. Please try uploading the image again.']
      };

      const proofData = {
        ...form,
        analysisResult: safeAnalysis
      };
      await onProofSubmit(projectId, proofData);
      onClose();
    } catch (error) {
      console.error('Failed to submit proof:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-[var(--bg-secondary)] rounded-[20px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-epilogue font-bold text-[24px] text-[var(--text-primary)]">
            Submit Progress Proof
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            labelName="Milestone *"
            inputType="select"
            value={form.milestone}
            handleChange={(e) => handleFormFieldChange('milestone', e)}
          >
            {milestones.map((milestone) => (
              <option key={milestone.value} value={milestone.value}>
                {milestone.label}
              </option>
            ))}
          </FormField>

          <FormField
            labelName="Progress Description *"
            placeholder="Describe the work completed for this milestone..."
            inputType="text"
            isTextArea
            rows={4}
            value={form.description}
            handleChange={(e) => handleFormFieldChange('description', e)}
          />

          <div className="space-y-3">
            <label className="font-epilogue font-medium text-[14px] leading-[22px] text-[var(--text-secondary)]">
              Proof Image *
            </label>
            
            <div className="border-2 border-dashed border-[var(--border-color)] rounded-[10px] p-6 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Proof preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setForm({ ...form, image: '' });
                      setShowAnalysis(false);
                      setAnalysisResult(null);
                    }}
                    className="text-[#1dc071] hover:text-[#1dc07180] text-sm"
                  >
                    Remove Image
                  </button>
                  
                  {/* Show Analysis Results */}
                  {showAnalysis && (
                    <div className="mt-4 space-y-4">
                      {referenceImageUrl && (
                        <div className="bg-[var(--bg-primary)] p-3 rounded-lg">
                          <div className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-2">
                            Reference Campaign Image
                          </div>
                          <img
                            src={referenceImageUrl}
                            alt="Reference campaign"
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <CivicImageAnalysis 
                        imageUrl={imagePreview}
                        referenceImageUrl={referenceImageUrl}
                        projectType={projectType}
                        milestone={form.milestone}
                        onAnalysisComplete={handleAnalysisComplete}
                      />
                    </div>
                  )}
                  
                  {/* Show Quality Score */}
                  {analysisResult && (
                    <div className="mt-4 p-4 bg-[var(--bg-card)] rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-epilogue text-[var(--text-primary)] text-sm">Quality Score</span>
                        <span className={`font-epilogue font-bold text-lg ${
                          analysisResult.overallScore >= bestFitScore ? 'text-[#1dc071]' :
                          analysisResult.overallScore >= 6 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>
                          {analysisResult.overallScore}/10
                        </span>
                      </div>
                      <div className="mt-2 text-center">
                        <span className={`text-xs ${
                          analysisResult.canReleaseFunds ? 'text-[#1dc071]' : 'text-[#ef4444]'
                        }`}>
                          {analysisResult.canReleaseFunds ? ' Funds can be released' : ' Quality below threshold'}
                        </span>
                      </div>
                      {analysisResult.similarityScore != null && (
                        <div className="mt-3 text-center text-xs text-[var(--text-secondary)]">
                          Proof similarity to campaign image: <span className="text-[var(--text-primary)]">{Math.round(analysisResult.similarityScore * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-[var(--text-secondary)]">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm">Upload proof image</p>
                    <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[var(--text-primary)] bg-[#8c6dfd] hover:bg-[#8c6dfd80]"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <CustomButton
              btnType="button"
              title="Cancel"
              styles="bg-[#8c6dfd]"
              handleClick={onClose}
            />
            <CustomButton
              btnType="submit"
              title={isLoading ? "Submitting..." : (analysisResult?.canReleaseFunds ? "Submit & Release Funds" : "Submit Proof")}
              styles={analysisResult?.canReleaseFunds ? "bg-[#1dc071]" : "bg-[#8c6dfd]"}
              disabled={isLoading || !form.description || !form.image || (analysisResult && analysisResult.overallScore < 4)}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressProof;
