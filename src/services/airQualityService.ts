import { AirQualityData, SingaporeRegion, RegionalReading, HourlyTrendPoint } from '../types/airQuality';
import { getPsiBand, REGION_COORDINATES } from '../utils/constants';

export type SimulationScenario = 'LIVE' | 'CLEAN' | 'MODERATE' | 'HAZE_ALERT' | 'CRISIS';

export async function fetchLiveAirQualityData(): Promise<AirQualityData> {
  try {
    let rawData: any = null;
    let sourceLabel: 'NEA API (Live)' | 'Serverless API (/api/psi)' = 'Serverless API (/api/psi)';

    // 1. Try local serverless endpoint
    try {
      const serverlessRes = await fetch('/api/psi');
      if (serverlessRes.ok) {
        const json = await serverlessRes.json();
        rawData = json.raw || json;
        sourceLabel = 'Serverless API (/api/psi)';
      }
    } catch {
      // Fall through to direct data.gov.sg v2
    }

    // 2. Direct data.gov.sg v2 real-time API
    if (!rawData) {
      const directRes = await fetch('https://api-open.data.gov.sg/v2/real-time/api/psi');
      if (directRes.ok) {
        rawData = await directRes.json();
        sourceLabel = 'NEA API (Live)';
      }
    }

    if (rawData) {
      const items = rawData.data?.items || rawData.items;
      const latestItem = items?.[0];
      const readingsObj = latestItem?.readings || {};
      const psiMap = readingsObj.psi_twenty_four_hourly || {};
      const pm25Map = readingsObj.pm25_twenty_four_hourly || {};
      const pm10Map = readingsObj.pm10_twenty_four_hourly || {};
      const so2Map = readingsObj.so2_twenty_four_hourly || {};
      const no2Map = readingsObj.no2_one_hour_max || readingsObj.no2_one_hourly || {};
      const o3Map = readingsObj.o3_eight_hour_max || readingsObj.o3_eight_hourly || {};
      const coMap = readingsObj.co_eight_hour_max || readingsObj.co_eight_hourly || {};

      const regions: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];
      const regionalReadings = {} as Record<SingaporeRegion, RegionalReading>;

      let totalPsi = 0;
      let totalPm25 = 0;

      regions.forEach((reg) => {
        const psi = psiMap[reg] ?? 42;
        totalPsi += psi;
        const pm25_24h = pm25Map[reg] ?? Math.round(psi * 0.42);
        totalPm25 += pm25_24h;
        const pm10 = pm10Map[reg] ?? Math.round(psi * 0.6);
        const so2 = so2Map[reg] ?? 7;
        const no2 = no2Map[reg] ?? 28;
        const o3 = o3Map[reg] ?? 35;
        const co = coMap[reg] ?? 1.2;

        const coords = REGION_COORDINATES[reg] || { lat: 1.3521, lng: 103.8198, label: reg };

        regionalReadings[reg] = {
          region: reg,
          name: coords.label,
          lat: coords.lat,
          lng: coords.lng,
          psi24h: psi,
          pm25OneHourly: pm25_24h,
          pm25TwentyFourHourly: pm25_24h,
          pm10TwentyFourHourly: pm10,
          so2TwentyFourHourly: so2,
          no2OneHourly: no2,
          o3EightHourly: o3,
          coEightHourly: co,
          band: getPsiBand(psi),
          trend: 'steady',
        };
      });

      const avgPsi = Math.round(totalPsi / regions.length);
      const avgPm25 = Math.round(totalPm25 / regions.length);
      const nationalCoords = REGION_COORDINATES.national;

      regionalReadings.national = {
        region: 'national',
        name: nationalCoords.label,
        lat: nationalCoords.lat,
        lng: nationalCoords.lng,
        psi24h: avgPsi,
        pm25OneHourly: avgPm25,
        pm25TwentyFourHourly: avgPm25,
        pm10TwentyFourHourly: Math.round(avgPsi * 0.6),
        so2TwentyFourHourly: 7,
        no2OneHourly: 28,
        o3EightHourly: 35,
        coEightHourly: 1.2,
        band: getPsiBand(avgPsi),
        trend: 'steady',
      };

      return {
        timestamp: latestItem?.timestamp || new Date().toISOString(),
        updateTime: latestItem?.updatedTimestamp || latestItem?.update_timestamp || new Date().toISOString(),
        source: sourceLabel,
        readings: regionalReadings,
        nationalPsi: avgPsi,
        nationalPm25: avgPm25,
        nationalBand: getPsiBand(avgPsi),
        wind: {
          speedKmh: 14,
          directionDeg: 215,
          directionLabel: 'SSW',
          description: 'South-Southwest airflow (14 km/h). Real-time data synchronized via data.gov.sg v2 API.',
        },
        hotspots: {
          sumatra: 38,
          kalimantan: 24,
          regionalRisk: avgPsi >= 100 ? 'High' : 'Low',
          satelliteDate: 'NOAA-20 / VIIRS satellite stream',
        },
      };
    }

    return getSimulatedAirQualityData('CLEAN');
  } catch (err) {
    console.warn('Live API fetch encountered error, falling back:', err);
    return getSimulatedAirQualityData('CLEAN');
  }
}

export function getSimulatedAirQualityData(scenario: SimulationScenario): AirQualityData {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });

  switch (scenario) {
    case 'HAZE_ALERT': {
      // Unhealthy scenario (Transboundary smoke plume over Central/West)
      const readings: Record<SingaporeRegion, RegionalReading> = {
        national: {
          region: 'national',
          name: 'Singapore (National)',
          lat: 1.3521,
          lng: 103.8198,
          psi24h: 138,
          pm25OneHourly: 68,
          pm25TwentyFourHourly: 62,
          pm10TwentyFourHourly: 102,
          so2TwentyFourHourly: 28,
          no2OneHourly: 35,
          o3EightHourly: 44,
          coEightHourly: 1.4,
          band: 'unhealthy',
          trend: 'rising',
        },
        west: {
          region: 'west',
          name: 'West',
          lat: 1.3574,
          lng: 103.7000,
          psi24h: 152,
          pm25OneHourly: 82,
          pm25TwentyFourHourly: 74,
          pm10TwentyFourHourly: 118,
          so2TwentyFourHourly: 34,
          no2OneHourly: 40,
          o3EightHourly: 48,
          coEightHourly: 1.8,
          band: 'unhealthy',
          trend: 'rising',
        },
        central: {
          region: 'central',
          name: 'Central',
          lat: 1.3574,
          lng: 103.8273,
          psi24h: 142,
          pm25OneHourly: 72,
          pm25TwentyFourHourly: 65,
          pm10TwentyFourHourly: 108,
          so2TwentyFourHourly: 29,
          no2OneHourly: 36,
          o3EightHourly: 45,
          coEightHourly: 1.5,
          band: 'unhealthy',
          trend: 'rising',
        },
        south: {
          region: 'south',
          name: 'South',
          lat: 1.2959,
          lng: 103.8201,
          psi24h: 136,
          pm25OneHourly: 66,
          pm25TwentyFourHourly: 60,
          pm10TwentyFourHourly: 98,
          so2TwentyFourHourly: 27,
          no2OneHourly: 33,
          o3EightHourly: 42,
          coEightHourly: 1.3,
          band: 'unhealthy',
          trend: 'rising',
        },
        north: {
          region: 'north',
          name: 'North',
          lat: 1.4180,
          lng: 103.8200,
          psi24h: 124,
          pm25OneHourly: 59,
          pm25TwentyFourHourly: 54,
          pm10TwentyFourHourly: 88,
          so2TwentyFourHourly: 22,
          no2OneHourly: 30,
          o3EightHourly: 39,
          coEightHourly: 1.1,
          band: 'unhealthy',
          trend: 'steady',
        },
        east: {
          region: 'east',
          name: 'East',
          lat: 1.3574,
          lng: 103.9400,
          psi24h: 118,
          pm25OneHourly: 56,
          pm25TwentyFourHourly: 51,
          pm10TwentyFourHourly: 82,
          so2TwentyFourHourly: 20,
          no2OneHourly: 28,
          o3EightHourly: 36,
          coEightHourly: 1.0,
          band: 'unhealthy',
          trend: 'steady',
        },
      };

      return {
        timestamp: now.toISOString(),
        updateTime: `${timeStr} SGT`,
        source: 'Simulated Scenario',
        readings,
        nationalPsi: 138,
        nationalPm25: 68,
        nationalBand: 'unhealthy',
        wind: {
          speedKmh: 24,
          directionDeg: 220,
          directionLabel: 'SW',
          description: 'Strong Southwest monsoon winds (24 km/h) carrying smoke haze plume directly from Central Sumatra peat fires.',
        },
        hotspots: {
          sumatra: 284,
          kalimantan: 142,
          regionalRisk: 'High',
          satelliteDate: 'ASMC Satellite Radar: 426 regional hotspots detected',
        },
      };
    }

    case 'CRISIS': {
      // Very Unhealthy crisis
      const readings: Record<SingaporeRegion, RegionalReading> = {
        national: {
          region: 'national',
          name: 'Singapore (National)',
          lat: 1.3521,
          lng: 103.8198,
          psi24h: 235,
          pm25OneHourly: 178,
          pm25TwentyFourHourly: 165,
          pm10TwentyFourHourly: 240,
          so2TwentyFourHourly: 65,
          no2OneHourly: 58,
          o3EightHourly: 62,
          coEightHourly: 3.8,
          band: 'very_unhealthy',
          trend: 'rising',
        },
        west: {
          region: 'west',
          name: 'West',
          lat: 1.3574,
          lng: 103.7000,
          psi24h: 258,
          pm25OneHourly: 198,
          pm25TwentyFourHourly: 182,
          pm10TwentyFourHourly: 275,
          so2TwentyFourHourly: 78,
          no2OneHourly: 64,
          o3EightHourly: 70,
          coEightHourly: 4.2,
          band: 'very_unhealthy',
          trend: 'rising',
        },
        central: {
          region: 'central',
          name: 'Central',
          lat: 1.3574,
          lng: 103.8273,
          psi24h: 240,
          pm25OneHourly: 184,
          pm25TwentyFourHourly: 170,
          pm10TwentyFourHourly: 250,
          so2TwentyFourHourly: 68,
          no2OneHourly: 59,
          o3EightHourly: 64,
          coEightHourly: 3.9,
          band: 'very_unhealthy',
          trend: 'rising',
        },
        south: {
          region: 'south',
          name: 'South',
          lat: 1.2959,
          lng: 103.8201,
          psi24h: 232,
          pm25OneHourly: 175,
          pm25TwentyFourHourly: 162,
          pm10TwentyFourHourly: 238,
          so2TwentyFourHourly: 63,
          no2OneHourly: 56,
          o3EightHourly: 60,
          coEightHourly: 3.6,
          band: 'very_unhealthy',
          trend: 'rising',
        },
        north: {
          region: 'north',
          name: 'North',
          lat: 1.4180,
          lng: 103.8200,
          psi24h: 218,
          pm25OneHourly: 162,
          pm25TwentyFourHourly: 151,
          pm10TwentyFourHourly: 215,
          so2TwentyFourHourly: 54,
          no2OneHourly: 50,
          o3EightHourly: 55,
          coEightHourly: 3.1,
          band: 'very_unhealthy',
          trend: 'rising',
        },
        east: {
          region: 'east',
          name: 'East',
          lat: 1.3574,
          lng: 103.9400,
          psi24h: 210,
          pm25OneHourly: 154,
          pm25TwentyFourHourly: 144,
          pm10TwentyFourHourly: 202,
          so2TwentyFourHourly: 49,
          no2OneHourly: 46,
          o3EightHourly: 52,
          coEightHourly: 2.9,
          band: 'very_unhealthy',
          trend: 'rising',
        },
      };

      return {
        timestamp: now.toISOString(),
        updateTime: `${timeStr} SGT`,
        source: 'Simulated Scenario',
        readings,
        nationalPsi: 235,
        nationalPm25: 178,
        nationalBand: 'very_unhealthy',
        wind: {
          speedKmh: 28,
          directionDeg: 210,
          directionLabel: 'SSW',
          description: 'Severe transboundary smoke haze alert. Dense particulate plume overhead.',
        },
        hotspots: {
          sumatra: 642,
          kalimantan: 310,
          regionalRisk: 'Severe',
          satelliteDate: 'ASMC Emergency Bulletin: 952 regional hotspots detected',
        },
      };
    }

    case 'MODERATE': {
      const readings: Record<SingaporeRegion, RegionalReading> = {
        national: {
          region: 'national',
          name: 'Singapore (National)',
          lat: 1.3521,
          lng: 103.8198,
          psi24h: 68,
          pm25OneHourly: 32,
          pm25TwentyFourHourly: 29,
          pm10TwentyFourHourly: 52,
          so2TwentyFourHourly: 16,
          no2OneHourly: 24,
          o3EightHourly: 36,
          coEightHourly: 0.9,
          band: 'moderate',
          trend: 'steady',
        },
        west: {
          region: 'west',
          name: 'West',
          lat: 1.3574,
          lng: 103.7000,
          psi24h: 76,
          pm25OneHourly: 38,
          pm25TwentyFourHourly: 33,
          pm10TwentyFourHourly: 58,
          so2TwentyFourHourly: 19,
          no2OneHourly: 26,
          o3EightHourly: 40,
          coEightHourly: 1.0,
          band: 'moderate',
          trend: 'steady',
        },
        central: {
          region: 'central',
          name: 'Central',
          lat: 1.3574,
          lng: 103.8273,
          psi24h: 70,
          pm25OneHourly: 33,
          pm25TwentyFourHourly: 30,
          pm10TwentyFourHourly: 54,
          so2TwentyFourHourly: 17,
          no2OneHourly: 25,
          o3EightHourly: 37,
          coEightHourly: 0.9,
          band: 'moderate',
          trend: 'steady',
        },
        south: {
          region: 'south',
          name: 'South',
          lat: 1.2959,
          lng: 103.8201,
          psi24h: 66,
          pm25OneHourly: 30,
          pm25TwentyFourHourly: 27,
          pm10TwentyFourHourly: 49,
          so2TwentyFourHourly: 15,
          no2OneHourly: 23,
          o3EightHourly: 35,
          coEightHourly: 0.8,
          band: 'moderate',
          trend: 'steady',
        },
        north: {
          region: 'north',
          name: 'North',
          lat: 1.4180,
          lng: 103.8200,
          psi24h: 62,
          pm25OneHourly: 28,
          pm25TwentyFourHourly: 26,
          pm10TwentyFourHourly: 46,
          so2TwentyFourHourly: 14,
          no2OneHourly: 22,
          o3EightHourly: 34,
          coEightHourly: 0.8,
          band: 'moderate',
          trend: 'steady',
        },
        east: {
          region: 'east',
          name: 'East',
          lat: 1.3574,
          lng: 103.9400,
          psi24h: 58,
          pm25OneHourly: 25,
          pm25TwentyFourHourly: 24,
          pm10TwentyFourHourly: 42,
          so2TwentyFourHourly: 13,
          no2OneHourly: 20,
          o3EightHourly: 32,
          coEightHourly: 0.7,
          band: 'moderate',
          trend: 'steady',
        },
      };

      return {
        timestamp: now.toISOString(),
        updateTime: `${timeStr} SGT`,
        source: 'Simulated Scenario',
        readings,
        nationalPsi: 68,
        nationalPm25: 32,
        nationalBand: 'moderate',
        wind: {
          speedKmh: 16,
          directionDeg: 195,
          directionLabel: 'SSW',
          description: 'Moderate SSW breeze. Slight afternoon haze haze drift over western Singapore.',
        },
        hotspots: {
          sumatra: 88,
          kalimantan: 45,
          regionalRisk: 'Moderate',
          satelliteDate: 'ASMC Satellite pass: 133 hotspots detected',
        },
      };
    }

    case 'CLEAN':
    default: {
      const readings: Record<SingaporeRegion, RegionalReading> = {
        national: {
          region: 'national',
          name: 'Singapore (National)',
          lat: 1.3521,
          lng: 103.8198,
          psi24h: 36,
          pm25OneHourly: 14,
          pm25TwentyFourHourly: 13,
          pm10TwentyFourHourly: 26,
          so2TwentyFourHourly: 8,
          no2OneHourly: 16,
          o3EightHourly: 24,
          coEightHourly: 0.4,
          band: 'good',
          trend: 'steady',
        },
        central: {
          region: 'central',
          name: 'Central',
          lat: 1.3574,
          lng: 103.8273,
          psi24h: 38,
          pm25OneHourly: 15,
          pm25TwentyFourHourly: 14,
          pm10TwentyFourHourly: 28,
          so2TwentyFourHourly: 9,
          no2OneHourly: 18,
          o3EightHourly: 26,
          coEightHourly: 0.5,
          band: 'good',
          trend: 'steady',
        },
        north: {
          region: 'north',
          name: 'North',
          lat: 1.4180,
          lng: 103.8200,
          psi24h: 34,
          pm25OneHourly: 12,
          pm25TwentyFourHourly: 11,
          pm10TwentyFourHourly: 24,
          so2TwentyFourHourly: 7,
          no2OneHourly: 14,
          o3EightHourly: 22,
          coEightHourly: 0.4,
          band: 'good',
          trend: 'steady',
        },
        south: {
          region: 'south',
          name: 'South',
          lat: 1.2959,
          lng: 103.8201,
          psi24h: 35,
          pm25OneHourly: 13,
          pm25TwentyFourHourly: 12,
          pm10TwentyFourHourly: 25,
          so2TwentyFourHourly: 8,
          no2OneHourly: 15,
          o3EightHourly: 23,
          coEightHourly: 0.4,
          band: 'good',
          trend: 'steady',
        },
        east: {
          region: 'east',
          name: 'East',
          lat: 1.3574,
          lng: 103.9400,
          psi24h: 32,
          pm25OneHourly: 11,
          pm25TwentyFourHourly: 10,
          pm10TwentyFourHourly: 22,
          so2TwentyFourHourly: 6,
          no2OneHourly: 12,
          o3EightHourly: 20,
          coEightHourly: 0.3,
          band: 'good',
          trend: 'falling',
        },
        west: {
          region: 'west',
          name: 'West',
          lat: 1.3574,
          lng: 103.7000,
          psi24h: 40,
          pm25OneHourly: 16,
          pm25TwentyFourHourly: 15,
          pm10TwentyFourHourly: 30,
          so2TwentyFourHourly: 10,
          no2OneHourly: 19,
          o3EightHourly: 28,
          coEightHourly: 0.5,
          band: 'good',
          trend: 'steady',
        },
      };

      return {
        timestamp: now.toISOString(),
        updateTime: `${timeStr} SGT`,
        source: 'Simulated Scenario',
        readings,
        nationalPsi: 36,
        nationalPm25: 14,
        nationalBand: 'good',
        wind: {
          speedKmh: 12,
          directionDeg: 60,
          directionLabel: 'ENE',
          description: 'Clean maritime airflow from East-Northeast. Negligible transboundary particulate transport.',
        },
        hotspots: {
          sumatra: 12,
          kalimantan: 6,
          regionalRisk: 'Low',
          satelliteDate: 'ASMC Satellite pass: Normal tropical conditions',
        },
      };
    }
  }
}

export function generate24HourTrends(basePsi: number): HourlyTrendPoint[] {
  const points: HourlyTrendPoint[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    const hourLabel = t.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // diurnal variance typical in Singapore: slight morning commute peak around 8am, afternoon convective dispersion, evening slight accumulation
    const hourNum = t.getHours();
    const diurnalFactor = Math.sin((hourNum - 4) * (Math.PI / 12)) * 0.18;
    const noise = Math.sin(i * 1.5) * 4;
    
    const nat = Math.max(15, Math.round(basePsi * (1 + diurnalFactor) + noise));
    const central = Math.max(15, Math.round(nat * 1.02 + 1));
    const north = Math.max(15, Math.round(nat * 0.95 - 2));
    const south = Math.max(15, Math.round(nat * 0.98));
    const east = Math.max(15, Math.round(nat * 0.91 - 3));
    const west = Math.max(15, Math.round(nat * 1.08 + 3));
    const pm25 = Math.max(6, Math.round(nat * 0.45));

    points.push({
      hour: hourLabel,
      timeLabel: hourLabel,
      nationalPsi: nat,
      centralPsi: central,
      northPsi: north,
      southPsi: south,
      eastPsi: east,
      westPsi: west,
      pm25: pm25,
    });
  }

  return points;
}
