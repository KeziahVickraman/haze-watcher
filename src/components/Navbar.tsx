import React from 'react';
import { Bell } from 'lucide-react';

interface NavbarProps {
  onOpenAlertSettings: () => void;
  unreadAlertCount: number;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAlertSettings,
  unreadAlertCount,
  activeSection,
  onNavigate,
}) => {
  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    onNavigate(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
        >
          SG AirWatch
        </a>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#map-section"
            onClick={(e) => handleNavClick(e, 'map-section')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'map-section' ? 'text-cyan-400' : ''
            }`}
          >
            Live Map
          </a>
          <a
            href="#trends-section"
            onClick={(e) => handleNavClick(e, 'trends-section')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'trends-section' ? 'text-cyan-400' : ''
            }`}
          >
            24h Trends
          </a>
          <a
            href="#pollutants-section"
            onClick={(e) => handleNavClick(e, 'pollutants-section')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'pollutants-section' ? 'text-cyan-400' : ''
            }`}
          >
            Pollutants
          </a>
          <a
            href="#advisory-section"
            onClick={(e) => handleNavClick(e, 'advisory-section')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'advisory-section' ? 'text-cyan-400' : ''
            }`}
          >
            Advisories
          </a>
          <a
            href="#hotspots-section"
            onClick={(e) => handleNavClick(e, 'hotspots-section')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'hotspots-section' ? 'text-cyan-400' : ''
            }`}
          >
            Hotspots
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAlertSettings}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md shadow-cyan-500/10 whitespace-nowrap shrink-0"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Configure Alerts</span>
            {unreadAlertCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 rounded-full">
                {unreadAlertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
