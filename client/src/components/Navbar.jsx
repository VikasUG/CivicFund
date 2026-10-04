import React, { useState, useEffect, useRef } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useStateContext } from '../context';

import { CustomButton } from './';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, userType, logout, connectWallet } = useStateContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToCampaigns = () => {
    setMobileOpen(false);
    navigate('/campaigns');
  };

  const goToHowItWorks = () => {
    setMobileOpen(false);
    navigate('/how-it-works');
  };

  const handleContractorPortal = async () => {
    setMobileOpen(false);
    if (address) {
      navigate('/contractor-dashboard');
      return;
    }
    try {
      await connectWallet();
    } catch (error) {
      console.error('Contractor portal connect error:', error);
    }
  };

  const shortAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const accountItems = userType === 'contractor'
    ? [
        { label: 'Dashboard', path: '/contractor-dashboard' },
        { label: 'Payment History', path: '/payment-history' },
      ]
    : [
        { label: 'Create Campaign', path: '/create-campaign' },
        { label: 'My Campaigns', path: '/user-campaigns' },
        { label: 'Profile', path: '/profile' },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            CIVIC<span className="text-[var(--accent)]">FUND</span>
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={goToCampaigns}
            className="font-epilogue text-[15px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Campaigns
          </button>
          <button
            onClick={goToHowItWorks}
            className="font-epilogue text-[15px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            How It Works
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3" ref={menuRef}>
          {userType === 'contractor' && address ? (
            <CustomButton
              btnType="button"
              title="Contractor Dashboard"
              styles="hidden sm:inline-flex border border-[var(--border-color)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-hover)] rounded-lg px-4 py-2 text-[14px] font-semibold"
              handleClick={() => navigate('/contractor-dashboard')}
            />
          ) : (
            !address && location.pathname === '/' && (
              <CustomButton
                btnType="button"
                title="Contractor Portal"
                styles="hidden sm:inline-flex border border-[var(--border-color)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-hover)] rounded-lg px-4 py-2 text-[14px] font-semibold"
                handleClick={handleContractorPortal}
              />
            )
          )}

          {address ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] py-1 pl-1 pr-3 hover:bg-[var(--bg-hover)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-semibold text-white">
                  {shortAddress(address).slice(2, 4).toUpperCase()}
                </span>
                <span className="hidden font-epilogue text-[13px] font-medium text-[var(--text-primary)] sm:inline">
                  {shortAddress(address)}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 shadow-lg">
                  <div className="border-b border-[var(--border-color)] px-4 py-2">
                    <p className="font-epilogue text-[12px] uppercase tracking-wide text-[var(--text-secondary)]">
                      {userType === 'contractor' ? 'Contractor' : 'Citizen'}
                    </p>
                    <p className="font-epilogue text-[13px] font-medium text-[var(--text-primary)]">
                      {shortAddress(address)}
                    </p>
                  </div>
                  {accountItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(item.path);
                      }}
                      className="block w-full px-4 py-2 text-left font-epilogue text-[14px] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full border-t border-[var(--border-color)] px-4 py-2 text-left font-epilogue text-[14px] text-red-600 transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <CustomButton
              btnType="button"
              title="Connect Wallet"
              styles="hidden sm:inline-flex bg-[var(--accent)] text-white hover:opacity-90 rounded-lg px-4 py-2 text-[14px] font-semibold"
              handleClick={() => connectWallet().catch((e) => console.error(e))}
            />
          )}

          {/* Mobile menu toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span className="text-[var(--text-primary)] text-sm font-semibold">
              {mobileOpen ? 'Close' : 'Menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <button onClick={goToCampaigns} className="rounded-lg px-3 py-2 text-left font-epilogue text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              Campaigns
            </button>
            <button onClick={goToHowItWorks} className="rounded-lg px-3 py-2 text-left font-epilogue text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              How It Works
            </button>
            {userType === 'contractor' && address ? (
              <button onClick={() => { setMobileOpen(false); navigate('/contractor-dashboard'); }} className="rounded-lg px-3 py-2 text-left font-epilogue text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                Contractor Dashboard
              </button>
            ) : (
              !address && location.pathname === '/' && (
                <button onClick={handleContractorPortal} className="rounded-lg px-3 py-2 text-left font-epilogue text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                  Contractor Portal
                </button>
              )
            )}
            {accountItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { setMobileOpen(false); navigate(item.path); }}
                className="rounded-lg px-3 py-2 text-left font-epilogue text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                {item.label}
              </button>
            ))}
            {address && (
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="rounded-lg px-3 py-2 text-left font-epilogue text-[15px] text-red-600 hover:bg-[var(--bg-hover)]"
              >
                Logout
              </button>
            )}
            {!address && (
              <CustomButton
                btnType="button"
                title="Connect Wallet"
                styles="mt-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg px-4 py-2 text-[14px] font-semibold"
                handleClick={() => connectWallet().catch((e) => console.error(e))}
              />
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;