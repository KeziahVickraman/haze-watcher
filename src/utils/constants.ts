import { AirQualityBand, AdvisoryDetails, SingaporeRegion } from '../types/airQuality';

export const REGION_COORDINATES: Record<SingaporeRegion, { lat: number; lng: number; label: string; description: string }> = {
  national: { lat: 1.3521, lng: 103.8198, label: 'Singapore (National)', description: 'Island-wide aggregate' },
  central: { lat: 1.3574, lng: 103.8273, label: 'Central', description: 'Bishan, Toa Payoh, MacRitchie, Novena' },
  north: { lat: 1.4180, lng: 103.8200, label: 'North', description: 'Woodlands, Yishun, Sembawang, Mandai' },
  south: { lat: 1.2959, lng: 103.8201, label: 'South', description: 'Marina Bay, Sentosa, Queenstown, HarbourFront' },
  east: { lat: 1.3574, lng: 103.9400, label: 'East', description: 'Bedok, Tampines, Changi, Pasir Ris' },
  west: { lat: 1.3574, lng: 103.7000, label: 'West', description: 'Jurong, Clementi, Tuas, Choa Chu Kang' },
};

export const SECONDARY_STATIONS = [
  { name: 'Woodlands Checkpoint', region: 'north', lat: 1.4426, lng: 103.7698, subArea: 'North Gate' },
  { name: 'Ang Mo Kio Town', region: 'central', lat: 1.3691, lng: 103.8454, subArea: 'Residential Hub' },
  { name: 'Jurong Industrial Area', region: 'west', lat: 1.3144, lng: 103.7064, subArea: 'Industrial Port' },
  { name: 'Marina South Pier', region: 'south', lat: 1.2711, lng: 103.8636, subArea: 'Coastal South' },
  { name: 'Changi Airport T3', region: 'east', lat: 1.3571, lng: 103.9872, subArea: 'Aviation East' },
  { name: 'Clementi Woods', region: 'west', lat: 1.3039, lng: 103.7700, subArea: 'West Corridor' },
  { name: 'Punggol Waterway', region: 'north', lat: 1.4050, lng: 103.9022, subArea: 'North-East Coast' },
];

export const PSI_BANDS: Record<AirQualityBand, AdvisoryDetails> = {
  good: {
    band: 'good',
    label: 'Good',
    rangeText: '0 – 50 PSI',
    colorClass: 'text-emerald-400',
    hexColor: '#10B981',
    bgColorClass: 'bg-emerald-950/40',
    borderColorClass: 'border-emerald-500/30',
    healthyPersons: 'Normal outdoor activities can be continued as usual.',
    vulnerablePersons: 'Normal outdoor activities can be continued as usual.',
    outdoorActivities: 'Safe for all outdoor recreation, sports, and marathons.',
    n95Recommended: false,
  },
  moderate: {
    band: 'moderate',
    label: 'Moderate',
    rangeText: '51 – 100 PSI',
    colorClass: 'text-sky-400',
    hexColor: '#0284C7',
    bgColorClass: 'bg-sky-950/40',
    borderColorClass: 'border-sky-500/30',
    healthyPersons: 'Normal outdoor activities can be continued as usual.',
    vulnerablePersons: 'Persons who are unusually sensitive may consider reducing prolonged outdoor physical exertion.',
    outdoorActivities: 'Outdoor sports and PE classes proceed normally with hydration.',
    n95Recommended: false,
  },
  unhealthy: {
    band: 'unhealthy',
    label: 'Unhealthy',
    rangeText: '101 – 200 PSI',
    colorClass: 'text-amber-400',
    hexColor: '#F59E0B',
    bgColorClass: 'bg-amber-950/40',
    borderColorClass: 'border-amber-500/30',
    healthyPersons: 'Reduce prolonged or strenuous outdoor physical exertion.',
    vulnerablePersons: 'Minimize prolonged or strenuous outdoor physical exertion. Stay indoors with air purifiers.',
    outdoorActivities: 'Schools replace strenuous outdoor PE with indoor activities. Keep windows closed.',
    n95Recommended: true,
  },
  very_unhealthy: {
    band: 'very_unhealthy',
    label: 'Very Unhealthy',
    rangeText: '201 – 300 PSI',
    colorClass: 'text-rose-400',
    hexColor: '#EF4444',
    bgColorClass: 'bg-rose-950/40',
    borderColorClass: 'border-rose-500/30',
    healthyPersons: 'Avoid prolonged or strenuous outdoor physical exertion. Wear an N95 respirator if outdoors for extended periods.',
    vulnerablePersons: 'Avoid all outdoor activity. Elderly, pregnant women, and lung/heart patients remain indoors with closed windows and HEPA filtration.',
    outdoorActivities: 'Outdoor sports events suspended. Construction and outdoor physical labor scaled back.',
    n95Recommended: true,
  },
  hazardous: {
    band: 'hazardous',
    label: 'Hazardous',
    rangeText: 'Above 300 PSI',
    colorClass: 'text-purple-400',
    hexColor: '#A855F7',
    bgColorClass: 'bg-purple-950/40',
    borderColorClass: 'border-purple-500/30',
    healthyPersons: 'Minimize outdoor activity. Do not engage in any outdoor exertion. Wear tight-fitting N95 respirator if stepping out.',
    vulnerablePersons: 'Stay indoors completely. Seek immediate medical advice if shortness of breath, chest pain, or severe cough occurs.',
    outdoorActivities: 'National haze crisis protocol in effect. All outdoor gatherings suspended.',
    n95Recommended: true,
  },
};

export function getPsiBand(psi: number): AirQualityBand {
  if (psi <= 50) return 'good';
  if (psi <= 100) return 'moderate';
  if (psi <= 200) return 'unhealthy';
  if (psi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

export function getPm25Status(pm25: number): { label: string; color: string; hex: string } {
  if (pm25 <= 55) return { label: 'Normal', color: 'text-emerald-400', hex: '#10B981' };
  if (pm25 <= 150) return { label: 'Elevated', color: 'text-amber-400', hex: '#F59E0B' };
  if (pm25 <= 250) return { label: 'High', color: 'text-rose-400', hex: '#EF4444' };
  return { label: 'Very High', color: 'text-purple-400', hex: '#A855F7' };
}
