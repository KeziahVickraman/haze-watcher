import { AlertConfig, AlertLogItem, SingaporeRegion, AirQualityBand } from '../types/airQuality';
import { PSI_BANDS } from '../utils/constants';

const CONFIG_STORAGE_KEY = 'sg_airwatch_alert_config';
const LOGS_STORAGE_KEY = 'sg_airwatch_alert_logs';

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  psiThreshold: 100,
  pm25Threshold: 55,
  targetRegion: 'all',
  pushEnabled: false,
  soundAlert: true,
  frequency: 'threshold_cross' as any,
  webhookUrl: '',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

// Audio chime using Web Audio API
export function playAlertChime(isCritical: boolean = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'sawtooth' : 'sine';
    
    // Frequency arpeggio: two distinct chime notes
    if (isCritical) {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (err) {
    console.warn('Web Audio chime could not play:', err);
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return false;
  }
}

export function triggerSystemNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
    return true;
  } catch (err) {
    console.error('Error instantiating notification:', err);
    return false;
  }
}

export function loadAlertConfig(): AlertConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_ALERT_CONFIG;
    return { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ALERT_CONFIG;
  }
}

export function saveAlertConfig(config: AlertConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save alert config to localStorage', err);
  }
}

export function loadAlertLogs(): AlertLogItem[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return getInitialDemoLogs();
    return JSON.parse(raw);
  } catch {
    return getInitialDemoLogs();
  }
}

export function appendAlertLog(log: AlertLogItem): AlertLogItem[] {
  try {
    const current = loadAlertLogs();
    const updated = [log, ...current].slice(0, 50); // Keep last 50 logs
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [log];
  }
}

export function clearAlertLogs(): void {
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear logs', err);
  }
}

// Initial realistic logs showing Singapore history
function getInitialDemoLogs(): AlertLogItem[] {
  return [
    {
      id: 'log-1',
      timestamp: 'Today at 07:15 SGT',
      region: 'Central',
      psi: 104,
      pm25: 58,
      band: 'unhealthy',
      thresholdType: 'PSI',
      thresholdValue: 100,
      message: 'Central region 24-hr PSI breached threshold (104 PSI). Air quality categorized as Unhealthy. Advisory: Minimize prolonged outdoor exertion.',
      deliveredVia: ['browser_push', 'in_app', 'audio'],
    },
    {
      id: 'log-2',
      timestamp: 'Yesterday at 16:40 SGT',
      region: 'West',
      psi: 92,
      pm25: 64,
      band: 'moderate',
      thresholdType: 'PM2.5',
      thresholdValue: 55,
      message: 'West sector 1-hr PM2.5 elevated to 64 µg/m³. Advisory: Sensitive individuals should avoid strenuous outdoor workout.',
      deliveredVia: ['in_app'],
    },
  ];
}

// Serverless webhook dispatch helper
export async function dispatchServerlessWebhook(
  url: string,
  payload: {
    event: 'ALERT_TRIGGERED' | 'TEST_PING';
    timestamp: string;
    region: string;
    psi: number;
    pm25: number;
    band: AirQualityBand;
    advisory: string;
  }
): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'Invalid webhook endpoint URL' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { success: true, message: `Serverless backend responded with HTTP ${response.status}` };
    } else {
      return { success: false, message: `Endpoint returned HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (err: any) {
    return { success: false, message: `Network error or CORS: ${err?.message || 'Failed to dispatch'}` };
  }
}
