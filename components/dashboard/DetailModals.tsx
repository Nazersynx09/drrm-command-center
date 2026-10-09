import type { Advisory, Incident, MarkerData } from '@/lib/dashboard/types';
import type { Theme } from '@/lib/theme';
import { Modal } from './Modal';

export function AdvisoryModal({
  advisory,
  onClose,
  t,
}: {
  advisory: Advisory;
  onClose: () => void;
  t: Theme;
}) {
  return (
    <Modal title={advisory.title} onClose={onClose} t={t}>
      <div className="flex gap-2 mb-3">
        <span className="px-2 py-1 rounded text-[9px] font-black text-white bg-orange-500">
          {advisory.type}
        </span>
        <span className={`text-[10px] ${t.muted}`}>
          {advisory.issuer} · {advisory.source}
        </span>
      </div>
      <p className={`text-xs leading-relaxed mb-4 ${t.body}`}>{advisory.message}</p>
      <div className={`rounded-lg divide-y ${t.rowBorder}`}>
        {Object.entries(advisory.details).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-3 py-2 text-[10px]">
            <span className={t.muted}>{k}</span>
            <span className="font-bold text-right">{v}</span>
          </div>
        ))}
      </div>
      {advisory.url && (
        <a
          href={advisory.url}
          target="_blank"
          rel="noreferrer"
          className="block mt-4 text-[10px] text-blue-400 underline"
        >
          Open source
        </a>
      )}
    </Modal>
  );
}

export function IncidentModal({
  incident,
  onClose,
  t,
}: {
  incident: Incident;
  onClose: () => void;
  t: Theme;
}) {
  const rows = [
    ['Barangay', incident.barangay],
    ['Reported', new Date(incident.time).toLocaleString('en-PH')],
    ['Severity', incident.severity],
    ['Status', incident.status ?? 'Reported'],
    ['Count', String(incident.count)],
  ];

  return (
    <Modal title={`${incident.type} · ${incident.town}`} onClose={onClose} t={t}>
      <p className={`text-xs leading-relaxed mb-4 ${t.body}`}>{incident.msg}</p>
      <div className={`rounded-lg divide-y ${t.rowBorder}`}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-3 py-2 text-[10px]">
            <span className={t.muted}>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      {incident.actionsTaken && (
        <p className={`mt-4 text-[10px] ${t.body}`}>
          <b>Actions:</b> {incident.actionsTaken}
        </p>
      )}
    </Modal>
  );
}

export function MarkerModal({ marker, onClose, t }: { marker: MarkerData; onClose: () => void; t: Theme }) {
  return (
    <Modal title={marker.name} onClose={onClose} t={t}>
      <p className={`text-xs ${t.body}`}>{marker.desc}</p>
    </Modal>
  );
}
