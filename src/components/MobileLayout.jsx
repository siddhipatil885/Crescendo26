import React, { useEffect, useRef, useState } from 'react';
import { Menu, LayoutDashboard, Map as MapIcon, PlusCircle, User, X } from 'lucide-react';

export default function MobileLayout({
  children,
  activeTab,
  onTabChange,
  title = 'CIVIX',
  headerRight,
  showMenuButton = true,
  showBottomNav = true,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) {
      menuButtonRef.current?.focus();
      return undefined;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'report', label: 'Report', icon: PlusCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleMenuNavigation = (tab) => {
    onTabChange?.(tab);
    setIsMenuOpen(false);
  };

  return (
    <div className="mobile-container">
      {isMenuOpen && (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            id="mobile-menu"
            className="mobile-menu-drawer"
            role="dialog"
            aria-modal="true"
            aria-hidden={!isMenuOpen}
            aria-label="Navigation menu"
          >
            <div className="mobile-menu-header">
              <div className="mobile-menu-title">Menu</div>
              <button
                ref={closeButtonRef}
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mobile-menu-nav" aria-label="Mobile navigation">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`mobile-menu-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => handleMenuNavigation(id)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Top Header */}
      <header className="top-bar">
        {showMenuButton ? (
          <button
            ref={menuButtonRef}
            className="menu-btn"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-haspopup="dialog"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={24} color="#7C8FF0" />
          </button>
        ) : (
          <div className="top-bar-slot" aria-hidden="true" />
        )}

        <div className="top-bar-logo">
          {title}
        </div>

        {headerRight || (
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=EEF2FF"
            alt="User Profile"
            className="user-avatar"
          />
        )}
      </header>

      {/* Main Scrollable Content */}
      <main className={`content-area ${activeTab === 'map' ? 'content-area-map' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
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
            className={`nav-item-report ${activeTab === 'report' ? 'active' : ''}`}
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
      )}
    </div>
  );
}
