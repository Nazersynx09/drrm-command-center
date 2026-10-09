'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Advisory, Incident, MarkerData } from '@/lib/dashboard/types';
import { theme } from '@/lib/theme';
import { AdvisoryPanel } from './AdvisoryPanel';
import { AdvisoryModal, IncidentModal, MarkerModal } from './DetailModals';
import { Header } from './Header';
import { IncidentStream, type SeverityFilter } from './IncidentStream';
import { MapPanel } from './MapPanel';
import { ScorecardRow } from './ScorecardRow';

export function Dashboard() {
  const { summary, incidents, markers, advisories, lastSync } = useDashboardData();

  const [dark, setDark] = useState(true);
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showEvac, setShowEvac] = useState(true);
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const t = theme(dark);

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans ${t.pageBg} ${t.pageText}`}>
      {selectedAdvisory && (
        <AdvisoryModal advisory={selectedAdvisory} onClose={() => setSelectedAdvisory(null)} t={t} />
      )}
      {selectedIncident && (
        <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} t={t} />
      )}
      {selectedMarker && (
        <MarkerModal marker={selectedMarker} onClose={() => setSelectedMarker(null)} t={t} />
      )}

      <Header summary={summary} lastSync={lastSync} dark={dark} onToggleTheme={() => setDark((v) => !v)} />
      <ScorecardRow summary={summary} dark={dark} t={t} />

      <div className="flex flex-1 overflow-hidden px-3 gap-3 min-h-0">
        <MapPanel
          markers={markers}
          dark={dark}
          t={t}
          showIncidents={showIncidents}
          showEvac={showEvac}
          onToggleIncidents={() => setShowIncidents((v) => !v)}
          onToggleEvac={() => setShowEvac((v) => !v)}
          onMarkerClick={setSelectedMarker}
        />
        <AdvisoryPanel advisories={advisories} t={t} onSelect={setSelectedAdvisory} />
      </div>

      <IncidentStream
        incidents={incidents}
        filter={severity}
        onFilterChange={setSeverity}
        t={t}
        onSelect={setSelectedIncident}
      />
    </div>
  );
}
