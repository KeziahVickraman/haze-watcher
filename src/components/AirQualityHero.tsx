import React from 'react';
import { AirQualityData, SingaporeRegion } from '../types/airQuality';
import { PSI_BANDS, getPm25Status } from '../utils/constants';
import { SimulationScenario } from '../services/airQualityService';
import { Wind, RefreshCw, AlertCircle, Sparkles, Activity } from 'lucide-react';

interface AirQualityHeroProps {
  data: AirQualityData;
  isLoading: boolean;
  onRefresh: () => void;
  activeScenario: SimulationScenario;
  onSelectScenario: (scen: SimulationScenario) => void;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (reg: SingaporeRegion) => void;
  onTriggerAlertTest: () => void;
}

export const AirQualityHero: React.FC<AirQualityHeroProps> = ({
  data,
  isLoading,
  onRefresh,
  activeScenario,
  onSelectScenario,
  selectedRegion,
  onSelectRegion,
  onTriggerAlertTest,
}) => {
  const nationalBand = PSI_BANDS[data.nationalBand];
  const pm25Status = getPm25Status(data.nationalPm25);

  const regions: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
      {/* Top Metadata Strip: Clean unboxed text with typographic separators */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="text-slate-200 font-semibold">National Environment Agency (NEA) Data</span>
          <span aria-hidden="true">·</span>
          <span>Updated {data.updateTime}</span>
          <span aria-hidden="true">·</span>
          <span className="text-cyan-400">{data.source}</span>
        </div>

        {/* Scenario Controls for Testing Alerts */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 px-2">Simulation Test:</span>
          <button
            onClick={() => onSelectScenario('LIVE')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              activeScenario === 'LIVE' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live NEA
          </button>
          <button
            onClick={() => onSelectScenario('CLEAN')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              activeScenario === 'CLEAN' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clean (36)
          </button>
          <button
            onClick={() => onSelectScenario('MODERATE')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              activeScenario === 'MODERATE' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Moderate (68)
          </button>
          <button
            onClick={() => onSelectScenario('HAZE_ALERT')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              activeScenario === 'HAZE_ALERT' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Haze Alert (138)
          </button>
          <button
            onClick={() => onSelectScenario('CRISIS')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              activeScenario === 'CRISIS' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crisis (235)
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Live Data"
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Metric Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Focus: National 24-hr PSI & Band */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Singapore 24-Hour Pollutant Standards Index
            </div>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-6xl lg:text-7xl font-mono font-extrabold tracking-tight text-white tabular-nums">
                {data.nationalPsi}
              </span>
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${nationalBand.colorClass}`}>
                  {nationalBand.label}
                </span>
                <span className="text-xs font-mono text-slate-400">{nationalBand.rangeText}</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-md">
              {nationalBand.healthyPersons}
            </p>
          </div>

          {/* Quick Warning Banner if threshold crossed */}
          {data.nationalPsi >= 100 && (
            <div className="mt-4 p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <span className="font-semibold text-white">Threshold Alert Active: </span>
                Air quality has breached healthy limits (PSI &ge; 100). Sensitive groups should reduce prolonged outdoor physical exertion.
              </div>
            </div>
          )}

          {/* Wind Telemetry Pill */}
          <div className="mt-6 flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="p-2 bg-sky-950/60 text-sky-400 rounded-lg border border-sky-800/40">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono text-slate-400 text-[11px] uppercase">Prevailing Surface Wind</div>
              <div className="font-semibold text-slate-200 mt-0.5">
                {data.wind.directionLabel} · {data.wind.speedKmh} km/h ({Math.round(data.wind.speedKmh * 0.539957)} knots)
              </div>
              <div className="text-[11px] text-slate-400">{data.wind.description}</div>
            </div>
          </div>
        </div>

        {/* Right Focus: 1-hr PM2.5 and 5 Regional Sectors */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Sector Breakdown (Click to Inspect on Map)
              </div>
              <div className="text-xs font-mono text-slate-400">
                National 1-hr PM2.5:{' '}
                <span className={`font-bold ${pm25Status.color} tabular-nums`}>
                  {data.nationalPm25} µg/m³ ({pm25Status.label})
                </span>
              </div>
            </div>

            {/* 5 Sector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {regions.map((regKey) => {
                const reg = data.readings[regKey];
                if (!reg) return null;
                const bandInfo = PSI_BANDS[reg.band];
                const isSelected = selectedRegion === regKey;

                return (
                  <button
                    key={regKey}
                    onClick={() => onSelectRegion(regKey)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      {reg.name}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-extrabold text-white tabular-nums">
                        {reg.psi24h}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">PSI</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${bandInfo.colorClass}`}>
                        {bandInfo.label}
                      </span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {reg.pm25OneHourly}µg
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Strip */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>NEA 1-hr PM2.5 guide: &le;55 Normal · 56–150 Elevated · 151–250 High · &gt;250 Very High</span>
            </div>

            <button
              onClick={onTriggerAlertTest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Push Alert</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
