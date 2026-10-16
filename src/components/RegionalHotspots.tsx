import React from 'react';
import { AirQualityData } from '../types/airQuality';
import { Flame, Compass, ShieldAlert, Satellite, ExternalLink } from 'lucide-react';

interface RegionalHotspotsProps {
  hotspots: AirQualityData['hotspots'];
  wind: AirQualityData['wind'];
}

export const RegionalHotspots: React.FC<RegionalHotspotsProps> = ({ hotspots, wind }) => {
  const totalHotspots = hotspots.sumatra + hotspots.kalimantan;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Severe': return 'text-purple-400 bg-purple-950/40 border-purple-500/30';
      case 'High': return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
      case 'Moderate': return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'Low':
      default:
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">ASMC Regional Haze & Satellite Hotspot Radar</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ASEAN Specialised Meteorological Centre (ASMC) & Meteorological Service Singapore (MSS) satellite monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Regional Threat Index:</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getRiskColor(hotspots.regionalRisk)}`}>
            {hotspots.regionalRisk}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Sumatra Fire Hotspots */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Sumatra Fire Hotspots</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {hotspots.sumatra}
            </span>
            <span className="text-xs text-slate-400 font-mono">detected hotspots</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Riau, Jambi, and South Sumatra peat provinces. High vulnerability to dry spells.
          </div>
        </div>

        {/* Kalimantan Fire Hotspots */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Kalimantan Fire Hotspots</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {hotspots.kalimantan}
            </span>
            <span className="text-xs text-slate-400 font-mono">detected hotspots</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Central & West Kalimantan forest sectors. Fire Radiative Power (FRP) monitored.
          </div>
        </div>

        {/* Prevailing Monsoon Winds */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Prevailing Haze Trajectory</span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-cyan-400">
              {wind.directionLabel} ({wind.directionDeg}°)
            </span>
            <span className="text-xs text-slate-400 font-mono">{wind.speedKmh} km/h</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {wind.description}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {hotspots.satelliteDate} · Combined regional fire count:{' '}
            <strong className="text-white font-mono">{totalHotspots} hotspots</strong>
          </span>
        </div>

        <a
          href="https://asmc.asean.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
        >
          <span>ASMC Official Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
