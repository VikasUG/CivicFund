import React, { useContext, createContext, useState, useEffect } from 'react';
import { useAddress, useContract, useConnect, useContractWrite, useDisconnect } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  // Auto-detect contract address from environment or use fallback
  const getContractAddress = () => {
    // Priority order: Environment variable -> Localhost deployed -> Fallback
    const envAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const localhostAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    const fallbackAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    
    // Use environment variable if available
    if (envAddress && envAddress !== 'undefined') {
      console.log(' Using environment variable address:', envAddress);
      return envAddress;
    }
    
    // Check if localhost contract exists by trying to connect
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(' Using localhost deployed address:', localhostAddress);
      return localhostAddress;
    }
    
    // Fallback to old address for development
    console.log(' Using fallback address:', fallbackAddress);
    return fallbackAddress;
  };
  
  const contractAddress = getContractAddress();
  
  // Debug: Force console log to verify contract address
  console.log(' Contract Address:', contractAddress);
  console.log(' Window Location:', window.location.href);
  console.log(' Timestamp:', new Date().toISOString());
  console.log(' VERSION: 4.0 - AUTO-DETECT ADDRESS');
  
  // Auto-detect if we need to update contract address
  const checkAndUpdateContract = async () => {
    if (window.ethereum && window.location.hostname === 'localhost') {
      try {
        // Try to connect to the current contract address
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        // Try to call a simple function to check if contract exists
        await contract.numberOfCampaigns();
        console.log(' Contract is accessible at:', contractAddress);
      } catch (error) {
        console.log(' Contract not accessible, trying localhost address...');
        // If current address fails, try localhost deployed address
        const localhostAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const contract = new ethers.Contract(localhostAddress, contractABI, provider);
          await contract.numberOfCampaigns();
          console.log(' Found contract at localhost address:', localhostAddress);
          // Update the contract address dynamically
          window.location.reload(); // Force reload to pick up new address
        } catch (localhostError) {
          console.log(' No contract found at localhost address either');
        }
      }
    }
  };
  
  // Check contract on mount
  useEffect(() => {
    checkAndUpdateContract();
  }, []);
  
  // Use complete ABI with all contract functions
  const contractABI = [
    {
      "inputs": [
        {"internalType": "address", "name": "_owner", "type": "address"},
        {"internalType": "string", "name": "_title", "type": "string"},
        {"internalType": "string", "name": "_description", "type": "string"},
        {"internalType": "uint256", "name": "_target", "type": "uint256"},
        {"internalType": "uint256", "name": "_deadline", "type": "uint256"},
        {"internalType": "string", "name": "_image", "type": "string"}
      ],
      "name": "createCampaign",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"}
      ],
      "name": "donateToCampaign",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"}
      ],
      "name": "acceptProject",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"},
        {"internalType": "uint256", "name": "_milestoneIndex", "type": "uint256"}
      ],
      "name": "submitProgressProof",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"},
        {"internalType": "uint256", "name": "_milestoneIndex", "type": "uint256"}
      ],
      "name": "claimMilestonePayment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"}
      ],
      "name": "refundDonations",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContractBalance",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"}
      ],
      "name": "getDonators",
      "outputs": [
        {"internalType": "address[]", "name": "", "type": "address[]"},
        {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCampaigns",
      "outputs": [
        {
          "components": [
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "address", "name": "contractor", "type": "address"},
            {"internalType": "string", "name": "title", "type": "string"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "uint256", "name": "target", "type": "uint256"},
            {"internalType": "uint256", "name": "deadline", "type": "uint256"},
            {"internalType": "uint256", "name": "amountCollected", "type": "uint256"},
            {"internalType": "string", "name": "image", "type": "string"},
            {"internalType": "address[]", "name": "donators", "type": "address[]"},
            {"internalType": "uint256[]", "name": "donations", "type": "uint256[]"},
            {"internalType": "bool[]", "name": "milestonesCompleted", "type": "bool[]"},
            {"internalType": "uint256", "name": "milestoneCount", "type": "uint256"},
            {"internalType": "uint256", "name": "milestoneAmount", "type": "uint256"},
            {"internalType": "bool", "name": "fundsReleased", "type": "bool"}
          ],
          "internalType": "struct CrowdFundingEscrow.Campaign[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"}
      ],
      "name": "getCampaignMilestones",
      "outputs": [{"internalType": "bool[]", "name": "", "type": "bool[]"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "_id", "type": "uint256"}
      ],
      "name": "getMilestoneProgress",
      "outputs": [
        {"internalType": "uint256", "name": "completed", "type": "uint256"},
        {"internalType": "uint256", "name": "total", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "numberOfCampaigns",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "", "type": "uint256"}
      ],
      "name": "campaigns",
      "outputs": [
        {"internalType": "address", "name": "owner", "type": "address"},
        {"internalType": "address", "name": "contractor", "type": "address"},
        {"internalType": "string", "name": "title", "type": "string"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "uint256", "name": "target", "type": "uint256"},
        {"internalType": "uint256", "name": "deadline", "type": "uint256"},
        {"internalType": "uint256", "name": "amountCollected", "type": "uint256"},
        {"internalType": "string", "name": "image", "type": "string"},
        {"internalType": "address[]", "name": "donators", "type": "address[]"},
        {"internalType": "uint256[]", "name": "donations", "type": "uint256[]"},
        {"internalType": "bool[]", "name": "milestonesCompleted", "type": "bool[]"},
        {"internalType": "uint256", "name": "milestoneCount", "type": "uint256"},
        {"internalType": "uint256", "name": "milestoneAmount", "type": "uint256"},
        {"internalType": "bool", "name": "fundsReleased", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const { contract } = useContract(contractAddress, contractABI);
  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');
  const { mutateAsync: acceptProject } = useContractWrite(contract, 'acceptProject');
  const address = useAddress();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const [userType, setUserType] = useState('');
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);

  // Debug wallet connection
  console.log(' Wallet Debug:');
  console.log(' Address Hook Result:', address);
  console.log(' Connect Hook:', connect);
  console.log(' Disconnect Hook:', disconnect);
  console.log(' Window.ethereum:', typeof window.ethereum);
  console.log(' MetaMask Connected:', window.ethereum?.isConnected?.());

  // Auto-connect wallet if not connected
  useEffect(() => {
    if (!address && window.ethereum) {
      console.log(' Wallet not connected, waiting for manual connection...');
      // Don't auto-connect, let user click connect button to see account selection
    }
  }, [address, connect]);

  // Manual connect function to show account selection
  const manualConnectWallet = async () => {
    try {
      console.log(' Manual wallet connection requested...');
      await connect();
    } catch (error) {
      console.error(' Manual connect failed:', error);
    }
  };

  // Debug contract initialization
  console.log(' Contract Address:', contractAddress);
  console.log(' Contract Object:', contract);
  console.log(' CreateCampaign Function:', createCampaign);
  console.log(' Connected Address:', address);
  console.log(' Contract ABI:', contractABI);
  
  // Helper function to check contract status
  const checkContractStatus = () => {
    if (!contract) {
      console.error('Contract not loaded. Possible issues:');
      console.error('1. Hardhat node not running');
      console.error('2. Contract not deployed');
      console.error('3. Wrong network in MetaMask');
      console.error('4. Contract address mismatch');
      return false;
    }
    
    if (!createCampaign) {
      console.error('CreateCampaign function not available. Possible issues:');
      console.error('1. Contract ABI mismatch');
      console.error('2. Contract not deployed correctly');
      return false;
    }
    
    console.log(' Contract is properly initialized');
    return true;
  };
  
  // Check contract status on load
  if (address) {
    checkContractStatus();
  }

  // Load user type for connected wallet
  useEffect(() => {
    console.log('Context useEffect:', { address, showUserTypeSelection });
    if (address) {
      console.log('Wallet connected:', address);
      const savedTypeForWallet = localStorage.getItem(`userType_${address}`);
      if (savedTypeForWallet) {
        console.log('Found saved role for wallet:', savedTypeForWallet);
        setUserType(savedTypeForWallet);
        localStorage.setItem('userType', savedTypeForWallet);
        // Don't show role selection UI if user already has a role
        setShowUserTypeSelection(false);
        console.log('Setting showUserTypeSelection to FALSE (returning user)');
      } else {
        console.log('No saved role found, showing role selection UI');
        // Show role selection UI for new users only
        setShowUserTypeSelection(true);
        console.log('Setting showUserTypeSelection to TRUE (new user)');
      }
    } else {
      console.log('Wallet disconnected');
      setUserType('');
      setShowUserTypeSelection(false);
      console.log('Setting showUserTypeSelection to FALSE (disconnected)');
    }
  }, [address]);

  const setUserTypeAndStore = (type) => {
    if (address) {
      // Check if user already has a role selected
      const existingType = localStorage.getItem(`userType_${address}`);
      if (existingType && existingType !== type) {
        throw new Error('You have already selected a role. You cannot change your user type.');
      }
      
      console.log(`Setting role ${type} for account ${address}`);
      
      // Save role for this specific account
      localStorage.setItem(`userType_${address}`, type);
      localStorage.setItem('userType', type);
      
      setUserType(type);
      setShowUserTypeSelection(false);
      
      console.log(`Role ${type} saved for account ${address}`);
    }
  };

  const publishCampaign = async (form) => {
    try {
      console.log('Creating campaign with form:', form);
      
      // Check if contract and createCampaign are properly initialized
      if (!contract) {
        throw new Error('Contract is not initialized. Please check your wallet connection and network.');
      }
      
      if (!createCampaign) {
        throw new Error('CreateCampaign function is not available. Please check the contract ABI and connection.');
      }
      
      if (!address) {
        throw new Error('Wallet is not connected. Please connect your wallet first.');
      }
      
      // Validate all required fields
      if (!form.deadline) {
        throw new Error('Deadline is required. Please select an end date for your campaign.');
      }
      
      if (!form.title) {
        throw new Error('Campaign title is required.');
      }
      
      if (!form.description) {
        throw new Error('Campaign description is required.');
      }
      
      if (!form.target) {
        throw new Error('Campaign goal is required.');
      }
      
      if (!form.image) {
        throw new Error('Campaign image is required.');
      }
      
      // Show loading state
      if (typeof window !== 'undefined') {
        window.lastError = null;
      }
      
      // Convert deadline to timestamp and validate
      const deadlineTimestamp = Math.floor(new Date(form.deadline).getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);
      
      if (deadlineTimestamp <= now) {
        throw new Error('Campaign deadline must be in the future.');
      }
      
      console.log('Contract call parameters:', {
        address,
        title: form.title,
        description: form.description,
        target: form.target,
        deadline: form.deadline,
        deadlineTimestamp,
        image: form.image ? 'Image data present' : 'No image'
      });
      
      console.log('About to call createCampaign with:', {
        contract: !!contract,
        createCampaign: !!createCampaign,
        address: !!address,
        gasLimit: 15000000,
        gasPrice: ethers.utils.parseUnits('20', 'gwei').toString()
      });
      
      // Convert target to string if it's a BigNumber object
      const targetAmount = typeof form.target === 'object' && form.target.toString ? form.target.toString() : form.target;
      
      const data = await createCampaign({
        args: [
          address, 
          form.title,
          form.description,
          targetAmount,
          deadlineTimestamp,
          form.image
        ],
        overrides: {
          gasPrice: ethers.utils.parseUnits('1', 'gwei'), // 1 gwei is sufficient for localhost
          gasLimit: 5000000
        }
      });
      
      console.log("Contract call success", data);
      
      // Store YOLO analysis results in localStorage for reference
      if (form.yoloScore || form.yoloAnalysis) {
        const campaignData = {
          yoloScore: form.yoloScore,
          yoloAnalysis: form.yoloAnalysis,
          timestamp: Date.now()
        };
        // Use data.hash if available, otherwise use campaign ID
        const txHash = data?.hash || data?.receipt?.transactionHash || `campaign_${Date.now()}`;
        localStorage.setItem(`campaign_analysis_${txHash}`, JSON.stringify(campaignData));
      }
      
      return data;
    } catch (error) {
      console.error("Contract call failure", error);
      
      // Store error for debugging
      if (typeof window !== 'undefined') {
        window.lastError = {
          message: error.message,
          code: error.code,
          reason: error.reason,
          data: error.data,
          stack: error.stack,
          timestamp: new Date().toISOString()
        };
      }
      
      // Create user-friendly error message
      let userMessage = "Failed to create campaign. ";
      
      if (error.code === 4001) {
        userMessage += "Transaction was rejected by user.";
      } else if (error.code === -32603) {
        userMessage += "Internal error. Please check your wallet connection.";
      } else if (error.message?.includes("insufficient funds")) {
        userMessage += "Insufficient funds for gas.";
      } else if (error.message?.includes("user rejected")) {
        userMessage += "Transaction was rejected.";
      } else if (error.message?.includes("Deadline is required")) {
        userMessage += "Please select an end date for your campaign.";
      } else if (error.message?.includes("must be in the future")) {
        userMessage += "Please select a future date for the campaign deadline.";
      } else if (error.message?.includes("Contract is not initialized")) {
        userMessage += "Contract connection issue. Please refresh and try again.";
      } else if (error.message?.includes("CreateCampaign function is not available")) {
        userMessage += "Contract function not available. Please check contract deployment.";
      } else if (error.message?.includes("Wallet is not connected")) {
        userMessage += "Please connect your wallet first.";
      } else {
        userMessage += `Error: ${error.message || 'Unknown error occurred'}`;
      }
      
      throw new Error(userMessage);
    }
  };

  const getCampaigns = async () => {
    try {
      console.log(' Fetching campaigns from contract...');
      const campaigns = await contract.call('getCampaigns');
      console.log(' Raw campaigns data:', campaigns);
      
      const parsedCampaigns = campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        contractor: campaign.contractor,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber() * 1000,
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        pId: i
      }));
      
      console.log(' Parsed campaigns:', parsedCampaigns);
      return parsedCampaigns;
    } catch (error) {
      console.error(' Failed to fetch campaigns:', error);
      throw new Error('Failed to fetch campaigns: ' + error.message);
    }
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    return allCampaigns.filter(campaign => campaign.owner === address);
  };

  const donate = async (pId, amount) => {
    try {
      // Validate donation amount
      if (!amount || amount === '') {
        throw new Error('Please enter a donation amount');
      }
      
      const donationAmount = parseFloat(amount);
      if (isNaN(donationAmount) || donationAmount <= 0) {
        throw new Error('Please enter a valid donation amount greater than 0');
      }

      // Check if contract is available
      if (!contract) {
        throw new Error('Contract not initialized. Please check your wallet connection.');
      }

      console.log('Initiating donation:', { pId, amount: donationAmount });

      // Use contract.call with payable value for donation
      const data = await contract.call('donateToCampaign', [pId], {
        value: ethers.utils.parseEther(amount)
      });
      
      console.log('Donation successful:', data);
      return data;
    } catch (error) {
      console.error('Donation error:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Donation failed: ';
      
      if (error.code === 4001) {
        userMessage += 'Transaction rejected by user.';
      } else if (error.message?.includes('insufficient funds')) {
        userMessage += 'Insufficient funds for this donation.';
      } else if (error.message?.includes('user rejected')) {
        userMessage += 'Transaction was rejected.';
      } else if (error.message?.includes('invalid address')) {
        userMessage += 'Invalid campaign ID.';
      } else if (error.message?.includes('Cannot read properties')) {
        userMessage += 'Contract connection issue. Please refresh and try again.';
      } else {
        userMessage += error.message || 'Unknown error occurred';
      }
      
      throw new Error(userMessage);
    }
  };

  const getDonations = async (pId) => {
    const donations = await contract.call('getDonators', [pId]);
    const parsedDonations = donations[0].map((donator, i) => ({
      donator,
      donation: ethers.utils.formatEther(donations[1][i].toString())
    }));
    return parsedDonations;
  };

  const withdrawFunds = async (campaignId, amount) => {
    try {
      console.log(' Initiating withdrawal for campaign:', campaignId, amount);
      
      // Validate withdrawal amount
      if (!amount || amount === '') {
        throw new Error('Please enter a withdrawal amount');
      }
      
      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        throw new Error('Please enter a valid withdrawal amount greater than 0');
      }
      
      // Get campaign details to validate ownership
      const campaigns = await getCampaigns();
      const campaign = campaigns.find(c => c.pId === campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      
      // Verify user is the campaign creator
      if (campaign.owner !== address) {
        throw new Error('Only campaign creators can withdraw funds');
      }
      
      // Get available campaign balance (donations received)
      const donations = await contract.call('getDonators', [campaignId]);
      let totalDonations = 0;
      if (donations[0] && donations[1]) {
        for (let i = 0; i < donations[1].length; i++) {
          totalDonations += parseFloat(donations[1][i].toString());
        }
      }
      
      // Check if withdrawal amount exceeds available donations
      if (withdrawalAmount > totalDonations) {
        throw new Error('Insufficient funds. Cannot withdraw more than donated amount.');
      }
      
      // Calculate available earnings for campaign owner (actual donations received)
      const totalDonations = parseFloat(campaign.amountCollected || 0);
      
      // Security: Only allow withdrawal of actual earnings, not milestone payments
      if (withdrawalAmount > totalDonations) {
        throw new Error('Insufficient earnings. Cannot withdraw more than donated amount.');
      }
      
      console.log(' Withdrawal validation:', {
        campaignOwner: campaign.owner,
        currentUser: address,
        isOwner: campaign.owner === address,
        totalDonations,
        withdrawalAmount,
        availableForWithdrawal: totalDonations
      });
      
      // Process withdrawal of actual earnings
      const data = await contract.call('claimMilestonePayment', [campaignId], {
        value: ethers.utils.parseEther(amount)
      });
      
      console.log(' Withdrawal successful:', data);
      return data;
      
    } catch (error) {
      console.error(' Withdrawal failed:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Withdrawal failed: ';
      
      if (error.code === 4001) {
        userMessage += 'Transaction rejected by user.';
      } else if (error.message?.includes('insufficient funds')) {
        userMessage += 'Insufficient funds for withdrawal.';
      } else if (error.message?.includes('user rejected')) {
        userMessage += 'Transaction was rejected.';
      } else if (error.message?.includes('Only campaign creators')) {
        userMessage += 'Only campaign creators can withdraw funds.';
      } else {
        userMessage += error.message || 'Unknown error occurred.';
      }
      
      throw new Error(userMessage);
    }
  };

  const acceptProjectFunc = async (campaignId) => {
    try {
      // Check if acceptProject function is available
      if (!acceptProject) {
        throw new Error('Accept Project function is not available in the current contract.');
      }
      
      const data = await acceptProject({
        args: [campaignId]
      });
      console.log("Project accepted successfully", data);
      return data;
    } catch (error) {
      console.error("Failed to accept project", error);
      
      // If contract doesn't have the function, store locally
      if (error.message?.includes('not available')) {
        console.log('Storing project acceptance locally for campaign:', campaignId);
        localStorage.setItem(`project_accepted_${campaignId}`, JSON.stringify({
          campaignId,
          timestamp: new Date().toISOString()
        }));
      }
      
      throw error;
    }
  };

  const submitProgressProofFunc = async (campaignId, proofData) => {
    try {
      console.log(' Submitting progress proof for campaign:', campaignId);
      
      // Check proof score and update campaign status accordingly
      const score = proofData.analysisResult?.overallScore || 0;
      let campaignStatus = 'pending';
      
      if (score < 6) {
        campaignStatus = 'rejected';
        console.log(` Campaign ${campaignId} rejected due to low score: ${score}`);
      } else {
        campaignStatus = 'accepted';
        console.log(` Campaign ${campaignId} accepted with score: ${score}`);
      }
      
      // Submit proof to contract if score is acceptable
      if (score >= 6) {
        // Convert milestone percentage to index
        const milestoneMap = { 50: 0, 100: 1 };
        const milestoneIndex = milestoneMap[proofData.milestone];
        
        if (milestoneIndex === undefined) {
          throw new Error(`Invalid milestone value: ${proofData.milestone}. Must be 50 or 100.`);
        }
        
        const data = await submitProof({
          args: [campaignId, milestoneIndex]
        });
        console.log(" Progress proof submitted successfully", data);
        
        // Update campaign status to accepted after successful transaction
        await updateCampaignStatus(campaignId, campaignStatus, proofData);
        
        return { success: true, status: campaignStatus, transaction: data };
      } else {
        // Update campaign status to rejected without transaction
        await updateCampaignStatus(campaignId, campaignStatus, proofData);
        
        return { success: false, status: campaignStatus, reason: 'Proof score too low' };
      }
    } catch (error) {
      console.error(" Failed to submit proof", error);
      throw error;
    }
  };

  const getContractBalance = async () => {
    try {
      const balance = await contract.call('getContractBalance');
      return ethers.utils.formatEther(balance.toString());
    } catch (error) {
      console.error("Failed to get contract balance", error);
      return "0";
    }
  };

  const getMilestoneProgress = async (campaignId) => {
    try {
      const progress = await contract.call('getMilestoneProgress', [campaignId]);
      return {
        completed: progress.completed.toNumber(),
        total: progress.total.toNumber()
      };
    } catch (error) {
      console.error("Failed to get milestone progress", error);
      return { completed: 0, total: 2 };
    }
  };

  const getCampaignMilestones = async (campaignId) => {
    try {
      const milestones = await contract.call('getCampaignMilestones', [campaignId]);
      return milestones.map((completed, index) => ({
        index,
        completed,
        released: completed // In this simple version, completed = released
      }));
    } catch (error) {
      console.error("Failed to get campaign milestones", error);
      return [];
    }
  };

  const getProjectProofs = async (campaignId) => {
    try {
      const proofs = JSON.parse(localStorage.getItem(`campaign_proofs_${campaignId}`) || '[]');
      return proofs;
    } catch (error) {
      console.error(' Failed to get project proofs:', error);
      return [];
    }
  };

  const getAvailableProjects = async () => {
    try {
      const allCampaigns = await getCampaigns();
      return allCampaigns.filter(campaign => !campaign.contractor); // Projects without assigned contractors
    } catch (error) {
      console.error("Failed to get available projects", error);
      return [];
    }
  };

  const getContractorProjects = async () => {
    try {
      const allCampaigns = await getCampaigns();
      return allCampaigns.filter(campaign => campaign.contractor === address);
    } catch (error) {
      console.error("Failed to get contractor projects", error);
      return [];
    }
  };

  const claimMilestonePaymentFunc = async (campaignId, milestoneIndex) => {
    try {
      console.log(' Claiming milestone payment for campaign:', campaignId, 'milestone:', milestoneIndex);
      
      // Check if proof exists for this milestone
      const proofs = await getProjectProofs(campaignId);
      const milestoneProof = proofs.find(p => p.milestone === milestoneIndex);
      
      if (!milestoneProof) {
        throw new Error(`No proof found for milestone ${milestoneIndex}`);
      }
      
      // Check if proof meets quality threshold
      if (!milestoneProof.analysisResult?.canReleaseFunds) {
        throw new Error(`Milestone ${milestoneIndex} does not meet quality threshold for payment release`);
      }
      
      // Check if payment has already been claimed
      const claimedPayments = JSON.parse(localStorage.getItem(`claimed_payments_${campaignId}`) || '[]');
      if (claimedPayments.includes(milestoneIndex)) {
        throw new Error(`Payment for milestone ${milestoneIndex} has already been claimed`);
      }
      
      // Try to call the smart contract function
      const data = await contract.call('claimMilestonePayment', {
        args: [campaignId, milestoneIndex]
      });
      
      console.log(" Milestone payment claimed successfully with transaction:", data);
      
      // Store the claim locally for tracking only after successful transaction
      claimedPayments.push(milestoneIndex);
      localStorage.setItem(`claimed_payments_${campaignId}`, JSON.stringify(claimedPayments));
      
      return { 
        success: true, 
        campaignId, 
        milestoneIndex, 
        transaction: data,
        transactionHash: data?.hash || data?.receipt?.transactionHash,
        amount: calculateMilestonePayment(campaignId, milestoneIndex)
      };
      
    } catch (error) {
      console.error(" Failed to claim milestone payment from smart contract:", error);
      
      // No fallback to localStorage - only real smart contract payments allowed
      throw new Error(`Payment failed: ${error.message}. Smart contract must be deployed and accessible for real payments.`);
    }
  };

  const calculateMilestonePayment = (campaignId, milestoneIndex) => {
    try {
      // Get campaign details to calculate payment
      const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
      const campaign = campaigns.find(c => c.pId === campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      
      // Calculate milestone payment (50% of total per milestone)
      const totalAmount = parseFloat(campaign.target);
      const milestonePercentage = milestoneIndex / 100; // Convert milestone to decimal (50 -> 0.5, 100 -> 1.0)
      const paymentAmount = totalAmount * milestonePercentage;
      
      return paymentAmount;
    } catch (error) {
      console.error("Failed to calculate milestone payment", error);
      return 0;
    }
  };

  const getClaimedPayments = async (campaignId) => {
    try {
      const claimedPayments = JSON.parse(localStorage.getItem(`claimed_payments_${campaignId}`) || '[]');
      console.log(' getClaimedPayments for campaign:', campaignId, 'result:', claimedPayments);
      return claimedPayments;
    } catch (error) {
      console.error("Failed to get claimed payments", error);
      return [];
    }
  };

  const updateCampaignStatus = async (campaignId, status, proofData = null) => {
    try {
      // Get current campaign statuses from localStorage
      const campaignStatuses = JSON.parse(localStorage.getItem('campaignStatuses') || '{}');
      
      // Update campaign status
      campaignStatuses[campaignId] = {
        status,
        updatedAt: new Date().toISOString(),
        proofData,
        previousStatus: campaignStatuses[campaignId]?.status || 'pending'
      };
      
      // Save updated statuses
      localStorage.setItem('campaignStatuses', JSON.stringify(campaignStatuses));
      
      console.log(`Campaign ${campaignId} status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      return false;
    }
  };

  const getCampaignStatus = (campaignId) => {
    try {
      const campaignStatuses = JSON.parse(localStorage.getItem('campaignStatuses') || '{}');
      return campaignStatuses[campaignId]?.status || 'pending';
    } catch (error) {
      console.error('Failed to get campaign status:', error);
      return 'pending';
    }
  };

  const getCampaignsWithStatus = (campaigns) => {
    try {
      const campaignStatuses = JSON.parse(localStorage.getItem('campaignStatuses') || '{}');
      
      return campaigns.map((campaign, index) => {
        const statusData = campaignStatuses[campaign.pId] || {};
        return {
          ...campaign,
          status: statusData.status || 'pending',
          statusUpdatedAt: statusData.updatedAt,
          proofData: statusData.proofData
        };
      });
    } catch (error) {
      console.error('Failed to get campaigns with status:', error);
      return campaigns;
    }
  };

  const getCampaignsByStatus = (campaigns, status) => {
    const campaignsWithStatus = getCampaignsWithStatus(campaigns);
    return campaignsWithStatus.filter(campaign => campaign.status === status);
  };

  const deleteAllCampaigns = async () => {
    try {
      // Clear all local campaign data
      localStorage.removeItem('campaigns');
      
      // Note: In a real implementation, you would call a smart contract function
      // to delete all campaigns. This would require:
      // 1. A deleteAllCampaigns function in your smart contract
      // 2. Proper authorization (only contract owner or admin)
      // 3. Gas fees for the transaction
      
      console.log("All campaigns deleted from local storage");
      return true;
    } catch (error) {
      console.error("Failed to delete campaigns:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log(' Starting logout process...');
      
      // Step 1: Clear all user type data from localStorage
      setUserType('');
      setShowUserTypeSelection(false);
      localStorage.removeItem('userType');
      
      // Clear all account-specific user types
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('userType_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log(' User type data cleared');
      
      // Step 2: Disconnect from thirdweb
      if (disconnect) {
        try {
          await disconnect();
          console.log(' Thirdweb wallet disconnected successfully');
        } catch (error) {
          console.log(' Thirdweb disconnect error:', error);
        }
      }
      
      // Step 3: Force disconnect from MetaMask if available
      if (window.ethereum) {
        try {
          // Request permission revocation to force disconnect
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          });
          console.log(' MetaMask permissions revoked');
        } catch (error) {
          // Try alternative disconnect method
          try {
            await window.ethereum.request({
              method: 'eth_requestAccounts'
            });
            console.log(' MetaMask account request sent');
          } catch (altError) {
            console.log(' MetaMask disconnect attempts:', altError);
          }
        }
      }
      
      // Step 4: Clear any remaining localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('userType') || key.includes('wallet') || key.includes('connected'))) {
          keysToRemove.push(key);
        }
      }
      if (keysToRemove.length > 0) {
        console.log(' Clearing localStorage items:', keysToRemove);
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      }
      
      console.log(' Logout completed, redirecting to home...');
      
      // Step 5: Navigate to home to show fresh login state
      window.location.href = '/';
    } catch (error) {
      console.error(' Error during logout:', error);
      // Ensure state is cleared even if disconnect fails
      setUserType('');
      setShowUserTypeSelection(false);
      localStorage.removeItem('userType');
      
      // Clear all account-specific user types
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('userType_')) {
          localStorage.removeItem(key);
        }
      });
      
      window.location.href = '/';
    }
  };

  return (
    <StateContext.Provider
      value={{ 
        address, 
        contract, 
        connect,
        disconnect,
        logout,
        connectWallet: manualConnectWallet,
        createCampaign: publishCampaign, 
        getCampaigns, 
        getUserCampaigns, 
        donate, 
        getDonations,
        acceptProject: acceptProjectFunc,
        submitProof: submitProgressProofFunc,
        claimMilestone: claimMilestonePaymentFunc,
        userType,
        setUserType: setUserTypeAndStore,
        showUserTypeSelection,
        setShowUserTypeSelection,
        getContractBalance,
        getMilestoneProgress,
        getCampaignMilestones,
        getProjectProofs,
        getAvailableProjects,
        getContractorProjects,
        calculateMilestonePayment,
        getClaimedPayments,
        deleteAllCampaigns,
        updateCampaignStatus,
        getCampaignStatus,
        getCampaignsWithStatus,
        getCampaignsByStatus
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
