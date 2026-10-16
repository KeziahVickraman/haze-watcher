/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AirQualityData, SingaporeRegion, AlertConfig, AlertLogItem, HourlyTrendPoint } from './types/airQuality';
import {
  fetchLiveAirQualityData,
  getSimulatedAirQualityData,
  generate24HourTrends,
  SimulationScenario,
} from './services/airQualityService';
import {
  loadAlertConfig,
  saveAlertConfig,
  loadAlertLogs,
  appendAlertLog,
  clearAlertLogs,
  playAlertChime,
  triggerSystemNotification,
  dispatchServerlessWebhook,
} from './services/notificationService';
import { Navbar } from './components/Navbar';
import { AirQualityHero } from './components/AirQualityHero';
import { SingaporeMap } from './components/SingaporeMap';
import { TrendChart } from './components/TrendChart';
import { PollutantBreakdown } from './components/PollutantBreakdown';
import { HazeAdvisoryGuide } from './components/HazeAdvisoryGuide';
import { RegionalHotspots } from './components/RegionalHotspots';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { AlertToast } from './components/AlertToast';
import { Footer } from './components/Footer';

export default function App() {
  const [airData, setAirData] = useState<AirQualityData | null>(null);
  const [trendPoints, setTrendPoints] = useState<HourlyTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scenario, setScenario] = useState<SimulationScenario>('LIVE');
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('national');
  const [activeMapLayer, setActiveMapLayer] = useState<'psi' | 'pm25' | 'wind' | 'hotspots'>('psi');

  const [alertConfig, setAlertConfig] = useState<AlertConfig>(loadAlertConfig());
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>(loadAlertLogs());
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [activeToastAlert, setActiveToastAlert] = useState<AlertLogItem | null>(null);
  const [activeSection, setActiveSection] = useState<string>('map-section');

  // Load air quality data
  const loadData = useCallback(async (currentScenario: SimulationScenario) => {
    setIsLoading(true);
    try {
      let data: AirQualityData;
      if (currentScenario === 'LIVE') {
        data = await fetchLiveAirQualityData();
      } else {
        data = getSimulatedAirQualityData(currentScenario);
      }
      setAirData(data);
      setTrendPoints(generate24HourTrends(data.nationalPsi));
    } catch (err) {
      console.error('Failed to load air quality data:', err);
      const fallback = getSimulatedAirQualityData('CLEAN');
      setAirData(fallback);
      setTrendPoints(generate24HourTrends(fallback.nationalPsi));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(scenario);
  }, [loadData, scenario]);

  // Check alert thresholds whenever airData or alertConfig changes
  useEffect(() => {
    if (!airData) return;

    const targetRegionKey = alertConfig.targetRegion === 'all' ? 'national' : alertConfig.targetRegion;
    const reading = airData.readings[targetRegionKey] || airData.readings.national;

    const psiBreached = reading.psi24h >= alertConfig.psiThreshold;
    const pm25Breached = reading.pm25OneHourly >= alertConfig.pm25Threshold;

    if (psiBreached || pm25Breached) {
      const thresholdType = psiBreached ? 'PSI' : 'PM2.5';
      const thresholdValue = psiBreached ? alertConfig.psiThreshold : alertConfig.pm25Threshold;
      const actualVal = psiBreached ? reading.psi24h : reading.pm25OneHourly;

      const channels: ('browser_push' | 'in_app' | 'audio')[] = ['in_app'];

      if (alertConfig.soundAlert) {
        playAlertChime(reading.band === 'unhealthy' || reading.band === 'very_unhealthy');
        channels.push('audio');
      }

      if (alertConfig.pushEnabled) {
        const sent = triggerSystemNotification(`⚠️ SG AirWatch: ${reading.name} Air Quality Alert`, {
          body: `${thresholdType} has reached ${actualVal} (${reading.band.toUpperCase()}). Reduce prolonged outdoor exertion.`,
        });
        if (sent) channels.push('browser_push');
      }

      const newLog: AlertLogItem = {
        id: `alert-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) + ' SGT',
        region: reading.name,
        psi: reading.psi24h,
        pm25: reading.pm25OneHourly,
        band: reading.band,
        thresholdType,
        thresholdValue,
        message: `${reading.name} sector ${thresholdType} reached ${actualVal}, exceeding threshold of ${thresholdValue}. Band: ${reading.band.toUpperCase()}.`,
        deliveredVia: channels,
      };

      setActiveToastAlert(newLog);
      const updated = appendAlertLog(newLog);
      setAlertLogs(updated);

      // Asynchronous dispatch to serverless webhook if user configured one
      if (alertConfig.webhookUrl) {
        dispatchServerlessWebhook(alertConfig.webhookUrl, {
          event: 'ALERT_TRIGGERED',
          timestamp: new Date().toISOString(),
          region: reading.name,
          psi: reading.psi24h,
          pm25: reading.pm25OneHourly,
          band: reading.band,
          advisory: 'Threshold breached. Transmitted via SG AirWatch client webhook.',
        });
      }
    }
  }, [airData, alertConfig]);

  // Handle configuration updates
  const handleSaveConfig = (newConfig: AlertConfig) => {
    setAlertConfig(newConfig);
    saveAlertConfig(newConfig);
  };

  const handleClearLogs = () => {
    clearAlertLogs();
    setAlertLogs([]);
  };

  const handleTriggerTestAlert = () => {
    if (!airData) return;
    const testReading = airData.readings.central;

    const testLog: AlertLogItem = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) + ' SGT',
      region: 'Central',
      psi: Math.max(testReading.psi24h, 115),
      pm25: Math.max(testReading.pm25OneHourly, 62),
      band: 'unhealthy',
      thresholdType: 'PSI',
      thresholdValue: alertConfig.psiThreshold,
      message: `Manual Test Trigger: Air quality threshold alert simulated for Central Sector (115 PSI). Health Advisory: Minimize prolonged outdoor exertion.`,
      deliveredVia: ['in_app', 'audio', ...(alertConfig.pushEnabled ? ['browser_push' as const] : [])],
    };

    setActiveToastAlert(testLog);
    const updated = appendAlertLog(testLog);
    setAlertLogs(updated);
  };

  const handleInspectRegion = (reg: SingaporeRegion) => {
    setSelectedRegion(reg);
    const el = document.getElementById('map-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!airData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Initializing SG AirWatch Telemetry...
      </div>
    );
  }

  const inspectingReading =
    selectedRegion === 'national' ? airData.readings.central : airData.readings[selectedRegion];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenAlertSettings={() => setIsAlertModalOpen(true)}
        unreadAlertCount={alertLogs.length}
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Telemetry & Sector Matrix */}
        <section>
          <AirQualityHero
            data={airData}
            isLoading={isLoading}
            onRefresh={() => loadData(scenario)}
            activeScenario={scenario}
            onSelectScenario={(scen) => setScenario(scen)}
            selectedRegion={selectedRegion}
            onSelectRegion={handleInspectRegion}
            onTriggerAlertTest={handleTriggerTestAlert}
          />
        </section>

        {/* Section 1: Interactive Map */}
        <section id="map-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Interactive Regional Air Map</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time spatial visualization of Singapore monitoring stations, wind dispersion, and regional hotspots.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Selected Sector:{' '}
              <span className="text-cyan-400 font-bold uppercase">{selectedRegion}</span>
            </div>
          </div>

          <SingaporeMap
            data={airData}
            selectedRegion={selectedRegion === 'national' ? 'central' : selectedRegion}
            onSelectRegion={(reg) => setSelectedRegion(reg)}
            activeLayer={activeMapLayer}
            onChangeLayer={(layer) => setActiveMapLayer(layer)}
          />
        </section>

        {/* Section 2: 24-Hour Trends */}
        <section id="trends-section">
          <TrendChart
            trendPoints={trendPoints}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => setSelectedRegion(reg)}
            psiThreshold={alertConfig.psiThreshold}
          />
        </section>

        {/* Section 3: Pollutant Matrix */}
        <section id="pollutants-section">
          <PollutantBreakdown
            reading={inspectingReading}
            selectedRegion={selectedRegion}
          />
        </section>

        {/* Section 4: Haze Health Advisories */}
        <section id="advisory-section">
          <HazeAdvisoryGuide />
        </section>

        {/* Section 5: Regional Hotspot Radar */}
        <section id="hotspots-section">
          <RegionalHotspots
            hotspots={airData.hotspots}
            wind={airData.wind}
          />
        </section>
      </main>

      <Footer />

      {/* Alert Settings Modal */}
      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        config={alertConfig}
        onSaveConfig={handleSaveConfig}
        logs={alertLogs}
        onClearLogs={handleClearLogs}
        onTriggerTestAlert={handleTriggerTestAlert}
      />

      {/* In-App Toast Alert */}
      <AlertToast
        alert={activeToastAlert}
        onDismiss={() => setActiveToastAlert(null)}
        onViewAdvisory={() => {
          const el = document.getElementById('advisory-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}
