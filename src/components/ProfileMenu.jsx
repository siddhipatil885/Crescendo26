import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProfileMenu() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [
    { key: 'profile', icon: User },
    { key: 'profile_settings', icon: Settings },
    { key: 'logout', icon: LogOut },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-label={t('profile_menu')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          CV
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg" role="menu">
          {items.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Icon size={16} />
              <span>{t(key)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
