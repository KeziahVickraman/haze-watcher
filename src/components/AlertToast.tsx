import React from 'react';
import { AlertLogItem } from '../types/airQuality';
import { PSI_BANDS } from '../utils/constants';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface AlertToastProps {
  alert: AlertLogItem | null;
  onDismiss: () => void;
  onViewAdvisory: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({ alert, onDismiss, onViewAdvisory }) => {
  if (!alert) return null;

  const bandInfo = PSI_BANDS[alert.band];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-950/80 text-amber-400 rounded-xl border border-amber-600/50 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Air Quality Alert Triggered
              </span>
              <span className="text-[10px] font-mono text-slate-400">· {alert.timestamp}</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {alert.region} Sector: {alert.thresholdType} Breached ({alert.thresholdType === 'PSI' ? alert.psi : alert.pm25})
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-snug">
              {alert.message}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-slate-400">
          Advisory: Wear N95 respirator if stepping outdoors
        </span>
        <button
          onClick={() => {
            onViewAdvisory();
            onDismiss();
          }}
          className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Health Action Guide
        </button>
      </div>
    </div>
  );
};
