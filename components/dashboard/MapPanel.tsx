import type { MarkerData } from '@/lib/dashboard/types';
import type { Theme } from '@/lib/theme';
import { LiveMap } from './LiveMap';

type Props = {
  markers: MarkerData[];
  dark: boolean;
  t: Theme;
  showIncidents: boolean;
  showEvac: boolean;
  onToggleIncidents: () => void;
  onToggleEvac: () => void;
  onMarkerClick: (marker: MarkerData) => void;
};

function LayerToggle({
  label,
  active,
  onClick,
  t,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  t: Theme;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase border ${
        active ? 'bg-pdrrmo-navy border-pdrrmo-orange text-white' : t.select
      }`}
    >
      {label}
    </button>
  );
}

export function MapPanel({
  markers,
  dark,
  t,
  showIncidents,
  showEvac,
  onToggleIncidents,
  onToggleEvac,
  onMarkerClick,
}: Props) {
  return (
    <main className={`grow rounded-xl border overflow-hidden flex flex-col ${t.mapBg} ${t.cardBorder}`}>
      <div
        className={`px-4 py-2 border-b flex items-center justify-between ${t.subheadBg} ${t.subheadBorder}`}
      >
        <span className={`text-[10px] font-bold uppercase tracking-widest ${t.muted}`}>
          Iloilo Province — Live Situational Awareness
        </span>
        <div className="flex gap-2">
          <LayerToggle label="Affected Areas" active={showIncidents} onClick={onToggleIncidents} t={t} />
          <LayerToggle label="Evacuation Areas" active={showEvac} onClick={onToggleEvac} t={t} />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <LiveMap
          markers={markers}
          dark={dark}
          showIncidents={showIncidents}
          showEvac={showEvac}
          onMarkerClick={onMarkerClick}
        />
      </div>
    </main>
  );
}
