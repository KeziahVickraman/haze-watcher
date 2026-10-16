export type SingaporeRegion = 'national' | 'central' | 'north' | 'south' | 'east' | 'west';

export type AirQualityBand = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface RegionalReading {
  region: SingaporeRegion;
  name: string;
  lat: number;
  lng: number;
  psi24h: number;
  pm25OneHourly: number;
  pm25TwentyFourHourly: number;
  pm10TwentyFourHourly: number;
  so2TwentyFourHourly: number;
  no2OneHourly: number;
  o3EightHourly: number;
  coEightHourly: number;
  band: AirQualityBand;
  trend: 'rising' | 'steady' | 'falling';
}

export interface AirQualityData {
  timestamp: string;
  updateTime: string;
  source: 'NEA API (Live)' | 'Serverless API (/api/psi)' | 'Simulated Scenario' | 'Cached';
  readings: Record<SingaporeRegion, RegionalReading>;
  nationalPsi: number;
  nationalPm25: number;
  nationalBand: AirQualityBand;
  wind: {
    speedKmh: number;
    directionDeg: number;
    directionLabel: string;
    description: string;
  };
  hotspots: {
    sumatra: number;
    kalimantan: number;
    regionalRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
    satelliteDate: string;
  };
}

export interface HourlyTrendPoint {
  hour: string;
  timeLabel: string;
  nationalPsi: number;
  centralPsi: number;
  northPsi: number;
  southPsi: number;
  eastPsi: number;
  westPsi: number;
  pm25: number;
}

export interface AlertConfig {
  psiThreshold: number;
  pm25Threshold: number;
  targetRegion: SingaporeRegion | 'all';
  pushEnabled: boolean;
  soundAlert: boolean;
  frequency: 'immediate' | 'band_change' | 'hourly';
  webhookUrl: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
}

export interface AlertLogItem {
  id: string;
  timestamp: string;
  region: string;
  psi: number;
  pm25: number;
  band: AirQualityBand;
  thresholdType: 'PSI' | 'PM2.5';
  thresholdValue: number;
  message: string;
  deliveredVia: ('browser_push' | 'in_app' | 'audio')[];
}

export interface AdvisoryDetails {
  band: AirQualityBand;
  label: string;
  rangeText: string;
  colorClass: string;
  hexColor: string;
  bgColorClass: string;
  borderColorClass: string;
  healthyPersons: string;
  vulnerablePersons: string;
  outdoorActivities: string;
  n95Recommended: boolean;
}
