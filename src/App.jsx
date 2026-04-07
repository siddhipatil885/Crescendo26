import React, { useState } from 'react';
import MobileLayout from './components/MobileLayout';
import Home from './pages/citizen/Home';
import CaptureIssue from './pages/citizen/CaptureIssue';
import ReportIssue from './pages/citizen/ReportIssue';
import IssueDetails from './pages/citizen/IssueDetails';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subView, setSubView] = useState(null); // Used to go "deeper" into e.g. 'details'
  const [reportStep, setReportStep] = useState('capture'); // Tracks if we are capturing or analyzing
  const [isAdminMode, setIsAdminMode] = useState(false); // Quick toggle for demo

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSubView(null); // Reset subview on tab change
    if (tabId === 'report') {
      setReportStep('capture'); // Reset to capture step whenever entering report tab
    }
  };

  const handleNavigate = (viewId) => {
    setSubView(viewId);
  };

  const renderContent = () => {
    // If viewing a detail page
    if (subView === 'details') {
      return <IssueDetails />;
    }

    // Main Tab Routing
    switch (activeTab) {
      case 'dashboard':
        return isAdminMode 
          ? <AdminDashboard onNavigate={handleNavigate} /> 
          : <Home onNavigate={handleNavigate} />;
      case 'report':
        return reportStep === 'capture' 
          ? <CaptureIssue onAnalyze={() => setReportStep('analyze')} />
          : <ReportIssue />;
      case 'map':
        return (
          <div className="flex-col items-center justify-center" style={{ height: '70vh', color: '#6B7280' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Map View</h2>
            <p>Interactive Map Component goes here.</p>
          </div>
        );
      case 'profile':
        return (
          <div className="flex-col items-center justify-center" style={{ height: '70vh' }}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=EEF2FF" style={{ width: 100, height: 100, borderRadius: '50%', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Civic Guardian</h2>
            
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)}
              style={{ backgroundColor: isAdminMode ? '#1F2937' : '#7C8FF0', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 'bold' }}
            >
              Switch to {isAdminMode ? 'Citizen' : 'Admin'} View Mode
            </button>
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6B7280' }}>(Demo Toggle)</p>
          </div>
        );
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ backgroundColor: '#111827', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Mobile Frame Simulation (for desktop viewing) */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '850px', 
        maxHeight: '100vh',
        backgroundColor: 'var(--bg-color)', 
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        borderRadius: '30px', /* give it rounded corners for mobile feel on desktop */
        position: 'relative'
      }}>
        <MobileLayout activeTab={activeTab} onTabChange={handleTabChange}>
          {renderContent()}
        </MobileLayout>
      </div>
    </div>
  );
}

export default App;
