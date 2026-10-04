import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectManagement, ProgressProof } from '../components';
import { useStateContext } from '../context';

const ContractorDashboard = () => {
  const [showProgressProof, setShowProgressProof] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(50);
  const [availableProjects, setAvailableProjects] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [completedMilestones, setCompletedMilestones] = useState(0);
  const navigate = useNavigate();

  const { address, userType, getAvailableProjects, getContractorProjects, getCampaignMilestones } = useStateContext();

  const handlePaymentHistory = () => {
    navigate('/payment-history');
  };

  useEffect(() => {
    const updateDashboardStats = async () => {
      if (!address) return;
      
      try {
        const available = await getAvailableProjects();
        const contractor = await getContractorProjects();
        
        // Calculate completed milestones across all contractor projects using the
        // on-chain milestone state (the single source of truth). This avoids
        // inheriting stale "claimed" records from localStorage after redeploys.
        let totalCompletedMilestones = 0;
        let activeProjectCount = 0;
        await Promise.all(
          contractor.map(async (project) => {
            const milestones = await getCampaignMilestones(project.pId);
            const hasClaimed100 = milestones.length >= 2 && milestones[1]?.completed;

            // Count completed milestones. If the 100% milestone is completed, both
            // 50% and 100% are covered (2/2).
            let projectCompletedCount = 0;
            if (hasClaimed100) {
              projectCompletedCount = 2;
            } else if (milestones.length >= 1 && milestones[0]?.completed) {
              projectCompletedCount = 1;
            }

            totalCompletedMilestones += projectCompletedCount;
            
            // A project is completed when the 100% milestone is claimed - exclude from active count
            if (!hasClaimed100) {
              activeProjectCount++;
            }
          })
        );
        
        setAvailableProjects(available.length);
        setActiveProjects(activeProjectCount);
        setCompletedMilestones(totalCompletedMilestones);
      } catch (error) {
        console.error('Failed to update dashboard stats:', error);
      }
    };

    updateDashboardStats();

    // Listen for proof submission and payment claim events
    const handleDashboardRefresh = () => {
      updateDashboardStats();
    };

    window.addEventListener('proofSubmitted', handleDashboardRefresh);
    window.addEventListener('paymentClaimed', handleDashboardRefresh);

    return () => {
      window.removeEventListener('proofSubmitted', handleDashboardRefresh);
      window.removeEventListener('paymentClaimed', handleDashboardRefresh);
    };
  }, [address, getAvailableProjects, getContractorProjects, getCampaignMilestones]);

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

  const handleSubmitProof = async (projectId, proofData) => {
    try {
      // This will be handled by the ProgressProof component
      console.log('Submitting proof for project:', projectId, proofData);
    } catch (error) {
      console.error('Failed to submit proof:', error);
    }
  };

  if (userType !== 'contractor') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="font-epilogue font-bold text-[24px] text-[var(--text-primary)] mb-4">
            Access Restricted
          </h2>
          <p className="font-epilogue text-[var(--text-secondary)] text-[16px]">
            This dashboard is only available to contractors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-secondary)] rounded-[15px] p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-epilogue font-bold text-[26px] text-[var(--text-primary)]">
              Contractor Dashboard
            </h1>
            <p className="font-epilogue text-[var(--text-secondary)] text-[16px] mt-2">
              Manage your projects and track progress
            </p>
          </div>
          
          <div className="text-right flex flex-col items-end gap-3">
            <button
              onClick={handlePaymentHistory}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 font-epilogue text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Payment History
            </button>
            <div>
              <div className="font-epilogue text-[var(--text-secondary)] text-[14px]">
                Wallet Address
              </div>
              <div className="font-epilogue text-[var(--text-primary)] text-[12px] mt-1">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--bg-card)] rounded-[12px] p-3">
            <div className="font-epilogue text-[var(--text-secondary)] text-[14px] mb-2">
              Available Projects
            </div>
            <div className="font-epilogue font-bold text-[24px] text-[var(--text-primary)]">
              {availableProjects}
            </div>
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-[12px] p-3">
            <div className="font-epilogue text-[var(--text-secondary)] text-[14px] mb-2">
              Active Projects
            </div>
            <div className="font-epilogue font-bold text-[24px] text-[var(--text-primary)]">
              {activeProjects}
            </div>
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-[12px] p-3">
            <div className="font-epilogue text-[var(--text-secondary)] text-[14px] mb-2">
              Completed Milestones
            </div>
            <div className="font-epilogue font-bold text-[24px] text-[var(--text-primary)]">
              {completedMilestones}
            </div>
          </div>
        </div>

        {/* Project Management Section */}
        <div>
          <h2 className="font-epilogue font-bold text-[20px] text-[var(--text-primary)] mb-4">
            Project Management
          </h2>
          <ProjectManagement />
        </div>
      </div>

      {/* Progress Proof Modal */}
      {showProgressProof && selectedProject && (
        <ProgressProof
          projectId={selectedProject.pId}
          currentMilestone={selectedMilestone}
          projectType={selectedProject.projectType || selectedProject.type || 'infrastructure'}
          referenceImageUrl={selectedProject.image}
          onProofSubmit={handleSubmitProof}
          onClose={handleCloseProgressProof}
        />
      )}
    </div>
  );
};

export default ContractorDashboard;
