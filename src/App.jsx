import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MobileLayout from './components/MobileLayout';
import Home from './pages/citizen/Home';
import CaptureIssue from './pages/citizen/CaptureIssue';
import ReportIssue from './pages/citizen/ReportIssue';
import ReportConfirmation from './pages/citizen/ReportConfirmation';
import IssueDetails from './pages/citizen/IssueDetails';
import Map from './pages/citizen/Map';
import useIssueNotifications from './hooks/useIssueNotifications';
import { trackIssue } from './utils/notifications';

function App() {
  useIssueNotifications();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [subView, setSubView] = useState(null);
  const [reportStep, setReportStep] = useState('capture');
  const [draftImage, setDraftImage] = useState(null);
  const [submittedIssue, setSubmittedIssue] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  const openTab = (tabId) => {
    setActiveTab(tabId);
    setSubView(null);

    if (tabId === 'report') {
      setReportStep('capture');
      setSubmittedIssue(null);
    }
  };

  useEffect(() => {
    const requestedTab = location.state?.activeTab;

    if (requestedTab) {
      openTab(requestedTab);
    }
  }, [location.state?.activeTab]);

  const handleTabChange = (tabId) => {
    openTab(tabId);
  };

  const handleNavigate = (viewId, issueId) => {
    if (viewId === 'map') {
      setActiveTab('map');
      setSubView(null);
      return;
    }

    setSubView(viewId);
    if (issueId) setSelectedIssueId(issueId);
  };

  const renderContent = () => {
    // If viewing a detail page
    if (subView === 'details') {
      return <IssueDetails issueId={selectedIssueId} isAdmin={false} />;
    }

    // Main Tab Routing
    switch (activeTab) {
      case 'dashboard':
        return <Home onNavigate={handleNavigate} />;
      case 'report':
        return reportStep === 'capture' 
          ? <CaptureIssue onCapture={(imgUrl) => { setDraftImage(imgUrl); setReportStep('details'); }} />
          : reportStep === 'details'
            ? (
              <ReportIssue
                draftImage={draftImage}
                onSubmit={(issue) => {
                  setSubmittedIssue(issue);
                  setSelectedIssueId(issue.id);
                  setReportStep('confirmation');
                }}
              />
            )
            : (
              <ReportConfirmation
                issue={submittedIssue}
                onTrackIssue={(issueId) => {
                  trackIssue(issueId);
                  setSelectedIssueId(issueId);
                  setSubView('details');
                  setActiveTab('dashboard');
                }}
              />
            );
      case 'map':
        return <Map />;
      case 'profile':
        return (
          <div className="flex-col items-center justify-center" style={{ height: '70vh' }}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=EEF2FF" style={{ width: 100, height: 100, borderRadius: '50%', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Community Profile</h2>
            
          </div>
        );
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-shell">
      <div className="mobile-frame">
        <MobileLayout activeTab={activeTab} onTabChange={handleTabChange}>
          {renderContent()}
        </MobileLayout>
      </div>
    </div>
  );
}

export default App;
