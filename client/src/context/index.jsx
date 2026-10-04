import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContract, useContractWrite, useAddress, useConnect, useDisconnect } from '@thirdweb-dev/react';

const StateContext = React.createContext();

export const StateContextProvider = ({ children }) => {
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  
  const envAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const localhostAddresses = [
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    '0x0165878A594ca255338adfa4d48449f69242Eb8F'
  ];

  const contractCandidates = [
    envAddress && envAddress !== 'undefined' ? envAddress : null,
    ...localhostAddresses
  ].filter(Boolean);

  const localRpcUrls = ['http://localhost:8545', 'http://127.0.0.1:8545'];

  const getContractAddress = () => {
    if (envAddress && envAddress !== 'undefined') {
      console.log(' Using VITE_CONTRACT_ADDRESS:', envAddress);
      return envAddress;
    }

    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log(' No env contract address found, using localhost fallback:', localhostAddresses[0]);
      return localhostAddresses[0];
    }

    console.log(' Using fallback contract address:', localhostAddresses[2]);
    return localhostAddresses[2];
  };

  const contractAddress = getContractAddress();

  const resolveContractAddress = async (provider) => {
    for (const address of contractCandidates) {
      try {
        const code = await provider.getCode(address);
        console.log(' Checking contract code at', address, code);
        if (code && code !== '0x') {
          console.log(' Found deployed contract at', address);
          return address;
        }
      } catch (err) {
        console.log(' Could not query contract code at', address, err);
      }
    }
    return null;
  };
  
  // Use correct ABI from compiled contract
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_target",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_deadline",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_image",
          "type": "string"
        }
      ],
      "name": "createCampaign",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "acceptProject",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "donateToCampaign",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCampaigns",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "contractor",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "target",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amountCollected",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "image",
              "type": "string"
            },
            {
              "internalType": "address[]",
              "name": "donators",
              "type": "address[]"
            },
            {
              "internalType": "uint256[]",
              "name": "donations",
              "type": "uint256[]"
            }
          ],
          "internalType": "struct CrowdFunding.Campaign[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getDonators",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContractBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getCampaignMilestones",
      "outputs": [
        {
          "internalType": "bool[]",
          "name": "",
          "type": "bool[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getMilestoneProgress",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "completed",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "total",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "numberOfCampaigns",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_milestoneIndex",
          "type": "uint256"
        }
      ],
      "name": "claimMilestonePayment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_milestoneIndex",
          "type": "uint256"
        }
      ],
      "name": "submitProgressProof",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const { contract } = useContract(contractAddress, contractABI);
  const { mutateAsync: acceptProject } = useContractWrite(contract, 'acceptProject');
  const address = useAddress();
  const connect = useConnect();
  const disconnect = useDisconnect();

  // Custom state management for direct MetaMask connection
  const [customAddress, setCustomAddress] = useState(null);
  // Increment this key after any contract mutation to trigger refetch in pages
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [userType, setUserType] = useState('');
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);

  // Restore wallet connection on refresh when previously connected
  useEffect(() => {
    const restoreConnection = async () => {
      if (!window.ethereum) return;

      const cachedAddress = localStorage.getItem('connectedAddress');
      if (!cachedAddress) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const normalized = accounts[0].toLowerCase();
          if (normalized === cachedAddress.toLowerCase()) {
            console.log(' Restoring previously connected wallet:', accounts[0]);
            setCustomAddress(accounts[0]);
            await ensureLocalhostNetwork();
            return;
          }
        }

        localStorage.removeItem('connectedAddress');
      } catch (error) {
        console.error(' Failed to restore wallet connection:', error);
      }
    };

    restoreConnection();
  }, []);

  // Debug Thirdweb hooks
  console.log(' Thirdweb Hooks Debug:');
  console.log(' useAddress result:', address);
  console.log(' useConnect function:', typeof connect);
  console.log(' useDisconnect function:', typeof disconnect);
  console.log(' useContract result:', contract);
  console.log(' useContractWrite acceptProject:', typeof acceptProject);
  
  // Check if Thirdweb is properly initialized
  if (!connect) {
    console.log(' Thirdweb useConnect hook not initialized - using direct MetaMask connection');
  }
  if (!address) {
    console.log(' No wallet connected');
  }

  // Manual connect function to show account selection
  const manualConnectWallet = async () => {
    try {
      console.log(' Manual wallet connection requested...');
      console.log(' MetaMask available:', !!window.ethereum);
      console.log(' Current custom address:', customAddress);
      
      // Use only direct MetaMask connection
      if (window.ethereum) {
        console.log(' Connecting to MetaMask...');

        // Force a fresh connection prompt by revoking existing account permissions first.
        // This helps MetaMask show the account selection UI even if the site is already authorized.
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          });
          console.log(' Revoked previous MetaMask account permissions to force prompt');
        } catch (revokeError) {
          console.log(' Could not revoke previous permissions:', revokeError);
        }

        console.log(' Requesting account access from MetaMask...');
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
          throw new Error('No MetaMask accounts returned. Please make sure your wallet is unlocked.');
        }

        console.log(' MetaMask connected:', accounts[0]);
        setCustomAddress(accounts[0]);
        localStorage.setItem('connectedAddress', accounts[0]);
        
        // Ensure we're on the right network before returning to the app
        await ensureLocalhostNetwork();
        
        return;
      } else {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }
    } catch (error) {
      console.error(' Manual connect failed:', error);
      
      // Provide user-friendly error message
      if (error.code === 4001) {
        console.log(' User rejected wallet connection');
      } else if (error.message?.includes('MetaMask not installed')) {
        console.log(' Please install MetaMask to use this application');
      } else {
        console.log(' Connection failed:', error.message);
      }
      throw error;
    }
  };

  useEffect(() => {
    if (address) {
      localStorage.setItem('connectedAddress', address);
    }
  }, [address]);

  // Auto-switch to localhost network if needed
  const ensureLocalhostNetwork = async () => {
    if (!window.ethereum || isSwitchingNetwork) {
      console.log(' Network switching already in progress or ethereum not available');
      return;
    }
    
    setIsSwitchingNetwork(true);
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log(' Current chain ID:', chainId);
      
      if (chainId !== '0x7a69') { // 31337 in hex
        console.log(' Switching to localhost network...');
        
        try {
          // Try to switch to existing localhost network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }],
          });
          console.log(' Switched to localhost network');
        } catch (switchError) {
          // If request is already pending, wait and retry
          if (switchError.code === -32002) {
            console.log(' Network switch already pending, waiting...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Check again after waiting
            const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (newChainId === '0x7a69') {
              console.log(' Network switch completed successfully');
            } else {
              console.log(' Network switch still pending or failed');
            }
          }
          // If network doesn't exist, add it
          else if (switchError.code === 4902) {
            console.log(' Adding localhost network to MetaMask...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x7a69',
                  chainName: 'Hardhat Local',
                  rpcUrls: localRpcUrls,
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: [],
                },
              ],
            });
            console.log(' Added and switched to localhost network');
          } else {
            console.error(' Failed to switch network:', switchError);
            try {
              console.log(' Attempting fallback network registration with localhost RPCs...');
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x7a69',
                  chainName: 'Hardhat Local',
                  rpcUrls: localRpcUrls,
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: [],
                }],
              });
              console.log(' Registered fallback localhost network');
            } catch (fallbackError) {
              console.error(' Fallback network registration failed:', fallbackError);
            }
          }
        }
      } else {
        console.log(' Already on localhost network');
      }
    } catch (error) {
      console.error(' Network check failed:', error);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainId) => {
      console.log(' Network changed to:', chainId);
      if (chainId === '0x7a69') {
        console.log(' Switched to localhost network, checking contract...');
        setTimeout(() => {
          checkContractStatus();
        }, 1000);
      }
    };

    const handleAccountsChanged = (accounts) => {
      console.log(' MetaMask accounts changed:', accounts);
      if (!accounts || accounts.length === 0) {
        console.log(' No MetaMask accounts available after account change, clearing state');
        setCustomAddress(null);
        setUserType('');
        setShowUserTypeSelection(false);
      } else {
        setCustomAddress(accounts[0]);
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [address]);

  // Check contract status on load - only if wallet is connected and on right network
  useEffect(() => {
    if (address) {
      console.log(' Wallet connected, checking network...');
      
      const checkNetworkAndContract = async () => {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log(' Current chain ID:', chainId);
        
        if (chainId === '0x7a69') {
          console.log(' Already on localhost network, checking contract...');
          setTimeout(() => {
            checkContractStatus();
          }, 1000);
        } else {
          console.log(' Not on localhost network, switching...');
          await ensureLocalhostNetwork();
        }
      };
      
      checkNetworkAndContract();
    } else {
      console.log(' Wallet not connected, skipping contract check');
    }
  }, [address]);

  // Load user type for connected wallet
  useEffect(() => {
    const activeAddress = address || customAddress;
    console.log('Context useEffect:', { address, customAddress, activeAddress, showUserTypeSelection });
    if (activeAddress) {
      console.log('Wallet connected or available via custom address:', activeAddress);
      
      // Check if user already has a saved role
      const savedType = localStorage.getItem(`userType_${activeAddress}`);
      if (savedType) {
        console.log('Found saved role:', savedType);
        setUserType(savedType);
        // Don't show role selection UI if user already has a role
        setShowUserTypeSelection(false);
        console.log('Setting showUserTypeSelection to FALSE (returning user)');
      } else {
        console.log('No saved role found, showing role selection UI');
        // Show role selection UI for any user without a saved role
        setShowUserTypeSelection(true);
        console.log('Setting showUserTypeSelection to TRUE (user needs role selection)');
      }
    } else {
      console.log('No wallet connected or custom address available');
      setUserType('');
      setShowUserTypeSelection(false); // Do not show role selection before login
      console.log('Setting showUserTypeSelection to FALSE (no wallet)');
    }
  }, [address, customAddress]); // Add customAddress dependency

  // Force user type selection to show when wallet connects but no role is set
  useEffect(() => {
    // Debug what's happening with user type selection
    console.log(' User Type Selection Debug:', {
      address: !!address,
      userType: !!userType,
      showUserTypeSelection,
      hasAddress: !!address,
      hasUserType: !!userType,
      shouldShowSelection: address && !userType && !showUserTypeSelection
    });
    
    // Only show user type selection if wallet is connected but no user type is set AND not already showing
    if (address && !userType && !showUserTypeSelection) {
      console.log(' Wallet connected but no user type set, showing selection UI');
      setShowUserTypeSelection(true);
    }
  }, [address, userType]);

  const setUserTypeAndStore = (type) => {
    console.log(' setUserTypeAndStore called with type:', type);
    console.log(' Current address:', address);
    console.log(' Current customAddress:', customAddress);
    
    // Use customAddress for localStorage operations since that's what we're actually using
    const currentAddress = address || customAddress;
    
    if (currentAddress) {
      // Check if user already has a role selected
      const existingType = localStorage.getItem(`userType_${currentAddress}`);
      console.log(' Existing type check:', existingType, 'Requested type:', type);
      
      if (existingType && existingType !== type) {
        console.log(' User already has a different role selected');
        throw new Error('You have already selected a role. You cannot change your user type.');
      }
      
      console.log(` Setting role ${type} for account ${currentAddress}`);
      
      // Save role for this specific account
      localStorage.setItem(`userType_${currentAddress}`, type);
      localStorage.setItem('userType', type);
      setUserType(type);
      setShowUserTypeSelection(false);
      console.log('Setting showUserTypeSelection to FALSE (role selected)');
    } else {
      console.error('Cannot set user type: No wallet connected');
    }
  };

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

  // Contract interaction functions
  const publishCampaign = async (form) => {
    try {
      const activeAddress = address || customAddress;
      if (!activeAddress) {
        throw new Error('No wallet address available for campaign creation. Please connect your wallet.');
      }

      const deadlineDate = parseDeadlineDate(form.deadline);
      if (!deadlineDate) {
        throw new Error('Invalid campaign deadline. Please select a valid future date.');
      }
      deadlineDate.setHours(23, 59, 59, 999);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
      if (Number.isNaN(deadlineTimestamp) || deadlineTimestamp <= 0) {
        throw new Error('Invalid campaign deadline. Please select a valid future date.');
      }

      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please install MetaMask.');
      }

      console.log(' Publishing campaign using ethers.js:', {
        ...form,
        deadline: deadlineTimestamp,
        owner: activeAddress
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      console.log(' Current network:', network);
      if (network.chainId !== 31337) {
        throw new Error(`MetaMask must be connected to localhost Hardhat network (chainId 31337). Current chainId: ${network.chainId}`);
      }

      const resolvedAddress = await resolveContractAddress(provider);
      if (!resolvedAddress) {
        throw new Error('No deployed contract found on the current network. Make sure Hardhat is running and the contract address is correct.');
      }

      const signer = provider.getSigner();
      const contractWithSigner = new ethers.Contract(resolvedAddress, contractABI, signer);

      // Get current block timestamp for comparison
      const currentBlock = await provider.getBlock('latest');
      const blockTimestamp = currentBlock.timestamp;
      
      console.log(' Deadline validation:', {
        deadlineTimestamp,
        blockTimestamp,
        deadlineDate: new Date(deadlineTimestamp * 1000).toISOString(),
        blockDate: new Date(blockTimestamp * 1000).toISOString(),
        isValid: deadlineTimestamp > blockTimestamp,
        difference: deadlineTimestamp - blockTimestamp
      });

      if (deadlineTimestamp <= blockTimestamp) {
        throw new Error(`Deadline must be in the future. Current block time: ${blockTimestamp}, Your deadline: ${deadlineTimestamp}`);
      }

      const category = typeof form?.category === 'string' && form.category ? form.category : 'pothole_repair';
      const score = form?.score != null ? Number(form.score) : 0;
      const usesCappedCreateCampaign = Boolean(form?.category) || form?.score != null;
      const createCampaignSignature = usesCappedCreateCampaign
        ? 'createCampaign(address,string,string,uint256,uint256,string,string,uint256)'
        : 'createCampaign(address,string,string,uint256,uint256,string)';
      const createCampaignArgs = usesCappedCreateCampaign
        ? [
            activeAddress,
            form.title,
            form.description,
            form.target,
            deadlineTimestamp,
            form.image,
            category,
            score
          ]
        : [
            activeAddress,
            form.title,
            form.description,
            form.target,
            deadlineTimestamp,
            form.image
          ];

      console.log(' Creating campaign with params:', {
        activeAddress,
        title: form.title,
        description: form.description,
        target: form.target,
        deadlineTimestamp,
        image: form.image,
        category,
        score
      });

      console.log(' Contract address:', resolvedAddress);
      console.log(' Signer address:', await signer.getAddress());

      // Try to estimate gas first, but use a high limit as fallback
      let gasLimit = 3000000; // Default high limit
      try {
        const estimatedGas = await contractWithSigner.estimateGas[createCampaignSignature](...createCampaignArgs);
        console.log(' Estimated gas:', estimatedGas.toString());
        // Add 50% buffer to estimation
        gasLimit = Math.floor(estimatedGas.toNumber() * 1.5);
        console.log(' Using gas limit with buffer:', gasLimit);
      } catch (estimationError) {
        console.log(' Gas estimation failed, using default high limit:', gasLimit);
        console.log(' Estimation error:', estimationError.message);
      }

      const tx = await contractWithSigner[createCampaignSignature](...createCampaignArgs, { gasLimit: gasLimit });
      console.log(' Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log(' Transaction receipt received:', receipt);
      if (receipt.status !== 1) {
        console.error(' Transaction mined but failed:', receipt);
        throw new Error('Transaction failed on-chain. It may have run out of gas or reverted.');
      }
      console.log(' Campaign published successfully via ethers.js:', receipt);
      
      // Store image in localStorage as fallback
      const campaignCount = await contractWithSigner.numberOfCampaigns();
      const campaignIndex = campaignCount.toNumber() - 1;
      if (form.image) {
        localStorage.setItem(`campaign_image_${campaignIndex}`, form.image);
        console.log(` Campaign image stored in localStorage for campaign ${campaignIndex}`);
      }
      
      // Return immediately after transaction confirmation so the UI loading state clears.
      // The block-waiting and refresh logic runs in the background without blocking the caller.
      setTimeout(() => {
        (async () => {
          try {
            // Wait for the next block so the provider has the latest state before refreshing.
            // This prevents stale reads where the newly created campaign isn't visible yet.
            const currentBlock = await provider.getBlockNumber();
            const targetBlock = currentBlock + 1;
            console.log(` Waiting for block ${targetBlock} to be mined before refreshing...`);
            await new Promise((resolve) => {
              const checkBlock = async () => {
                const latestBlock = await provider.getBlockNumber();
                if (latestBlock >= targetBlock) {
                  resolve();
                } else {
                  setTimeout(checkBlock, 500);
                }
              };
              checkBlock();
            });
            console.log(' Latest block synced, refreshing campaign lists');
            
            // Small delay to allow MetaMask's provider cache to fully sync with the new block.
            // Without this, the first read after creation can still return stale data.
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Trigger refresh of campaign lists in connected pages
            setRefreshKey((prevKey) => prevKey + 1);
          } catch (blockError) {
            console.log(' Could not wait for next block, refreshing anyway:', blockError.message);
            // Still trigger refresh even if block waiting fails
            setRefreshKey((prevKey) => prevKey + 1);
          }
        })();
      }, 0);
      
      return receipt;
    } catch (error) {
      console.error(' Failed to publish campaign:', error);
      console.error(' Error code:', error.code);
      console.error(' Error message:', error.message);
      console.error(' Error data:', error.data);
      console.error(' Error reason:', error.reason);
      console.error(' Error error:', error.error);
      
      // Try to extract revert reason
      if (error.error && error.error.message) {
        console.error(' Revert reason:', error.error.message);
        throw new Error(`Contract error: ${error.error.message}`);
      } else if (error.reason) {
        console.error(' Revert reason:', error.reason);
        throw new Error(`Contract error: ${error.reason}`);
      } else if (error.message && error.message.includes('revert')) {
        console.error(' Revert detected in message:', error.message);
        throw new Error(`Contract reverted: ${error.message}`);
      }
      
      throw error;
    }
  };

  const acceptProjectFunc = async (campaignId) => {
    try {
      console.log(' Accepting project:', campaignId);

      // Check if we have a proper wallet connection for Thirdweb
      const activeAddress = address || customAddress;
      const hasThirdwebConnection = acceptProject && contract && activeAddress;

      if (hasThirdwebConnection) {
        console.log(' Using Thirdweb for acceptProject');
        try {
          const data = await acceptProject({ args: [campaignId] });
          console.log(' Project accepted successfully via Thirdweb:', data);
          return data;
        } catch (thirdwebError) {
          console.log(' Thirdweb failed, falling back to ethers.js:', thirdwebError.message);
          // Fall through to ethers.js
        }
      }

      // Fallback to ethers.js
      console.log(' Using ethers.js fallback for acceptProject');
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please connect your wallet.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const resolvedAddress = await resolveContractAddress(provider);

      if (!resolvedAddress) {
        throw new Error('No deployed contract found on the current network.');
      }

      const signer = provider.getSigner();
      const contractWithSigner = new ethers.Contract(resolvedAddress, contractABI, signer);

      console.log(' Calling acceptProject with ethers.js:', { campaignId, resolvedAddress });
      const tx = await contractWithSigner.acceptProject(campaignId);
      const receipt = await tx.wait();
      console.log(' Project accepted successfully via ethers.js:', receipt);
      return receipt;

    } catch (error) {
      console.error(' Failed to accept project:', error);
      throw error;
    }
  };

  const normalizeCampaign = (campaign) => {
    if (!campaign) return campaign;

    const normalizeValue = (value) => {
      if (value == null) return value;
      if (typeof value === 'object' && typeof value.toString === 'function') {
        return value.toString();
      }
      return value;
    };

    return {
      ...campaign,
      target: normalizeValue(campaign.target),
      deadline: normalizeValue(campaign.deadline),
      amountCollected: normalizeValue(campaign.amountCollected),
      image: normalizeValue(campaign.image),
    };
  };

  const getCampaigns = async () => {
    try {
      console.log(' Fetching campaigns via ethers.js...');
      
      if (!window.ethereum) {
        console.log(' No ethereum provider, returning empty campaigns');
        return [];
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const resolvedAddress = await resolveContractAddress(provider);
      
      if (!resolvedAddress) {
        console.log(' No contract found, returning empty campaigns');
        return [];
      }

      const contractInstance = new ethers.Contract(resolvedAddress, contractABI, provider);
      const data = await contractInstance.getCampaigns();
      console.log(' Campaigns fetched:', data);
      
      // Add localStorage fallback for images
      const campaignsWithImages = data.map((campaign, index) => {
        const normalizedCampaign = normalizeCampaign(campaign);
        const storedImage = localStorage.getItem(`campaign_image_${index}`);
        
        console.log(` Campaign ${index} image check:`, {
          contractImage: normalizedCampaign.image,
          storedImage: storedImage ? 'found' : 'not found',
          usingFallback: !normalizedCampaign.image && storedImage
        });
        
        return {
          ...normalizedCampaign,
          pId: index,
          image: normalizedCampaign.image || storedImage || ''
        };
      });
      
      return campaignsWithImages;
    } catch (error) {
      console.error(' Failed to fetch campaigns:', error);
      console.log(' Returning empty campaigns array due to error');
      return [];
    }
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    const activeAddress = address || customAddress;
    if (!activeAddress) return [];
    return allCampaigns.filter(campaign => campaign.owner.toLowerCase() === activeAddress.toLowerCase());
  };

  const donate = async (pId, amount) => {
    try {
      console.log(' Donating to campaign:', { pId, amount });

      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please connect your wallet.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const resolvedAddress = await resolveContractAddress(provider);

      if (!resolvedAddress) {
        throw new Error('No deployed contract found on the current network.');
      }

      const contractWithSigner = new ethers.Contract(resolvedAddress, contractABI, signer);
      const value = ethers.utils.parseEther(String(amount));

      const tx = await contractWithSigner.donateToCampaign(pId, { value });
      const receipt = await tx.wait();

      console.log(' Donation successful:', receipt);
      return receipt;
    } catch (error) {
      console.error(' Failed to donate:', error);
      throw error;
    }
  };

  const getDonations = async (pId) => {
    try {
      console.log(' Fetching donations for campaign:', pId);

      // Fallback to ethers.js if Thirdweb contract is not available
      if (!contract || !contract.call) {
        console.log(' Thirdweb contract not available, using ethers.js fallback');
        if (!window.ethereum) {
          console.log(' No ethereum provider, returning empty arrays');
          return [[], []];
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const resolvedAddress = await resolveContractAddress(provider);

        if (!resolvedAddress) {
          console.log(' No contract found, returning empty arrays');
          return [[], []];
        }

        const contractInstance = new ethers.Contract(resolvedAddress, contractABI, provider);
        const data = await contractInstance.getDonators(pId);
        console.log(' Donations fetched via ethers.js:', data);
        return data;
      }

      const data = await contract.call("getDonators", [pId]);
      console.log(' Donations fetched:', data);
      return data;
    } catch (error) {
      console.error(' Failed to fetch donations:', error);
      return [[], []];
    }
  };

  const getContractBalance = async () => {
    try {
      console.log(' Fetching contract balance');

      // Fallback to ethers.js if Thirdweb contract is not available
      if (!contract || !contract.call) {
        console.log(' Thirdweb contract not available, using ethers.js fallback');
        if (!window.ethereum) {
          console.log(' No ethereum provider, returning 0');
          return '0';
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const resolvedAddress = await resolveContractAddress(provider);

        if (!resolvedAddress) {
          console.log(' No contract found, returning 0');
          return '0';
        }

        const contractInstance = new ethers.Contract(resolvedAddress, contractABI, provider);
        const balance = await contractInstance.getContractBalance();
        return ethers.utils.formatEther(balance.toString());
      }

      const balance = await contract.call('getContractBalance');
      return ethers.utils.formatEther(balance.toString());
    } catch (error) {
      console.error(' Failed to get contract balance:', error);
      return '0';
    }
  };

  const claimMilestone = async (campaignId, milestoneIndex) => {
    try {
      console.log(' Claiming milestone payment:', { campaignId, milestoneIndex });

      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please connect your wallet.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const resolvedAddress = await resolveContractAddress(provider);

      if (!resolvedAddress) {
        throw new Error('No deployed contract found on the current network.');
      }

      const contractWithSigner = new ethers.Contract(resolvedAddress, contractABI, signer);

      // Convert milestone percentage to index for the contract. Only 50% and 100% are valid proof stages.
      const milestoneIndexValue = milestoneIndex === 50 ? 0 : milestoneIndex === 100 ? 1 : null;
      if (milestoneIndexValue === null) {
        throw new Error('Invalid milestone percent. Only 50 and 100 are allowed for milestone claims.');
      }
      
      console.log(' Calling claimMilestonePayment with:', { campaignId, milestoneIndex: milestoneIndexValue });
      const tx = await contractWithSigner.claimMilestonePayment(campaignId, milestoneIndexValue);
      console.log(' Transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log(' Milestone payment claimed successfully:', receipt);
      
      return receipt;
    } catch (error) {
      console.error(' Failed to claim milestone payment:', error);
      throw error;
    }
  };

  const submitProgressProof = async (campaignId, milestoneIndex) => {
    try {
      console.log(' Submitting progress proof to blockchain:', { campaignId, milestoneIndex });

      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please connect your wallet.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const resolvedAddress = await resolveContractAddress(provider);

      if (!resolvedAddress) {
        throw new Error('No deployed contract found on the current network.');
      }

      const contractWithSigner = new ethers.Contract(resolvedAddress, contractABI, signer);

      // Convert milestone percentage to index for the contract. Only 50% and 100% are valid proof stages.
      const milestoneIndexValue = milestoneIndex === 50 ? 0 : milestoneIndex === 100 ? 1 : null;
      if (milestoneIndexValue === null) {
        throw new Error('Invalid milestone percent. Only 50 and 100 are allowed for proof submission.');
      }
      
      console.log(' Calling submitProgressProof with:', { campaignId, milestoneIndex: milestoneIndexValue });
      const tx = await contractWithSigner.submitProgressProof(campaignId, milestoneIndexValue);
      console.log(' Transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log(' Progress proof submitted and payment released successfully:', receipt);
      
      return receipt;
    } catch (error) {
      console.error(' Failed to submit progress proof:', error);
      throw error;
    }
  };

  const getMilestoneProgress = async (campaignId) => {
    try {
      console.log(' Fetching milestone progress for campaign:', campaignId);

      // The on-chain milestone state is the single source of truth. This
      // guarantees a freshly created campaign always reports 0 completed
      // milestones, instead of inheriting stale localStorage from a previous
      // campaign that reused the same campaign id (e.g. after a redeploy).
      const milestones = await getCampaignMilestones(campaignId);
      let completed = milestones.filter((m) => m && m.completed).length;

      // Convention: completing the 100% milestone means the whole project is
      // done, which covers the 50% milestone for display purposes too.
      if (milestones.length >= 2 && milestones[1]?.completed && !milestones[0]?.completed) {
        completed = 2;
      }

      return { completed, total: milestones.length || 2 };
    } catch (error) {
      console.error(' Failed to get milestone progress:', error);
      return { completed: 0, total: 2 };
    }
  };

  const getCampaignMilestones = async (campaignId) => {
    try {
      console.log(' Fetching campaign milestones for campaign:', campaignId);

      // The on-chain milestone state is the single source of truth. We no longer
      // override it with localStorage claim records, which caused brand-new
      // campaigns to display as already released.
      let milestonesRaw = [];
      if (!contract || !contract.call) {
        console.log(' Thirdweb contract not available, using ethers.js fallback');
        if (!window.ethereum) {
          console.log(' No ethereum provider, returning empty milestones');
          return [];
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const resolvedAddress = await resolveContractAddress(provider);

        if (!resolvedAddress) {
          console.log(' No contract found, returning empty milestones');
          return [];
        }

        const contractInstance = new ethers.Contract(resolvedAddress, contractABI, provider);
        milestonesRaw = await contractInstance.getCampaignMilestones(campaignId);
      } else {
        milestonesRaw = await contract.call('getCampaignMilestones', [campaignId]);
      }

      const milestones = milestonesRaw.map((completed) => ({ completed: Boolean(completed) }));

      // Convention: completing the 100% milestone means the project is fully
      // done, so the 50% milestone is considered covered as well.
      if (milestones.length >= 2 && milestones[1].completed && !milestones[0].completed) {
        milestones[0].completed = true;
      }

      return milestones;
    } catch (error) {
      console.error(' Failed to get campaign milestones:', error);
      return [];
    }
  };

  // Helper function to check contract status
  const checkContractStatus = async () => {
    console.log(' Contract Status Check:');
    console.log(' Contract Object:', contract);
    console.log(' Contract Address:', contractAddress);
    console.log(' CreateCampaign Function:', createCampaign);
    console.log(' Wallet Address:', address);
    console.log(' Window.ethereum:', typeof window !== 'undefined' ? !!window.ethereum : 'N/A');
    
    if (!window.ethereum) {
      console.error(' Ethereum provider not available. Please install MetaMask.');
      return false;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    try {
      const network = await provider.getNetwork();
      console.log(' Current network:', network);

      if (network.chainId !== 31337) {
        console.error(' Wrong network! Please connect to localhost Hardhat network.');
        return false;
      }

      const resolvedAddress = await resolveContractAddress(provider);
      if (!resolvedAddress) {
        console.error(' No deployed contract found on the current network.');
        return false;
      }

      console.log(' Resolved contract address:', resolvedAddress);
    } catch (err) {
      console.error(' Could not verify contract deployment:', err);
      return false;
    }

    if (!contract) {
      console.error(' Contract not loaded. Possible issues:');
      console.error('1. Hardhat node not running');
      console.error('2. Contract not deployed');
      console.error('3. Wrong network in MetaMask');
      console.error('4. Contract address mismatch');
      console.error('5. Wallet not connected to localhost network');
      return false;
    }
    
    if (!createCampaign) {
      console.error(' CreateCampaign function not available. Possible issues:');
      console.error('1. Contract ABI mismatch');
      console.error('2. Contract not deployed correctly');
      return false;
    }
    
    console.log(' Contract is properly initialized');
    return true;
  };

  // Helper functions for campaign status
  const getCampaignsWithStatus = (campaigns) => {
    return campaigns.map(campaign => {
      const deadlineValue = Number(campaign.deadline);
      const hasContractor = campaign.contractor && campaign.contractor !== '0x0000000000000000000000000000000000000000';
      if (hasContractor) {
        return { ...campaign, status: 'accepted' };
      } else if (!Number.isNaN(deadlineValue) && deadlineValue < Date.now() / 1000) {
        return { ...campaign, status: 'rejected' };
      }
      return { ...campaign, status: 'pending' };
    });
  };

  const getCampaignsByStatus = (campaigns, status) => {
    return campaigns.filter(campaign => campaign.status === status);
  };

  // Logout function
  const logout = () => {
    console.log(' Logging out...');
    
    // Clear custom address state
    setCustomAddress(null);
    localStorage.removeItem('connectedAddress');
    
    // Try to disconnect from Thirdweb if available
    if (disconnect) {
      try {
        disconnect();
      } catch (error) {
        console.log(' Thirdweb disconnect failed:', error);
      }
    }
    
    // Also try to disconnect from MetaMask directly
    if (window.ethereum) {
      window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }]
      }).then(() => {
        console.log(' MetaMask permissions revoked');
      }).catch(error => {
        console.log(' MetaMask disconnect failed:', error);
      });
    }
    
    setUserType('');
    setShowUserTypeSelection(false);
    
    // Clear all user type data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('userType_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('userType');
  };

  const getAvailableProjects = async () => {
    console.log(' getAvailableProjects called');
    try {
      console.log(' Fetching available projects for contractors');
      const allCampaigns = await getCampaigns();
      console.log(' All campaigns fetched:', allCampaigns.length);
      
      if (!allCampaigns || allCampaigns.length === 0) {
        console.log(' No campaigns found');
        return [];
      }
      
      allCampaigns.forEach((campaign, index) => {
        const collectedBigInt = BigInt(campaign.amountCollected);
        const targetBigInt = BigInt(campaign.target);
        const isFullyFunded = collectedBigInt >= targetBigInt;
        const isAvailable = !campaign.contractor && isFullyFunded;
        
        console.log(` Campaign ${index}:`, {
          title: campaign.title,
          contractor: campaign.contractor,
          amountCollected: campaign.amountCollected,
          target: campaign.target,
          amountCollectedBigInt: collectedBigInt.toString(),
          targetBigInt: targetBigInt.toString(),
          comparison: `${collectedBigInt.toString()} >= ${targetBigInt.toString()}`,
          isFullyFunded,
          isAvailable
        });
      });
      
      const availableProjects = allCampaigns.filter((campaign, index) => {
        // Only show campaigns that are:
        // 1. Not already assigned to a contractor
        // 2. Fully funded (amountCollected >= target)
        const hasNoContractor = !campaign.contractor || campaign.contractor === '0x0000000000000000000000000000000000000000';
        const isFullyFunded = BigInt(campaign.amountCollected) >= BigInt(campaign.target);
        const shouldInclude = hasNoContractor && isFullyFunded;
        
        console.log(` Filter check for campaign ${index}:`, {
          title: campaign.title,
          contractor: campaign.contractor,
          hasNoContractor,
          isFullyFunded,
          shouldInclude
        });
        
        return shouldInclude;
      });
      
      console.log(' Available projects found:', availableProjects.length);
      console.log(' Available projects:', availableProjects.map(p => ({ title: p.title, collected: p.amountCollected, target: p.target })));
      return availableProjects;
    } catch (error) {
      console.error(' Failed to get available projects:', error);
      console.error(' Error stack:', error.stack);
      return [];
    }
  };

  const getContractorProjects = async () => {
    try {
      console.log(' Fetching contractor projects');
      const allCampaigns = await getCampaigns();
      const activeAddress = address || customAddress;
      
      console.log(' Filtering for contractor address:', activeAddress);
      
      allCampaigns.forEach((campaign, index) => {
        const isActiveContractor = campaign.contractor && campaign.contractor.toLowerCase() === activeAddress.toLowerCase();
        console.log(` Campaign ${index} for contractor check:`, {
          title: campaign.title,
          contractor: campaign.contractor,
          contractorLower: campaign.contractor?.toLowerCase(),
          activeAddressLower: activeAddress.toLowerCase(),
          isActiveContractor,
          campaignId: campaign.pId
        });
      });
      
      const contractorProjects = allCampaigns.filter(campaign => 
        campaign.contractor && campaign.contractor.toLowerCase() === activeAddress.toLowerCase()
      );
      console.log(' Contractor projects found:', contractorProjects.length);
      console.log(' Contractor projects:', contractorProjects.map(p => ({ title: p.title, contractor: p.contractor })));
      return contractorProjects;
    } catch (error) {
      console.error(' Failed to get contractor projects:', error);
      return [];
    }
  };

  const getProjectProofs = async (campaignId) => {
    try {
      console.log(' Fetching project proofs for campaign:', campaignId);
      
      // Get proofs from localStorage and normalize milestone values
      const proofs = JSON.parse(localStorage.getItem(`campaign_proofs_${campaignId}`) || '[]');
      const normalizedProofs = Array.isArray(proofs)
        ? proofs.map((proof) => ({
            ...proof,
            milestone: Number(proof.milestone),
            submittedAt: proof.submittedAt || new Date().toISOString()
          }))
        : [];
      console.log(' Retrieved proofs from localStorage:', normalizedProofs);
      
      return normalizedProofs;
    } catch (error) {
      console.error(' Failed to get project proofs:', error);
      return [];
    }
  };

  const getClaimedPayments = async (campaignId) => {
    try {
      console.log(' Fetching claimed payments for campaign:', campaignId);

      // The on-chain milestone state is the single source of truth for which
      // milestone payments have been released. Deriving this from localStorage
      // caused freshly created campaigns (that reused a previously used id after
      // a redeploy) to display as already released.
      const milestones = await getCampaignMilestones(campaignId);
      const percentages = [50, 100];
      const claimed = milestones
        .map((m, i) => (m && m.completed ? percentages[i] : null))
        .filter((v) => v != null);
      console.log(' Derived claimed payments from on-chain milestones:', claimed);
      return claimed;
    } catch (error) {
      console.error(' Failed to get claimed payments:', error);
      return [];
    }
  };

  // Test function to verify context exports
  const testContextFunctions = () => {
    console.log(' Testing context functions:');
    console.log(' getAvailableProjects exists:', typeof getAvailableProjects);
    console.log(' getContractorProjects exists:', typeof getContractorProjects);
    console.log(' getProjectProofs exists:', typeof getProjectProofs);
  };

  return (
    <StateContext.Provider
      value={{
        address: address || customAddress,
        contract,
        connectWallet: manualConnectWallet,
        createCampaign: publishCampaign, 
        getCampaigns, 
        getUserCampaigns, 
        donate, 
        getDonations,
        getContractBalance,
        getMilestoneProgress,
        getCampaignMilestones,
        acceptProject: acceptProjectFunc,
        claimMilestone,
        submitProgressProof,
        getClaimedPayments,
        getCampaignsWithStatus,
        getCampaignsByStatus,
        getAvailableProjects,
        getContractorProjects,
        getProjectProofs,
        testContextFunctions,
        userType,
        setUserType: setUserTypeAndStore,
        showUserTypeSelection,
        setShowUserTypeSelection,
        refreshKey,
        refreshCampaigns: () => setRefreshKey((prevKey) => prevKey + 1),
        logout
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => React.useContext(StateContext);
