'use client';

import { useEffect, useState } from 'react';
import type { Advisory, Incident, MarkerData, Summary } from '@/lib/dashboard/types';
import { EMPTY_SUMMARY } from '@/lib/dashboard/types';

const POLL_INTERVAL_MS = 30_000;

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function useDashboardData() {
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const [s, i, m, a] = await Promise.all([
        getJson<Summary>('/api/dashboard/summary'),
        getJson<{ incidents?: Incident[] }>('/api/dashboard/incidents'),
        getJson<{ markers?: MarkerData[] }>('/api/dashboard/map'),
        getJson<{ advisories?: Advisory[] }>('/api/advisories'),
      ]);
      if (!active) return;
      if (s) setSummary(s);
      if (i) setIncidents(i.incidents ?? []);
      if (m) setMarkers(m.markers ?? []);
      if (a) setAdvisories(a.advisories ?? []);
      setLastSync(new Date());
    }

    void load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return { summary, incidents, markers, advisories, lastSync };
}
