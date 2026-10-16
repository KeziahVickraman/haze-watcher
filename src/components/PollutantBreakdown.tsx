import React from 'react';
import { RegionalReading, SingaporeRegion } from '../types/airQuality';
import { Atom, Info } from 'lucide-react';

interface PollutantBreakdownProps {
  reading: RegionalReading;
  selectedRegion: SingaporeRegion;
}

export const PollutantBreakdown: React.FC<PollutantBreakdownProps> = ({
  reading,
  selectedRegion,
}) => {
  const pollutants = [
    {
      code: 'PM2.5',
      fullName: 'Fine Particulate Matter (≤ 2.5 µm)',
      currentVal: `${reading.pm25OneHourly}`,
      unit: 'µg/m³',
      period: '1-Hour Avg',
      standard: 'Target: ≤ 55 µg/m³',
      healthImpact: 'Penetrates deep into alveolar lung tissue and bloodstream. Key driver of transboundary peat smoke haze.',
      isElevated: reading.pm25OneHourly > 55,
      isSevere: reading.pm25OneHourly > 150,
    },
    {
      code: 'PM10',
      fullName: 'Inhalable Particles (≤ 10 µm)',
      currentVal: `${reading.pm10TwentyFourHourly}`,
      unit: 'µg/m³',
      period: '24-Hour Avg',
      standard: 'Target: ≤ 50 µg/m³',
      healthImpact: 'Causes irritation of eyes, nose, throat and exacerbates respiratory conditions such as asthma.',
      isElevated: reading.pm10TwentyFourHourly > 50,
      isSevere: reading.pm10TwentyFourHourly > 150,
    },
    {
      code: 'O3',
      fullName: 'Ozone',
      currentVal: `${reading.o3EightHourly}`,
      unit: 'µg/m³',
      period: '8-Hour Avg',
      standard: 'Target: ≤ 100 µg/m³',
      healthImpact: 'Photochemical smog secondary pollutant formed by sunlight reacting with NOx and VOCs.',
      isElevated: reading.o3EightHourly > 100,
      isSevere: reading.o3EightHourly > 160,
    },
    {
      code: 'NO2',
      fullName: 'Nitrogen Dioxide',
      currentVal: `${reading.no2OneHourly}`,
      unit: 'µg/m³',
      period: '1-Hour Avg',
      standard: 'Target: ≤ 200 µg/m³',
      healthImpact: 'Combustion byproduct from heavy vehicle exhausts and industrial port facilities.',
      isElevated: reading.no2OneHourly > 200,
      isSevere: reading.no2OneHourly > 400,
    },
    {
      code: 'SO2',
      fullName: 'Sulphur Dioxide',
      currentVal: `${reading.so2TwentyFourHourly}`,
      unit: 'µg/m³',
      period: '24-Hour Avg',
      standard: 'Target: ≤ 20 µg/m³',
      healthImpact: 'Emission from marine fuel oil burning and petrochemical refining clusters on Jurong Island.',
      isElevated: reading.so2TwentyFourHourly > 20,
      isSevere: reading.so2TwentyFourHourly > 80,
    },
    {
      code: 'CO',
      fullName: 'Carbon Monoxide',
      currentVal: `${reading.coEightHourly}`,
      unit: 'mg/m³',
      period: '8-Hour Avg',
      standard: 'Target: ≤ 9.0 mg/m³',
      healthImpact: 'Colorless, odorless gas from incomplete combustion; reduces oxygen delivery in the bloodstream.',
      isElevated: reading.coEightHourly > 9.0,
      isSevere: reading.coEightHourly > 15.0,
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              NEA 6-Parameter Pollutant Matrix ({reading.name})
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official Singapore ambient air monitoring metrics used in computing the sub-indices for the 24-hr PSI.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Sector Lat/Lng: {reading.lat.toFixed(4)}°N, {reading.lng.toFixed(4)}°E
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {pollutants.map((pollutant) => (
          <div
            key={pollutant.code}
            className={`p-4 rounded-xl border transition-all ${
              pollutant.isSevere
                ? 'bg-rose-950/20 border-rose-600/40'
                : pollutant.isElevated
                ? 'bg-amber-950/20 border-amber-600/40'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-bold text-white font-mono">{pollutant.code}</span>
                <div className="text-xs text-slate-400 truncate max-w-[180px]">{pollutant.fullName}</div>
              </div>
              <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {pollutant.period}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-mono font-bold tabular-nums ${
                  pollutant.isSevere
                    ? 'text-rose-400'
                    : pollutant.isElevated
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              >
                {pollutant.currentVal}
              </span>
              <span className="text-xs font-mono text-slate-400">{pollutant.unit}</span>
            </div>

            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {pollutant.standard}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-snug">
              {pollutant.healthImpact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
