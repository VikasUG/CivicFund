import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '../context';

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { address, connect, setUserType: setContextUserType, userType, setShowUserTypeSelection } = useStateContext();

  // Check if current wallet has a saved role - use customAddress if address is not available
  const currentAddress = address || localStorage.getItem('currentAddress') || '';
  const savedRoleForWallet = localStorage.getItem(`userType_${currentAddress}`);

  console.log('UserTypeSelection Debug:', { address, userType, savedRoleForWallet });

  useEffect(() => {
    if (userType) {
      setSelectedType(userType);
    } else if (savedRoleForWallet) {
      setSelectedType(savedRoleForWallet);
    }
  }, [userType, savedRoleForWallet]);

  const handleTypeSelection = (type) => {
    // Check if user already has a saved role
    if (savedRoleForWallet && savedRoleForWallet !== type) {
      alert(`You have already selected a role: ${savedRoleForWallet}. You cannot change your user type.`);
      return;
    }
    
    // Always allow user to proceed with selected type
    console.log(` User selected type: ${type}`);
    
    setSelectedType(type);
    setContextUserType(type);
    
    // Add visual feedback
    const selectionElement = document.getElementById(`type-${type}`);
    if (selectionElement) {
      selectionElement.classList.add('scale-95');
      setTimeout(() => {
        selectionElement.classList.remove('scale-95');
      }, 150);
    }
  };

  const handleContinue = async () => {
    setIsProcessing(true);

    try {
      if (!address) {
        await connect();
        // Wait a brief moment for wallet connection
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Save user type for this specific wallet address
      if (address) {
        localStorage.setItem(`userType_${address}`, selectedType);
        localStorage.setItem('userType', selectedType);
        setContextUserType(selectedType);
        setShowUserTypeSelection(false);

        // Navigate based on user type
        if (selectedType === 'contractor') {
          navigate('/contractor-dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error during user type selection:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const roles = [
    {
      type: 'user',
      label: 'Citizen',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      description: 'Create and back public infrastructure campaigns with escrowed funds.',
      accent: '#1dc071',
    },
    {
      type: 'contractor',
      label: 'Contractor',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-.5-.5-2.1 2.6-2.6Z" />
        </svg>
      ),
      description: 'Accept available jobs and claim payouts once work is verified.',
      accent: '#8b5cf6',
    },
  ];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-[16px] px-5 py-4 max-w-md w-full mx-4 shadow-2xl border border-[var(--border-color)]">
        <h2 className="font-epilogue font-bold text-[20px] text-[var(--text-primary)] text-center mb-2">
          {savedRoleForWallet ? 'Current Account Role' : 'Choose Your Account Type'}
        </h2>

        {savedRoleForWallet ? (
          <p className="font-epilogue font-normal text-[13px] text-[#8fd6a1] text-center mb-4">
            This account is registered as {savedRoleForWallet === 'contractor' ? 'a Contractor' : 'a Citizen'}
            <br />
            <span className="text-[var(--text-secondary)] text-xs">
              Your role is permanently saved for this account
            </span>
          </p>
        ) : (
          <p className="font-epilogue font-normal text-[13px] text-[var(--text-secondary)] text-center mb-4">
            Select your role to continue with the CrowdFunding platform
            <br />
            <span className="text-[#8fd6a1] text-xs">
              Each MetaMask account can choose its own role independently
            </span>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {roles.map((role) => {
            const isSelected = selectedType === role.type || (!selectedType && savedRoleForWallet === role.type);
            return (
              <button
                key={role.type}
                type="button"
                id={`type-${role.type}`}
                disabled={savedRoleForWallet || isProcessing}
                onClick={() => handleTypeSelection(role.type)}
                style={isSelected ? { borderColor: role.accent, backgroundColor: `${role.accent}1a` } : undefined}
                className={`group text-left rounded-[12px] border-2 p-3.5 transition-all duration-200 ${
                  savedRoleForWallet ? 'opacity-70 cursor-default' : 'cursor-pointer hover:-translate-y-0.5'
                } ${isSelected ? 'border-[var(--accent)]' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent)]'}`}
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full mb-2 transition-colors"
                  style={{ backgroundColor: `${role.accent}26`, color: role.accent }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {role.icon}
                  </svg>
                </div>
                <div className="font-epilogue font-bold text-[15px] text-[var(--text-primary)] mb-1">
                  {role.label}
                </div>
                <div className="font-epilogue text-[12px] leading-[1.4] text-[var(--text-secondary)]">
                  {role.description}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={isProcessing || (!savedRoleForWallet && !selectedType)}
          className="mt-4 w-full rounded-[10px] bg-[var(--accent)] py-2.5 font-epilogue font-semibold text-[14px] text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Please wait...' : 'Continue'}
        </button>
    </div>
  );
};

export default UserTypeSelection;
