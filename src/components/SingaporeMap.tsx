import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AirQualityData, SingaporeRegion } from '../types/airQuality';
import { PSI_BANDS, SECONDARY_STATIONS } from '../utils/constants';
import { Eye, Wind, Layers, Maximize2, Compass, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SingaporeMapProps {
  data: AirQualityData;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
  activeLayer: 'psi' | 'pm25' | 'wind' | 'hotspots';
  onChangeLayer: (layer: 'psi' | 'pm25' | 'wind' | 'hotspots') => void;
}

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
  activeLayer,
  onChangeLayer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const windOverlayRef = useRef<L.LayerGroup | null>(null);

  const [inspectedLocation, setInspectedLocation] = useState<{
    name: string;
    region: SingaporeRegion;
    psi: number;
    pm25: number;
    lat: number;
    lng: number;
    bandText: string;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 11,
      minZoom: 10,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark sleek CartoDB basemap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Bounding box constraint around Singapore and immediate straits
    const southWest = L.latLng(1.15, 103.55);
    const northEast = L.latLng(1.52, 104.15);
    const bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds.pad(0.3));

    markersLayerRef.current = L.layerGroup().addTo(map);
    hotspotsLayerRef.current = L.layerGroup().addTo(map);
    windOverlayRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Layers when data or activeLayer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !hotspotsLayerRef.current || !windOverlayRef.current) return;

    markersLayerRef.current.clearLayers();
    hotspotsLayerRef.current.clearLayers();
    windOverlayRef.current.clearLayers();

    // 1. Regional Centroid Pins
    const regions: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];

    regions.forEach((regKey) => {
      const reg = data.readings[regKey];
      if (!reg) return;

      const bandInfo = PSI_BANDS[reg.band];
      const isSelected = selectedRegion === regKey;
      const displayVal = activeLayer === 'pm25' ? `${reg.pm25OneHourly} µg` : `${reg.psi24h}`;
      const metricLabel = activeLayer === 'pm25' ? '1h PM2.5' : '24h PSI';

      const customIcon = L.divIcon({
        className: 'custom-station-pin',
        html: `
          <div style="
            background: #090e17;
            border: 2px solid ${bandInfo.hexColor};
            box-shadow: 0 0 16px ${bandInfo.hexColor}40, 0 4px 12px rgba(0,0,0,0.7);
            border-radius: 10px;
            padding: 6px 10px;
            min-width: 82px;
            text-align: center;
            cursor: pointer;
            transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">
              ${reg.name}
            </div>
            <div style="font-family: var(--font-mono); font-size: 16px; font-weight: 800; color: ${bandInfo.hexColor}; line-height: 1.2;">
              ${displayVal}
            </div>
            <div style="font-size: 9px; color: #cbd5e1; font-weight: 500;">
              ${metricLabel} · ${bandInfo.label}
            </div>
          </div>
        `,
        iconSize: [86, 52],
        iconAnchor: [43, 26],
      });

      const marker = L.marker([reg.lat, reg.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectRegion(regKey);
        setInspectedLocation({
          name: reg.name,
          region: regKey,
          psi: reg.psi24h,
          pm25: reg.pm25OneHourly,
          lat: reg.lat,
          lng: reg.lng,
          bandText: bandInfo.label,
        });
      });

      marker.addTo(markersLayerRef.current!);
    });

    // 2. Secondary Monitoring Stations
    SECONDARY_STATIONS.forEach((station) => {
      const parentReg = data.readings[station.region as SingaporeRegion] || data.readings.central;
      const bandInfo = PSI_BANDS[parentReg.band];

      // Small secondary dot with radar pulse
      const secIcon = L.divIcon({
        className: 'secondary-station-pin',
        html: `
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: ${bandInfo.hexColor};
            border: 2px solid #030712;
            box-shadow: 0 0 6px ${bandInfo.hexColor};
            cursor: pointer;
          " title="${station.name}"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([station.lat, station.lng], { icon: secIcon });
      marker.bindTooltip(`<b>${station.name}</b><br/><span style="color:#94a3b8">${station.subArea}</span><br/>PSI: ${parentReg.psi24h} · ${bandInfo.label}`, {
        className: 'bg-slate-900 text-slate-100 border border-slate-700 text-xs p-2 rounded shadow-lg',
      });

      marker.on('click', () => {
        onSelectRegion(station.region as SingaporeRegion);
        setInspectedLocation({
          name: station.name,
          region: station.region as SingaporeRegion,
          psi: parentReg.psi24h,
          pm25: parentReg.pm25OneHourly,
          lat: station.lat,
          lng: station.lng,
          bandText: `${station.subArea} (${bandInfo.label})`,
        });
      });

      marker.addTo(markersLayerRef.current!);
    });

    // 3. Hotspots Layer (Sumatra/Riau fires simulation overlay)
    if (activeLayer === 'hotspots') {
      const hotspotCoords = [
        [1.18, 103.45],
        [1.12, 103.52],
        [1.25, 103.48],
        [1.08, 103.62],
        [1.05, 103.75],
        [1.48, 103.50],
      ];

      hotspotCoords.forEach(([lat, lng], idx) => {
        const fireIcon = L.divIcon({
          html: `
            <div style="
              width: 22px;
              height: 22px;
              background: radial-gradient(circle, #f97316 30%, #ef4444 80%);
              border-radius: 50%;
              border: 1px solid #ffedd5;
              box-shadow: 0 0 12px #ea580c;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
            ">🔥</div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const fireMarker = L.marker([lat, lng], { icon: fireIcon });
        fireMarker.bindTooltip(`<b>ASMC Hotspot Cluster #${idx + 1}</b><br/>FRP: 48 MW (Riau Peat Sector)<br/>Smoke Plume: Trajectory NE`, {
          className: 'bg-slate-900 text-slate-100 border border-amber-600/60 text-xs p-2 rounded shadow-lg',
        });
        fireMarker.addTo(hotspotsLayerRef.current!);
      });
    }

    // 4. Wind Layer (Prevailing Monsoon Flow Vectors)
    if (activeLayer === 'wind') {
      const windVectors = [
        { lat: 1.22, lng: 103.68 },
        { lat: 1.25, lng: 103.85 },
        { lat: 1.28, lng: 104.02 },
        { lat: 1.38, lng: 103.68 },
        { lat: 1.40, lng: 103.88 },
        { lat: 1.35, lng: 104.05 },
      ];

      windVectors.forEach((pos) => {
        const deg = data.wind.directionDeg;
        const arrowIcon = L.divIcon({
          html: `
            <div style="
              transform: rotate(${deg}deg);
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #38bdf8;
              opacity: 0.85;
            ">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const arrowMarker = L.marker([pos.lat, pos.lng], { icon: arrowIcon });
        arrowMarker.bindTooltip(`Wind: ${data.wind.directionLabel} ${data.wind.speedKmh} km/h`, {
          className: 'bg-slate-900 text-slate-100 border border-sky-600 text-xs p-1.5 rounded',
        });
        arrowMarker.addTo(windOverlayRef.current!);
      });
    }
  }, [data, selectedRegion, activeLayer, onSelectRegion]);

  // Center map on region selection
  const handleJumpToRegion = (regKey: SingaporeRegion) => {
    onSelectRegion(regKey);
    const coords = data.readings[regKey];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 12, { duration: 0.8 });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([1.3521, 103.8198], 11, { duration: 0.8 });
    }
  };

  const activeRegionData = data.readings[selectedRegion] || data.readings.central;
  const activeBand = PSI_BANDS[activeRegionData.band];

  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Map Layer Switcher Ribbon */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 shadow-xl">
        <button
          onClick={() => onChangeLayer('psi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeLayer === 'psi'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          24-hr PSI
        </button>

        <button
          onClick={() => onChangeLayer('pm25')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeLayer === 'pm25'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          1-hr PM2.5
        </button>

        <button
          onClick={() => onChangeLayer('wind')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeLayer === 'wind'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          Wind Trajectory
        </button>

        <button
          onClick={() => onChangeLayer('hotspots')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeLayer === 'hotspots'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Regional Hotspots
        </button>
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleResetView}
          title="Reset Singapore View"
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 backdrop-blur-md shadow-md transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Region Jump Ribbon (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 shadow-xl">
        <span className="text-[11px] font-mono text-slate-400 px-2 uppercase tracking-wider">Sector</span>
        {(['national', 'central', 'north', 'south', 'east', 'west'] as SingaporeRegion[]).map((rKey) => (
          <button
            key={rKey}
            onClick={() => handleJumpToRegion(rKey)}
            className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-all whitespace-nowrap shrink-0 ${
              selectedRegion === rKey
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {rKey}
          </button>
        ))}
      </div>

      {/* Floating Selected Region Detail Card (Overlay Top Right / Center-Right) */}
      <div className="absolute top-16 right-4 z-10 w-72 md:w-80 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Inspecting Station</div>
            <h3 className="text-base font-bold text-white mt-0.5">{activeRegionData.name}</h3>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${activeBand.bgColorClass} ${activeBand.colorClass} ${activeBand.borderColorClass}`}>
              {activeBand.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/50">
            <div className="text-[10px] font-mono text-slate-400 uppercase">24-hr PSI</div>
            <div className="text-xl font-mono font-bold text-white mt-0.5 tabular-nums">
              {activeRegionData.psi24h}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">NEA Index Limit: 100</div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/50">
            <div className="text-[10px] font-mono text-slate-400 uppercase">1-hr PM2.5</div>
            <div className="text-xl font-mono font-bold text-cyan-400 mt-0.5 tabular-nums">
              {activeRegionData.pm25OneHourly} <span className="text-xs font-normal text-slate-400">µg/m³</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Normal: &le;55 µg</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
          <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Advisory Guide
          </div>
          {activeBand.healthyPersons}
        </div>

        {activeBand.n95Recommended && (
          <div className="mt-2 text-xs font-medium text-amber-300 bg-amber-950/30 border border-amber-800/40 p-2 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>N95 respirator advised for prolonged outdoor exposure</span>
          </div>
        )}
      </div>

      {/* Map Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-14 z-10 hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 text-[11px] text-slate-300">
        <span className="font-mono text-slate-400 uppercase">Bands:</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> 0-50 Good
        </span>
        <span className="flex items-center gap-1 text-sky-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span> 51-100 Mod
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> 101-200 Unhealthy
        </span>
        <span className="flex items-center gap-1 text-rose-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span> 201-300 V.Unhealthy
        </span>
      </div>
    </div>
  );
};
