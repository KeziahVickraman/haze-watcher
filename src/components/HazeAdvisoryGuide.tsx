import React, { useState } from 'react';
import { PSI_BANDS } from '../utils/constants';
import { AirQualityBand } from '../types/airQuality';
import { Shield, HeartHandshake, School, HardHat, Sparkles, HelpCircle } from 'lucide-react';

export const HazeAdvisoryGuide: React.FC = () => {
  const [selectedBand, setSelectedBand] = useState<AirQualityBand>('unhealthy');

  const bands: AirQualityBand[] = ['good', 'moderate', 'unhealthy', 'very_unhealthy', 'hazardous'];
  const activeBand = PSI_BANDS[selectedBand];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Singapore MOH / NEA Health Advisory Standards</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official government guidance for schools, workplaces, sports, and vulnerable demographics.
          </p>
        </div>

        {/* Band Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
          {bands.map((bKey) => {
            const b = PSI_BANDS[bKey];
            const isSelected = selectedBand === bKey;

            return (
              <button
                key={bKey}
                onClick={() => setSelectedBand(bKey)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? `${b.bgColorClass} ${b.colorClass} border ${b.borderColorClass} shadow-sm`
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {b.label} ({b.rangeText.split(' ')[0]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Band Detailed Breakdown */}
      <div className="mt-6 p-5 rounded-xl border bg-slate-950/70 border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Air Quality Band</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className={`text-xl font-bold ${activeBand.colorClass}`}>
                {activeBand.label} Quality
              </h4>
              <span className="text-xs font-mono text-slate-400">({activeBand.rangeText})</span>
            </div>
          </div>

          {activeBand.n95Recommended && (
            <div className="px-3 py-1.5 bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs font-medium rounded-lg flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>N95 Mask Recommended For Extended Outdoor Activity</span>
            </div>
          )}
        </div>

        {/* 4 Demographics Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Shield className="w-4 h-4 text-cyan-400" />
              Healthy Persons
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {activeBand.healthyPersons}
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <HeartHandshake className="w-4 h-4 text-rose-400" />
              Vulnerable Demographics
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {activeBand.vulnerablePersons}
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <School className="w-4 h-4 text-emerald-400" />
              Schools & Sports (MOE)
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {activeBand.outdoorActivities}
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <HardHat className="w-4 h-4 text-amber-400" />
              Outdoor Work (MOM)
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {selectedBand === 'unhealthy' || selectedBand === 'very_unhealthy' || selectedBand === 'hazardous'
                ? 'Mandatory rest breaks, supply N95 respirators, continuous air monitoring, and rotate manual outdoor shifts.'
                : 'Normal construction and outdoor ground operations proceed with standard heat stress hydration.'}
            </p>
          </div>
        </div>
      </div>

      {/* Practical Equipment Guidelines */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            N95 Respirators vs. Surgical Masks
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Surgical masks and cloth face coverings do not provide protection against microscopic PM2.5 haze particles because they lack airtight face seals and sub-micron filtration. Only NIOSH-certified N95 respirators or equivalents (KF94, FFP2) with tight nose clips effectively filter airborne peat smoke particles.
          </p>
        </div>

        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Indoor Air Filtration & HEPA Cleaners
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Close all outward facing windows and doors when the 24-hr PSI exceeds 100. Run air purifiers equipped with True HEPA filters with a CADR (Clean Air Delivery Rate) scaled to your room volume. Set air-conditioners to internal recirculation mode to prevent drawing outdoor smoke.
          </p>
        </div>
      </div>
    </div>
  );
};
