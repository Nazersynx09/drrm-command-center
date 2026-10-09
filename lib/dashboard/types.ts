import type { AdvisoryData } from '@/lib/advisories/types';

export type Severity = 'High' | 'Medium' | 'Low';

export type Advisory = AdvisoryData;

export type Summary = {
  incident: null | {
    id: string;
    name: string;
    incidentCode: string;
    hazardType: string;
    description: string | null;
    alertLevel: string;
    status: string;
    startDate: string;
    endDate: string | null;
  };
  population: { affected: number; displaced: number };
  humanImpact: { casualties: number };
  infrastructure: { damaged: number; cost: number };
  evacuation: { centers: number; evacuees: number };
  reporting: { activeReports: number; affectedLGUs: number; totalLGUs: number };
  lastUpdated: string;
};

export type Incident = {
  id: string;
  time: string;
  town: string;
  barangay: string;
  type: string;
  count: number;
  msg: string;
  actionsTaken: string | null;
  status: string | null;
  severity: Severity;
  lat: number | null;
  lng: number | null;
};

export type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: string;
  desc: string;
  severity: Severity;
  evacuation: boolean;
  affected: number;
  timestamp: string;
};

export const EMPTY_SUMMARY: Summary = {
  incident: null,
  population: { affected: 0, displaced: 0 },
  humanImpact: { casualties: 0 },
  infrastructure: { damaged: 0, cost: 0 },
  evacuation: { centers: 0, evacuees: 0 },
  reporting: { activeReports: 0, affectedLGUs: 0, totalLGUs: 0 },
  lastUpdated: '',
};
