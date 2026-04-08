import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, LayoutDashboard, Map as MapIcon, PlusCircle, Ticket, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ProfileMenu from './ProfileMenu';

export default function MobileLayout({
  children,
  activeTab,
  onTabChange,
  title,
  headerRight,
  showMenuButton = true,
  showBottomNav = true,
  showLanguageSwitcher = true,
  showProfileMenu = true,
}) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuDrawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const headerRef = useRef(null);
  const mainRef = useRef(null);
  const footerRef = useRef(null);
  const prevIsMenuOpenRef = useRef(false);

  useEffect(() => {
    if (prevIsMenuOpenRef.current && !isMenuOpen) {
      menuButtonRef.current?.focus();
    }

    prevIsMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    closeButtonRef.current?.focus();

    const drawerElement = menuDrawerRef.current;
    const backgroundElements = [headerRef.current, mainRef.current, footerRef.current].filter(Boolean);

    backgroundElements.forEach((element) => {
      element.setAttribute('inert', '');
      element.setAttribute('aria-hidden', 'true');
    });

    const getFocusableElements = () => Array.from(
      drawerElement?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []
    );

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    drawerElement?.addEventListener('keydown', handleKeyDown);

    return () => {
      drawerElement?.removeEventListener('keydown', handleKeyDown);
      backgroundElements.forEach((element) => {
        element.removeAttribute('inert');
        element.removeAttribute('aria-hidden');
      });
    };
  }, [isMenuOpen]);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'map', label: t('map'), icon: MapIcon },
    { id: 'report', label: t('report'), icon: PlusCircle },
    { id: 'track', label: t('track_issue'), icon: Ticket, to: '/track' },
    { id: 'profile', label: t('profile'), icon: User },
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
            aria-label={t('close_menu')}
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            id="mobile-menu"
            ref={menuDrawerRef}
            className="mobile-menu-drawer"
            role="dialog"
            aria-modal="true"
            aria-hidden={!isMenuOpen}
            aria-label={t('navigation_menu')}
          >
            <div className="mobile-menu-header">
              <div className="mobile-menu-title">{t('menu')}</div>
              <button
                ref={closeButtonRef}
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMenuOpen(false)}
                aria-label={t('close_menu')}
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mobile-menu-nav" aria-label={t('navigation_menu')}>
              {menuItems.map(({ id, label, icon: Icon, to }) => (
                to ? (
                  <NavLink
                    key={id}
                    to={to}
                    className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                    style={{ textDecoration: 'none' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ) : (
                  <button
                    key={id}
                    type="button"
                    className={`mobile-menu-item ${activeTab === id ? 'active' : ''}`}
                    onClick={() => handleMenuNavigation(id)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                )
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Top Header */}
      <header ref={headerRef} className="top-bar">
        {showMenuButton ? (
          <button
            ref={menuButtonRef}
            className="menu-btn"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-haspopup="dialog"
            aria-label={isMenuOpen ? t('close_menu') : t('open_menu')}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={24} color="#7C8FF0" />
          </button>
        ) : (
          <div className="top-bar-slot" aria-hidden="true" />
        )}

        <div className="top-bar-logo">
          {title || t('app_name')}
        </div>

        <div className="top-bar-actions">
          {headerRight}
          {showLanguageSwitcher && <LanguageSwitcher />}
          {showProfileMenu && <ProfileMenu />}
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main ref={mainRef} className={`content-area ${activeTab === 'map' ? 'content-area-map' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav ref={footerRef} className="bottom-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>{t('dashboard')}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => onTabChange('map')}
          >
            <MapIcon size={20} />
            <span>{t('map')}</span>
          </button>

          <button
            className={`nav-item-report ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => onTabChange('report')}
          >
            <PlusCircle size={20} fill="#7C8FF0" color="white" />
            <span>{t('report')}</span>
          </button>

          <NavLink
            to="/track"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <Ticket size={20} />
            <span>{t('track_issue')}</span>
          </NavLink>

          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => onTabChange('profile')}
          >
            <User size={20} />
            <span>{t('profile')}</span>
          </button>
        </nav>
      )}
    </div>
  );
}
