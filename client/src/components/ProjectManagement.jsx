import React, { useState, useEffect } from 'react';
import { CustomButton, Loader, ProgressProof } from '../components';
import { useStateContext } from '../context';
import { formatEth } from '../utils';

const ProjectManagement = ({ projectType = 'infrastructure' }) => {
  const [availableProjects, setAvailableProjects] = useState([]);
  const [contractorProjects, setContractorProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [showProgressProof, setShowProgressProof] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(50);

  const getMilestoneThreshold = (milestone, analysisResult = null) => {
    if (analysisResult?.bestFitScore != null) {
      return Number(analysisResult.bestFitScore);
    }

    const thresholds = {
      50: 7.0,
      100: 8.2,
    };

    return thresholds[milestone] ?? 8.2;
  };

  const handleOpenProgressProof = (project, milestone = 50) => {
    setSelectedProject(project);
    setSelectedMilestone(milestone);
    setShowProgressProof(true);
  };

  const handleCloseProgressProof = () => {
    setShowProgressProof(false);
    setSelectedProject(null);
    setSelectedMilestone(50);
  };

  const { 
    getAvailableProjects, 
    getContractorProjects, 
    acceptProject,
    getProjectProofs,
    submitProgressProof,
    claimMilestone,
    getCampaignMilestones,
    calculateMilestonePayment,
    getClaimedPayments,
    testContextFunctions,
    address 
  } = useStateContext();

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        testContextFunctions();
        
        const available = await getAvailableProjects();
        const contractor = await getContractorProjects();
        
        // Add proof status to contractor projects
        const contractorWithProofs = await Promise.all(
          contractor.map(async (project) => {
            const proofs = await getProjectProofs(project.pId);
            const completedMilestones = proofs?.filter(p => {
              const threshold = getMilestoneThreshold(p.milestone, p.analysisResult);
              return p.milestone && (p.analysisResult?.overallScore || 0) >= threshold;
            });

            // Use the on-chain milestone state as the single source of truth for
            // released payments instead of stale localStorage "claimed" records
            // that survive contract redeploys.
            let blockchainMilestones = [];
            try {
              blockchainMilestones = await getCampaignMilestones(project.pId);
            } catch (error) {
              console.log(` Could not fetch blockchain milestones for project ${project.pId}:`, error);
              blockchainMilestones = [false, false]; // Default to all not completed
            }

            const latestProofMilestone = proofs?.length > 0 ? Math.max(...proofs.map(p => Number(p.milestone))) : 0;
            const hasClaimed100 = blockchainMilestones.length >= 2 && blockchainMilestones[1]?.completed;
            const nextMilestone = hasClaimed100 ? 100 : latestProofMilestone < 50 ? 50 : 100;
            const completedCount = blockchainMilestones.filter(Boolean).length;
            return {
              ...project,
              proofs: proofs || [],
              currentMilestone: nextMilestone,
              completedMilestones: completedCount,
              claimedMilestones: completedCount,
              blockchainMilestones: blockchainMilestones
            };
          })
        );
        
        setAvailableProjects(available);
        setContractorProjects(contractorWithProofs);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchProjects();
    }
  }, [address, getAvailableProjects, getContractorProjects, getProjectProofs]);

  const handleAcceptProject = async (projectId) => {
    try {
      console.log(' Accepting project:', projectId);
      await acceptProject(projectId);
      console.log(' Project accepted, refreshing data...');
      
      // Add a small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh projects after acceptance
      const available = await getAvailableProjects();
      const contractor = await getContractorProjects();
      
      console.log(' Updated data:', {
        availableProjects: available.length,
        contractorProjects: contractor.length
      });
      
      setAvailableProjects(available);
      setContractorProjects(contractor);
      
      // Switch to My Projects tab to show accepted project
      setActiveTab('my-projects');
      
      // Trigger home page refresh to update campaign status
      window.dispatchEvent(new CustomEvent('refreshCampaigns'));
      
    } catch (error) {
      console.error('Failed to accept project:', error);
    }
  };

  const handleSubmitProof = async (projectId, proofData) => {
    try {
      console.log(' Submitting proof for project:', projectId, proofData);

      const existingProofs = JSON.parse(localStorage.getItem(`campaign_proofs_${projectId}`) || '[]');
      const newProof = {
        milestone: Number(proofData.milestone),
        description: proofData.description,
        image: proofData.image,
        analysisResult: proofData.analysisResult,
        submittedAt: new Date().toISOString(),
        submittedBy: address
      };

      existingProofs.push(newProof);
      localStorage.setItem(`campaign_proofs_${projectId}`, JSON.stringify(existingProofs));

      console.log(' Proof submitted successfully:', newProof);
      window.dispatchEvent(new CustomEvent('proofSubmitted'));

      const available = await getAvailableProjects();
      const contractor = await getContractorProjects();
      const contractorWithProofs = await Promise.all(
        contractor.map(async (project) => {
          const proofs = await getProjectProofs(project.pId);
          const completedMilestones = proofs?.filter(p => {
            const threshold = getMilestoneThreshold(p.milestone, p.analysisResult);
            return p.milestone && (p.analysisResult?.overallScore || 0) >= threshold;
          });
          let blockchainMilestones = [];
          try {
            blockchainMilestones = await getCampaignMilestones(project.pId);
          } catch (error) {
            blockchainMilestones = [false, false];
          }
          const latestProofMilestone = proofs?.length > 0 ? Math.max(...proofs.map(p => Number(p.milestone))) : 0;
          const hasClaimed100 = blockchainMilestones.length >= 2 && blockchainMilestones[1]?.completed;
          const nextMilestone = hasClaimed100 ? 100 : latestProofMilestone < 50 ? 50 : 100;
          const completedCount = blockchainMilestones.filter(Boolean).length;

          return {
            ...project,
            proofs: proofs || [],
            currentMilestone: nextMilestone,
            completedMilestones: completedCount,
            claimedMilestones: completedCount
          };
        })
      );

      setAvailableProjects(available);
      setContractorProjects(contractorWithProofs);

      alert(` Proof for ${proofData.milestone}% milestone submitted successfully!`);
    } catch (error) {
      console.error(' Failed to submit proof:', error);
      alert(' Failed to submit proof. Please try again.');
    }
  };

  const handleClaimPayment = async (projectId, milestone) => {
    try {
      console.log(' Claiming payment for milestone:', milestone);
      
      // Find project data from contractor projects
      const contractorProjects = await getContractorProjects();
      const project = contractorProjects.find(p => p.pId === projectId);
      
      if (!project) {
        throw new Error(`Project ${projectId} not found in contractor projects`);
      }
      
      const proofs = await getProjectProofs(projectId);
      const milestoneProof = proofs.find(p => p.milestone === milestone);
      
      if (!milestoneProof) {
        throw new Error(`No proof found for milestone ${milestone}`);
      }
      
      // Check if proof meets quality threshold using actual score
      const score = milestoneProof.analysisResult?.overallScore || 0;
      const threshold = getMilestoneThreshold(milestone, milestoneProof.analysisResult);
      
      console.log(` Payment check for milestone ${milestone}:`, {
        score,
        threshold,
        meetsThreshold: score >= threshold,
        analysisResult: milestoneProof.analysisResult
      });
      
      // Enforce score threshold before claiming payment
      if (score < threshold) {
        throw new Error(`Milestone ${milestone}% score ${score} is below threshold ${threshold}. Cannot claim payment.`);
      }

      // Prevent double-claim using on-chain milestone state (single source of truth).
      const milestones = await getCampaignMilestones(projectId);
      const milestoneIndex = milestone === 50 ? 0 : milestone === 100 ? 1 : -1;
      if (milestoneIndex >= 0 && milestones[milestoneIndex]?.completed) {
        console.log(`Payment for milestone ${milestone} already released on-chain`);
        return;
      }

      console.log(` Calling smart contract to submit progress proof for milestone ${milestone} for project ${projectId}`);
      const receipt = await submitProgressProof(projectId, milestone);
      console.log(' Transaction confirmed:', receipt);
      
      localStorage.setItem(`transaction_hash_${projectId}_${milestone}`, receipt.transactionHash);
      console.log(` Stored transaction hash for milestone ${milestone}:`, receipt.transactionHash);
      
      window.dispatchEvent(new CustomEvent('paymentClaimed'));
      alert(` Successfully claimed payment for ${milestone}% milestone!\nTransaction Hash: ${receipt.transactionHash}`);
      
      // Refresh projects to update UI using on-chain milestone state.
      try {
        console.log(' Refreshing projects after payment claim...');
        const contractor = await getContractorProjects();
        console.log(' Contractor projects fetched:', contractor.length);
        
        const contractorWithProofs = await Promise.all(
          contractor.map(async (project) => {
            try {
              const proofs = await getProjectProofs(project.pId);
              let blockchainMilestones = [];
              try {
                blockchainMilestones = await getCampaignMilestones(project.pId);
              } catch (milestoneError) {
                blockchainMilestones = [false, false];
              }
              const latestProofMilestone = proofs?.length > 0 ? Math.max(...proofs.map(p => p.milestone)) : 0;
              const hasClaimed100 = blockchainMilestones.length >= 2 && blockchainMilestones[1]?.completed;
              const nextMilestone = hasClaimed100 ? 100 : latestProofMilestone < 50 ? 50 : 100;
              const completedCount = blockchainMilestones.filter(Boolean).length;

              return {
                ...project,
                proofs: proofs || [],
                currentMilestone: nextMilestone,
                completedMilestones: completedCount,
                claimedMilestones: completedCount
              };
            } catch (projectError) {
              console.error(` Error processing project ${project.pId}:`, projectError);
              return project; // Return original project if processing fails
            }
          })
        );
        
        console.log(' Projects refreshed successfully');
        setContractorProjects(contractorWithProofs);
      } catch (refreshError) {
        console.error(' Error refreshing projects after payment:', refreshError);
        console.log(' Payment was successful, only UI refresh failed');
      }
      
    } catch (error) {
      console.error(' Failed to claim payment:', error);
      alert(' Failed to claim payment: ' + error.message);
    }
  };

  const formatDeadline = (deadline) => {
    // Handle Unix timestamps in seconds (blockchain) vs milliseconds
    let timestamp = Number(deadline);
    if (isNaN(timestamp)) {
      return 'N/A';
    }
    // If timestamp is in seconds (10 digits or less than 1e12), convert to milliseconds
    if (timestamp < 100000000000) {
      timestamp *= 1000;
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString();
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
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-3 px-4 font-epilogue font-semibold text-[16px] ${activeTab === 'available' ? 'text-[#1dc071] border-b-2 border-[#1dc071]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          Available Projects ({availableProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('my-projects')}
          className={`pb-3 px-4 font-epilogue font-semibold text-[16px] ${activeTab === 'my-projects' ? 'text-[#1dc071] border-b-2 border-[#1dc071]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          My Projects ({contractorProjects.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {availableProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-epilogue text-[var(--text-secondary)] text-[16px]">
                No available projects at the moment. Check back later!
              </p>
            </div>
          ) : (
            availableProjects.map((project) => (
              <div
                key={project.pId}
                className="bg-[var(--bg-secondary)] rounded-[15px] p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-epilogue font-bold text-[20px] text-[var(--text-primary)] mb-2">
                      {project.title}
                    </h3>
                    <p className="font-epilogue text-[14px] text-[var(--text-secondary)] mb-4 line-clamp-3">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex gap-4 text-[var(--text-primary)] text-sm">
                    <span className="text-[var(--text-primary)]">Target: {formatEth(project.target)} ETH</span>
                    <span className="text-[var(--text-primary)]">Deadline: {formatDeadline(project.deadline)}</span>
                  </div>
                </div>
                <div className="ml-6">
                  <CustomButton
                    btnType="button"
                    title="Accept Project"
                    styles="bg-[#1dc071]"
                    handleClick={() => handleAcceptProject(project.pId)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'my-projects' && (
        <div className="space-y-4">
          {contractorProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-epilogue text-[var(--text-secondary)] text-[16px]">
                You haven't accepted any projects yet. Browse available projects to get started!
              </p>
            </div>
          ) : (
            contractorProjects.map((project) => {
              const milestones = [50, 100];
              
              return (
                <div
                  key={project.pId}
                  className="bg-[var(--bg-secondary)] rounded-[15px] p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-epilogue font-bold text-[20px] text-[var(--text-primary)] mb-2">
                        {project.title}
                      </h3>
                      <p className="font-epilogue text-[14px] text-[var(--text-secondary)] mb-4 line-clamp-3">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <span className="text-[var(--text-primary)]">Target: {formatEth(project.target)} ETH</span>
                      <span className="text-[var(--text-primary)]">Deadline: {formatDeadline(project.deadline)}</span>
                    </div>
                  </div>
                  
                  {/* Progress Milestones */}
                  <div className="mb-4">
                    {milestones.map((milestone) => {
                      const proof = project.proofs?.find(p => p.milestone === milestone);
                      const isCompleted = !!proof;
                      const score = proof?.analysisResult?.overallScore || 0;
                      const threshold = getMilestoneThreshold(milestone, proof?.analysisResult);
                      const canClaimFunds = isCompleted && score >= threshold;
                      
                      // Check if milestone is completed in blockchain
                      const milestoneIndex = milestone === 50 ? 0 : milestone === 100 ? 1 : -1;
                      const isBlockchainCompleted = milestoneIndex >= 0 ? project.blockchainMilestones?.[milestoneIndex] : false;

                      // Payment is considered claimed once the milestone is completed on-chain.
                      const isPaymentClaimed = isBlockchainCompleted;

                      // Check if the 100% milestone is completed on-chain - if so, all milestones are covered
                      const is100Claimed = !!(project.blockchainMilestones && project.blockchainMilestones[1]?.completed);
                      console.log(` Milestone ${milestone} (index ${milestoneIndex}):`, {
                        blockchainMilestones: project.blockchainMilestones,
                        isBlockchainCompleted,
                        milestoneValue: project.blockchainMilestones?.[milestoneIndex]
                      });
                      
                      // If 100% is claimed, the 50% milestone is also covered by the final payment
                      const isCoveredBy100 = is100Claimed && milestone === 50;
                      
                      return (
                        <div
                          key={milestone}
                          className={`flex-1 text-center p-3 rounded-lg border-2 ${proof || isBlockchainCompleted || isCoveredBy100 ? 'border-[#1dc071]' : 'border-[var(--border-color)]'}`}
                        >
                          <div className="font-epilogue font-bold text-[16px] text-[var(--text-primary)]">
                            {milestone}%
                          </div>
                          <div className="font-epilogue text-[10px] text-[var(--text-secondary)] mt-1">
                            {isBlockchainCompleted || isCoveredBy100 ? ' Completed' : isCompleted ? ' Submitted' : 'Pending'}
                          </div>
                          {isCompleted && !isCoveredBy100 && (
                            <div className="mt-1 text-[10px] text-[var(--text-secondary)]">
                              Score: <span className="text-[var(--text-primary)]">{score.toFixed(1)}/10</span>
                              <span className="mx-1">•</span>
                              Threshold: <span className="text-[var(--text-primary)]">{threshold.toFixed(1)}</span>
                            </div>
                          )}
                          {isBlockchainCompleted || isCoveredBy100 ? (
                            <div className="mt-2">
                              <div className="text-center">
                                <span className="text-[#1dc071] text-xs font-epilogue">
                                   Completed & Paid
                                </span>
                              </div>
                            </div>
                          ) : isCompleted && !isPaymentClaimed && canClaimFunds ? (
                            <div className="mt-2">
                              <div className="text-center">
                                <span className="text-[#1dc071] text-xs font-epilogue">
                                   Eligible for Payout
                                </span>
                              </div>
                              <CustomButton
                                btnType="button"
                                title="Claim Payment"
                                styles="bg-[#1dc071] text-xs px-2 py-1 mt-2"
                                handleClick={() => handleClaimPayment(project.pId, milestone)}
                              />
                            </div>
                          ) : isCompleted && !canClaimFunds ? (
                            <div className="mt-2">
                              <div className="text-center">
                                <span className="text-[#f59e0b] text-xs font-epilogue">
                                   Below Threshold
                                </span>
                              </div>
                            </div>
                          ) : isCompleted && isPaymentClaimed ? (
                            <div className="mt-2">
                              <div className="text-center">
                                <span className="text-[var(--text-secondary)] text-xs font-epilogue">
                                   Payment Claimed
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Submit Proof Button - hidden when project is completed on-chain (100% milestone released) */}
                  {!(project.blockchainMilestones && project.blockchainMilestones[1]?.completed) && (
                    <div className="ml-6">
                      <CustomButton
                        btnType="button"
                        title="Submit Proof"
                        styles="bg-[#8c6dfd]"
                        handleClick={() => handleOpenProgressProof(project, project.currentMilestone || 50)}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Progress Proof Modal */}
      {showProgressProof && selectedProject && (
        <ProgressProof
          projectId={selectedProject.pId}
          currentMilestone={selectedMilestone}
          projectType={selectedProject.projectType || selectedProject.type || 'infrastructure'}
          onProofSubmit={handleSubmitProof}
          onClose={handleCloseProgressProof}
          referenceImageUrl={selectedProject.image}
        />
      )}
    </div>
  );
};

export default ProjectManagement;
