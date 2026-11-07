import React from 'react';
import {
  Activity,
  Camera,
  Calendar,
  Clock,
  History,
  Settings,
  Globe,
} from 'lucide-react';
import { Language, translations } from '../translations.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  pendingCount = 0,
}) => {
  const t = translations[lang];

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: Calendar, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'scanner', label: t.scanner, icon: Camera },
    { id: 'cabinet', label: t.cabinet, icon: Activity },
    { id: 'add-reminder', label: t.reminders, icon: Clock },
    { id: 'history', label: t.history, icon: History },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 flex-nowrap">
          {/* Brand Logo - Clean, Professional & Guaranteed Single-Line */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none group shrink-0 whitespace-nowrap"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
            </div>
            <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight whitespace-nowrap">
              Mediscan
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-teal-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Control: Clean Language Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-teal-50/60 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Toggle English / ಕನ್ನಡ"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md fixed bottom-0 left-0 right-0 z-40 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-6 gap-1 text-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] transition-colors relative cursor-pointer ${
                  isActive ? 'text-teal-700 font-extrabold bg-teal-50/90' : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-teal-600 stroke-[2.4]' : 'text-slate-400'}`} />
                <span className="truncate max-w-[46px]">{item.label}</span>
                {item.badge !== null && (
                  <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 text-[9px] font-black rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
