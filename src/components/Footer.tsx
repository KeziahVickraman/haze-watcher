import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-10 mt-16 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-bold text-white text-sm">SG AirWatch</div>
            <p className="text-slate-400 max-w-md">
              Singapore real-time Pollutant Standards Index (PSI) and particulate matter monitoring platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <a
              href="https://www.nea.gov.sg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
            >
              NEA Singapore <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://data.gov.sg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
            >
              data.gov.sg API <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://asmc.asean.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
            >
              ASMC Hotspot Radar <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.moh.gov.sg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
            >
              MOH Health Advisory <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Singapore Ambient Air Quality Monitoring Network Standards</span>
          </div>
          <div>All index calculations strictly aligned with NEA 24-hr PSI and 1-hr PM2.5 guidelines.</div>
        </div>
      </div>
    </footer>
  );
};
