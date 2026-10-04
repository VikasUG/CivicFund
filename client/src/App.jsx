import { Route, Routes, Navigate } from "react-router-dom";
import { CampaignDetails, CreateCampaign, Home, Profile, ContractorDashboard, UserCampaigns, Campaigns, HowItWorks } from "./pages";
import { Navbar, ProtectedRoute, UserTypeSelection, PaymentHistory } from "./components";
import { useStateContext } from './context';

const App = () => {
  const { showUserTypeSelection, userType } = useStateContext();

  console.log('App.jsx - showUserTypeSelection:', showUserTypeSelection);

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)]">
      {/* Show user type selection overlay when needed */}
      {showUserTypeSelection && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50">
          <UserTypeSelection />
        </div>
      )}

      <Navbar />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user-campaigns" element={
            <ProtectedRoute allowedUserTypes={['user']}>
              <UserCampaigns />
            </ProtectedRoute>
          } />
          <Route path="/create-campaign" element={
            <ProtectedRoute allowedUserTypes={['user']}>
              <CreateCampaign />
            </ProtectedRoute>
          } />
          <Route path="/campaign-details/:id" element={<CampaignDetails />} />
          <Route path="/contractor-dashboard" element={
            <ProtectedRoute allowedUserTypes={['contractor']}>
              <ContractorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/payment-history" element={
            <ProtectedRoute allowedUserTypes={['contractor']}>
              <PaymentHistory />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default App;