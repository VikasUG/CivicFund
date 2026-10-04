import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context';
import { formatEth } from '../utils';

const PaymentHistory = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const { 
    getContractorProjects, 
    getProjectProofs,
    getClaimedPayments,
    address 
  } = useStateContext();

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      setIsLoading(true);
      try {
        console.log(' Fetching payment history for address:', address);
        
        const contractorProjects = await getContractorProjects();
        const history = [];

        for (const project of contractorProjects) {
          console.log(` Checking project ${project.pId}:`, project.title);
          
          const proofs = await getProjectProofs(project.pId);

          // The on-chain milestone state is the single source of truth for which
          // payments have been released. getClaimedPayments now derives this from
          // the contract directly, so no stale localStorage fallback is needed
          // (the old fallback caused fresh campaigns to show as already released).
          let claimedPayments = [];
          try {
            claimedPayments = await getClaimedPayments(project.pId);
          } catch (error) {
            console.warn('getClaimedPayments failed, defaulting to empty:', error);
            claimedPayments = [];
          }

          // Only valid milestones are 50% and 100%
          const validMilestones = claimedPayments.filter(m => m === 50 || m === 100);

          // If 100% is claimed, it covers the full project - don't show 50% separately
          const hasClaimed100 = validMilestones.includes(100);
          const milestonesToShow = hasClaimed100
            ? validMilestones.filter(m => m === 100)
            : validMilestones;

          for (const milestone of milestonesToShow) {
            const proof = proofs.find(p => p.milestone === milestone);
            
            const totalAmount = parseFloat(project.target) || 0;
            const milestonePercentage = milestone / 100;
            const paymentAmount = totalAmount * milestonePercentage;
            
            const score = proof?.analysisResult?.overallScore || 0;
            
            const transactionHash = localStorage.getItem(`transaction_hash_${project.pId}_${milestone}`);
            console.log(` Payment history - milestone ${milestone} transaction hash:`, transactionHash);

            history.push({
              id: `${project.pId}-${milestone}`,
              projectId: project.pId,
              projectName: project.title,
              milestone,
              amount: paymentAmount,
              claimedAt: proof?.submittedAt || new Date().toISOString(),
              score: score,
              threshold: milestone === 50 ? 7.0 : 8.2,
              status: 'completed',
              proof,
              project,
              transactionHash
            });
          }
        }

        console.log(' Final payment history:', history);
        
        // Sort by claimed date (newest first)
        history.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));
        setPaymentHistory(history);
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchPaymentHistory();
    }

    // Listen for payment claimed events
    const handlePaymentClaimed = () => {
      console.log(' Payment claimed event received, refreshing payment history...');
      fetchPaymentHistory();
    };

    window.addEventListener('paymentClaimed', handlePaymentClaimed);

    return () => {
      window.removeEventListener('paymentClaimed', handlePaymentClaimed);
    };
  }, [address, getContractorProjects, getProjectProofs, getClaimedPayments]);

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedPayment(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[var(--text-primary)]">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-epilogue font-bold text-[24px] text-[var(--text-primary)]">
           Payment History
        </h2>
        <div className="text-[var(--text-secondary)] text-sm">
          Total Claimed: {paymentHistory.length} payments
        </div>
      </div>

      {paymentHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-epilogue text-[var(--text-secondary)] text-[16px]">
            No payments claimed yet. Complete milestones and claim your payments!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentHistory.map((payment) => (
            <div
              key={payment.id}
              className="bg-[var(--bg-secondary)] rounded-[15px] p-6 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
              onClick={() => handlePaymentClick(payment)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-epilogue font-bold text-[18px] text-[var(--text-primary)] mb-2">
                    {payment.projectName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--text-secondary)]">Milestone:</span>
                      <span className="text-[var(--text-primary)] ml-2 font-epilogue">
                        {payment.milestone}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Amount:</span>
                      <span className="text-[#1dc071] ml-2 font-epilogue font-bold">
                        {formatEth(payment.amount)} ETH
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Score:</span>
                      <span className={`ml-2 font-epilogue ${
                        payment.score >= payment.threshold ? 'text-[#1dc071]' : 'text-[#ef4444]'
                      }`}>
                        {payment.score}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Claimed:</span>
                      <span className="text-[var(--text-primary)] ml-2 font-epilogue">
                        {new Date(payment.claimedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-epilogue ${
                    payment.status === 'completed' 
                      ? 'bg-[#1dc071] text-[var(--text-primary)]' 
                      : 'bg-[#f59e0b] text-[var(--text-primary)]'
                  }`}>
                    {payment.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-[20px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-epilogue font-bold text-[24px] text-[var(--text-primary)]">
                 Payment Details
              </h3>
              <button
                onClick={closeDetails}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-[var(--bg-card)] p-4 rounded-lg">
                <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3">
                  Project Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Project Name:</span>
                    <span className="text-[var(--text-primary)] font-epilogue">{selectedPayment.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Project ID:</span>
                    <span className="text-[var(--text-primary)] font-epilogue">#{selectedPayment.projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Total Target:</span>
                    <span className="text-[var(--text-primary)] font-epilogue">{formatEth(selectedPayment.project.target)} ETH</span>
                  </div>
                </div>
              </div>

              {/* Milestone Info */}
              <div className="bg-[var(--bg-card)] p-4 rounded-lg">
                <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3">
                  Milestone Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Milestone:</span>
                    <span className="text-[var(--text-primary)] font-epilogue">{selectedPayment.milestone}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Quality Score:</span>
                    <span className={`font-epilogue font-bold ${
                      selectedPayment.score >= selectedPayment.threshold ? 'text-[#1dc071]' : 'text-[#ef4444]'
                    }`}>
                      {selectedPayment.score}/10 (Threshold: {selectedPayment.threshold})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Claimed Date:</span>
                    <span className="text-[var(--text-primary)] font-epilogue">
                      {new Date(selectedPayment.claimedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-[var(--bg-card)] p-4 rounded-lg">
                <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3">
                  Payment Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Milestone Payment:</span>
                    <span className="text-[#1dc071] font-epilogue font-bold text-lg">
                      {formatEth(selectedPayment.amount)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Percentage of Total:</span>
                    <span className="text-[var(--text-primary)] font-epilogue">{selectedPayment.milestone}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-epilogue ${
                      selectedPayment.status === 'completed' 
                        ? 'bg-[#1dc071] text-[var(--text-primary)]' 
                        : 'bg-[#f59e0b] text-[var(--text-primary)]'
                    }`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                  {selectedPayment.transactionHash && (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Transaction Hash:</span>
                      <span className="text-[var(--text-primary)] font-epilogue text-xs truncate ml-2" title={selectedPayment.transactionHash}>
                        {selectedPayment.transactionHash.slice(0, 8)}...{selectedPayment.transactionHash.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof Preview */}
              {selectedPayment.proof && (
                <div className="bg-[var(--bg-card)] p-4 rounded-lg">
                  <h4 className="font-epilogue font-semibold text-[var(--text-primary)] text-sm mb-3">
                    Proof Submitted
                  </h4>
                  <div className="space-y-3">
                    <p className="text-[var(--text-secondary)] text-sm">
                      {selectedPayment.proof.description}
                    </p>
                    {selectedPayment.proof.image && (
                      <img
                        src={selectedPayment.proof.image}
                        alt="Proof image"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeDetails}
                className="px-6 py-3 bg-[#8c6dfd] text-[var(--text-primary)] font-epilogue font-semibold rounded-lg hover:bg-[#8c6dfd80] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
