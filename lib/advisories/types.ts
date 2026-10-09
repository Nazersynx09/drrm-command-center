export type AdvisoryType = 'Critical' | 'Warning' | 'Info';
export type AdvisorySource = 'PDRRMO' | 'PAGASA' | 'GDACS' | 'Open-Meteo' | 'USGS';

export interface AdvisoryData {
  id: string;
  title: string;
  type: AdvisoryType;
  issuer: string;
  source: AdvisorySource;
  issuedAt: string;
  expiresAt?: string;
  message: string;
  details: Record<string, string>;
  latitude?: number;
  longitude?: number;
  url?: string;
}
