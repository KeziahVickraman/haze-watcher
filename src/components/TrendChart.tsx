import React, { useState } from 'react';
import { HourlyTrendPoint, SingaporeRegion } from '../types/airQuality';
import { TrendingUp, Info } from 'lucide-react';

interface TrendChartProps {
  trendPoints: HourlyTrendPoint[];
  selectedRegion: SingaporeRegion;
  onSelectRegion: (reg: SingaporeRegion) => void;
  psiThreshold: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  trendPoints,
  selectedRegion,
  onSelectRegion,
  psiThreshold,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getRegionValue = (point: HourlyTrendPoint, reg: SingaporeRegion): number => {
    switch (reg) {
      case 'central': return point.centralPsi;
      case 'north': return point.northPsi;
      case 'south': return point.southPsi;
      case 'east': return point.eastPsi;
      case 'west': return point.westPsi;
      case 'national':
      default:
        return point.nationalPsi;
    }
  };

  const values = trendPoints.map((p) => getRegionValue(p, selectedRegion));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 120); // allow space for threshold
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));

  // SVG Chart Geometry
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const yMin = 0;
  const yMax = Math.max(maxVal + 20, 160);

  const getX = (index: number) => paddingX + (index / (trendPoints.length - 1)) * chartW;
  const getY = (val: number) => height - paddingY - ((val - yMin) / (yMax - yMin)) * chartH;

  const thresholdY = getY(psiThreshold);
  const goodThresholdY = getY(50);
  const modThresholdY = getY(100);

  // Polyline points
  const pointsString = trendPoints
    .map((p, idx) => `${getX(idx)},${getY(getRegionValue(p, selectedRegion))}`)
    .join(' ');

  const activePoint = hoveredIndex !== null ? trendPoints[hoveredIndex] : trendPoints[trendPoints.length - 1];
  const activeValue = activePoint ? getRegionValue(activePoint, selectedRegion) : values[values.length - 1];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">24-Hour Regional PSI Trends</h3>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Hourly continuous monitoring with unhealthy threshold indicator (PSI {psiThreshold})
          </div>
        </div>

        {/* Region Selector Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {(['national', 'central', 'north', 'south', 'east', 'west'] as SingaporeRegion[]).map((reg) => (
            <button
              key={reg}
              onClick={() => onSelectRegion(reg)}
              className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-all whitespace-nowrap shrink-0 ${
                selectedRegion === reg
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Metric High/Low/Average Cards */}
      <div className="grid grid-cols-3 gap-4 my-6">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-mono uppercase text-slate-400">24-Hr Average</div>
          <div className="text-2xl font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
            {avgVal} <span className="text-xs text-slate-400">PSI</span>
          </div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-mono uppercase text-slate-400">24-Hr Minimum</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-0.5 tabular-nums">
            {minVal} <span className="text-xs text-slate-400">PSI</span>
          </div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-mono uppercase text-slate-400">24-Hr Peak</div>
          <div className={`text-2xl font-mono font-bold mt-0.5 tabular-nums ${maxVal >= 100 ? 'text-amber-400' : 'text-slate-200'}`}>
            {maxVal} <span className="text-xs text-slate-400">PSI</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Subtle Gridlines */}
          <line x1={paddingX} y1={getY(50)} x2={width - paddingX} y2={getY(50)} stroke="#1e293b" strokeDasharray="4 4" />
          <text x={paddingX - 8} y={getY(50) + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
            50
          </text>

          <line x1={paddingX} y1={getY(100)} x2={width - paddingX} y2={getY(100)} stroke="#f59e0b" strokeOpacity="0.3" strokeDasharray="3 3" />
          <text x={paddingX - 8} y={getY(100) + 4} fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="end">
            100
          </text>

          {/* User Threshold Alert Reference Line */}
          {psiThreshold !== 100 && (
            <>
              <line x1={paddingX} y1={thresholdY} x2={width - paddingX} y2={thresholdY} stroke="#f43f5e" strokeOpacity="0.6" strokeDasharray="2 2" />
              <text x={width - paddingX + 6} y={thresholdY + 3} fill="#f43f5e" fontSize="9" fontFamily="monospace">
                Alert: {psiThreshold}
              </text>
            </>
          )}

          {/* Area Gradient */}
          <defs>
            <linearGradient id="psiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <polygon
            points={`${paddingX},${height - paddingY} ${pointsString} ${width - paddingX},${height - paddingY}`}
            fill="url(#psiGradient)"
          />

          {/* Primary Trend Line */}
          <polyline
            points={pointsString}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Nodes & Tooltip Snapping */}
          {trendPoints.map((point, idx) => {
            const x = getX(idx);
            const val = getRegionValue(point, selectedRegion);
            const y = getY(val);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={idx}>
                {/* Invisible hit target for hover */}
                <rect
                  x={x - (chartW / trendPoints.length) / 2}
                  y={0}
                  width={chartW / trendPoints.length}
                  height={height}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />

                {/* Point circle */}
                {(isHovered || idx % 4 === 0) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3}
                    fill={val >= 100 ? '#f59e0b' : '#06b6d4'}
                    stroke="#020617"
                    strokeWidth="2"
                  />
                )}

                {/* X Axis Time Labels */}
                {idx % 4 === 0 && (
                  <text
                    x={x}
                    y={height - paddingY + 16}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {point.hour}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Inspection Readout */}
      {activePoint && (
        <div className="mt-4 flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">Timestamp: {activePoint.timeLabel} SGT</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="font-mono text-slate-200">
              Sector: <strong className="capitalize text-white">{selectedRegion}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-cyan-400 font-bold tabular-nums">
              PSI: {activeValue}
            </span>
            <span className="font-mono text-slate-300 tabular-nums">
              PM2.5: {activePoint.pm25} µg/m³
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
