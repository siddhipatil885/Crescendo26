import React from 'react';
import { Menu, LayoutDashboard, Map as MapIcon, PlusCircle, User } from 'lucide-react';

export default function MobileLayout({ children, activeTab, onTabChange }) {
  return (
    <div className="mobile-container">
      {/* Top Header */}
      <header className="top-bar">
        <button className="menu-btn">
          <Menu size={24} color="#7C8FF0" />
        </button>
        <div className="top-bar-logo">
          CIVIX
        </div>
        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=EEF2FF" 
          alt="User Profile" 
          className="user-avatar"
        />
      </header>

      {/* Main Scrollable Content */}
      <main className="content-area">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => onTabChange('map')}
        >
          <MapIcon size={20} />
          <span>Map</span>
        </button>
        
        <button 
          className="nav-item-report"
          onClick={() => onTabChange('report')}
        >
          <PlusCircle size={20} fill="#7C8FF0" color="white" />
          <span>Report</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onTabChange('profile')}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
