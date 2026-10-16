import React, { useState } from 'react';
import { AlertConfig, AlertLogItem, SingaporeRegion } from '../types/airQuality';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerSystemNotification,
  playAlertChime,
  dispatchServerlessWebhook,
} from '../services/notificationService';
import {
  Bell,
  Sliders,
  Volume2,
  VolumeX,
  History,
  Terminal,
  Send,
  X,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Trash2,
} from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AlertConfig;
  onSaveConfig: (newConfig: AlertConfig) => void;
  logs: AlertLogItem[];
  onClearLogs: () => void;
  onTriggerTestAlert: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  logs,
  onClearLogs,
  onTriggerTestAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'browser_push' | 'logs' | 'serverless'>('rules');
  const [localConfig, setLocalConfig] = useState<AlertConfig>(config);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    getNotificationPermission()
  );
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionState(getNotificationPermission());
    if (granted) {
      setLocalConfig((prev) => ({ ...prev, pushEnabled: true }));
      triggerSystemNotification('SG AirWatch: Notifications Activated', {
        body: `You will be alerted when Singapore PSI exceeds ${localConfig.psiThreshold} or PM2.5 exceeds ${localConfig.pm25Threshold} µg/m³.`,
      });
      playAlertChime(false);
      setTestStatus('Browser notifications activated successfully!');
    } else {
      setTestStatus('Notification permission was not granted by your browser.');
    }
  };

  const handleSendTestPush = () => {
    playAlertChime(true);
    const sent = triggerSystemNotification('⚠️ SG AirWatch: Unhealthy Air Alert (Test)', {
      body: `Test Alert: Central sector 24-hr PSI has reached ${localConfig.psiThreshold + 12} (Unhealthy). Minimize prolonged outdoor exertion.`,
    });

    onTriggerTestAlert();

    if (sent) {
      setTestStatus('Test push notification delivered to your operating system!');
    } else {
      setTestStatus('Browser push permission not granted. In-app toast & sound alert played.');
    }
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleTestWebhook = async () => {
    if (!localConfig.webhookUrl) {
      setWebhookStatus('Please provide a serverless endpoint URL first.');
      return;
    }

    setWebhookStatus('Dispatching payload...');
    const result = await dispatchServerlessWebhook(localConfig.webhookUrl, {
      event: 'TEST_PING',
      timestamp: new Date().toISOString(),
      region: localConfig.targetRegion,
      psi: localConfig.psiThreshold,
      pm25: localConfig.pm25Threshold,
      band: 'unhealthy',
      advisory: 'Sample serverless trigger payload for SG AirWatch alert threshold breach.',
    });

    setWebhookStatus(result.message);
  };

  const sampleServerlessPayload = JSON.stringify(
    {
      event: 'AIR_QUALITY_ALERT',
      timestamp: '2026-10-15T12:00:00.000Z',
      region: localConfig.targetRegion,
      metrics: {
        psi24h: 128,
        pm25OneHourly: 68,
        band: 'unhealthy',
      },
      thresholdBreached: {
        type: 'PSI',
        triggerThreshold: localConfig.psiThreshold,
        actualValue: 128,
      },
      actionableAdvisory: {
        generalPublic: 'Reduce prolonged or strenuous outdoor physical exertion.',
        vulnerableGroups: 'Minimize outdoor activity; remain indoors with HEPA air purifiers.',
        n95Required: true,
      },
    },
    null,
    2
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleServerlessPayload);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Alert Thresholds & Push Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'rules'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Threshold Rules
          </button>
          <button
            onClick={() => setActiveTab('browser_push')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'browser_push'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Push Notification Settings
          </button>
          <button
            onClick={() => setActiveTab('serverless')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'serverless'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Serverless Backend Hook
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'logs'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Alert History ({logs.length})
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* PSI Slider */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white">24-hr PSI Alert Trigger</label>
                    <p className="text-xs text-slate-400">
                      Alert fires when 24-hr PSI reaches this value. Official Singapore Unhealthy threshold is 100.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                      {localConfig.psiThreshold}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">PSI</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="40"
                  max="250"
                  step="5"
                  value={localConfig.psiThreshold}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, psiThreshold: Number(e.target.value) }))
                  }
                  className="w-full mt-3 accent-cyan-400 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>50 (Good)</span>
                  <span className="text-amber-400 font-bold">100 (Unhealthy - Standard)</span>
                  <span>200 (Very Unhealthy)</span>
                </div>
              </div>

              {/* PM2.5 Slider */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white">1-hr PM2.5 Concentration Trigger</label>
                    <p className="text-xs text-slate-400">
                      Immediate outdoor activity indicator. NEA standard elevated band starts at 56 µg/m³.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                      {localConfig.pm25Threshold}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">µg/m³</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="160"
                  step="5"
                  value={localConfig.pm25Threshold}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, pm25Threshold: Number(e.target.value) }))
                  }
                  className="w-full mt-3 accent-cyan-400 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>25 µg/m³</span>
                  <span className="text-amber-400 font-bold">55 µg/m³ (Elevated Band)</span>
                  <span>150 µg/m³ (High Band)</span>
                </div>
              </div>

              {/* Sector Selection */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-white block mb-2">Target Sector for Alerts</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['all', 'central', 'north', 'south', 'east', 'west'] as (SingaporeRegion | 'all')[]).map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setLocalConfig((prev) => ({ ...prev, targetRegion: reg }))}
                      className={`p-2.5 text-xs font-medium rounded-lg capitalize border transition-all text-center ${
                        localConfig.targetRegion === reg
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {reg === 'all' ? 'Entire Singapore' : `${reg} Sector`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound & Quiet Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Synthesizer Audio Chime</div>
                    <div className="text-[11px] text-slate-400">Play dual-tone Web Audio chime on breach</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !localConfig.soundAlert;
                      setLocalConfig((prev) => ({ ...prev, soundAlert: next }));
                      if (next) playAlertChime(false);
                    }}
                    className={`p-2 rounded-lg border transition-colors ${
                      localConfig.soundAlert
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {localConfig.soundAlert ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Notification Frequency</div>
                    <div className="text-[11px] text-slate-400">Avoid duplicate spam notifications</div>
                  </div>
                  <select
                    value={localConfig.frequency}
                    onChange={(e: any) =>
                      setLocalConfig((prev) => ({ ...prev, frequency: e.target.value }))
                    }
                    className="bg-slate-900 text-slate-200 text-xs border border-slate-700 rounded-lg p-2 font-mono"
                  >
                    <option value="threshold_cross">On Threshold Crossing</option>
                    <option value="band_change">On Band Change Only</option>
                    <option value="hourly">Hourly Summary</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browser_push' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Web Push Notification Authorization</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enables real system notifications in macOS, Windows, Android, and iOS Safari.
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                      permissionState === 'granted'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                        : permissionState === 'denied'
                        ? 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                        : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {permissionState === 'granted'
                      ? '● Granted'
                      : permissionState === 'denied'
                      ? '✖ Blocked'
                      : '○ Pending Permission'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {permissionState !== 'granted' && (
                    <button
                      onClick={handleRequestPermission}
                      className="px-4 py-2 text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                    >
                      Request Browser Permission Now
                    </button>
                  )}

                  <button
                    onClick={handleSendTestPush}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Test Push Notification
                  </button>
                </div>

                {testStatus && (
                  <div className="mt-3 text-xs font-mono text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-lg">
                    {testStatus}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  How SG AirWatch Push Alerts Work
                </div>
                <p className="text-slate-400 leading-relaxed">
                  1. The background watcher periodically polls the Singapore government NEA API.<br />
                  2. If the 24-hr PSI breaches your configured limit (e.g. {localConfig.psiThreshold} PSI) or PM2.5 surpasses {localConfig.pm25Threshold} µg/m³, a native push notification with specific health actions is dispatched immediately.<br />
                  3. When you later attach your serverless backend, webhooks will push messages to Firebase Cloud Messaging (FCM) or Apple APNs even when this browser tab is closed.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'serverless' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Serverless Backend Connection</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your Cloud Function, AWS Lambda, or Cloud Run webhook endpoint to receive real-time threshold payloads.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Webhook Endpoint URL (HTTP POST)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://asia-southeast1-yourproject.cloudfunctions.net/airQualityAlertHook"
                      value={localConfig.webhookUrl}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white p-2.5 rounded-lg font-mono focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      onClick={handleTestWebhook}
                      className="px-3.5 py-2 text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Test Endpoint
                    </button>
                  </div>
                  {webhookStatus && (
                    <div className="mt-2 text-xs font-mono text-cyan-300">{webhookStatus}</div>
                  )}
                </div>
              </div>

              {/* Serverless Payload Contract Preview */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">JSON Payload Contract</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {isCopied ? 'Copied' : 'Copy Schema'}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-3 rounded-lg overflow-x-auto border border-slate-800">
                  {sampleServerlessPayload}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Triggered Threshold Audit Log</span>
                {logs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear History
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  No alert incidents recorded yet. Use the "Simulate Push Alert" button to trigger one.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-white capitalize">{log.region} Sector</span>
                        <span className="text-slate-400 font-mono">
                          {log.thresholdType} {log.thresholdType === 'PSI' ? log.psi : log.pm25} (Limit: {log.thresholdValue})
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{log.message}</p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
                      <span>Channels:</span>
                      {log.deliveredVia.map((c) => (
                        <span key={c} className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
          >
            Save & Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
