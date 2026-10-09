import type { Incident, Severity } from '@/lib/dashboard/types';
import { timeAgo } from '@/lib/format';
import type { Theme } from '@/lib/theme';

export type SeverityFilter = 'all' | Severity;

type Props = {
  incidents: Incident[];
  filter: SeverityFilter;
  onFilterChange: (filter: SeverityFilter) => void;
  t: Theme;
  onSelect: (incident: Incident) => void;
};

const SEVERITY_TEXT: Record<Severity, string> = {
  High: 'text-red-500',
  Medium: 'text-orange-400',
  Low: 'text-emerald-500',
};

export function IncidentStream({ incidents, filter, onFilterChange, t, onSelect }: Props) {
  const rows = filter === 'all' ? incidents : incidents.filter((x) => x.severity === filter);

  return (
    <footer
      className={`h-[26%] mx-3 my-3 rounded-xl border flex flex-col overflow-hidden shrink-0 ${t.panelBg} ${t.panelBorder}`}
    >
      <div
        className={`px-4 py-2 border-b flex justify-between items-center ${t.subheadBg} ${t.subheadBorder}`}
      >
        <h2 className="text-[10px] font-black uppercase flex items-center gap-2 text-pdrrmo-gold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Live Incident Stream
        </h2>
        <div className={`flex items-center gap-3 text-[9px] font-mono uppercase ${t.muted}`}>
          <span>{rows.length} reports</span>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as SeverityFilter)}
            className={`border rounded px-1.5 py-0.5 ${t.select}`}
          >
            <option value="all">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead className={`sticky top-0 text-[9px] uppercase border-b ${t.subheadBg} ${t.muted}`}>
            <tr>
              <th className="px-4 py-2">Timestamp</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2 text-right">Severity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr
                key={i.id}
                onClick={() => onSelect(i)}
                className={`border-b cursor-pointer ${t.rowBorder} ${t.rowHover}`}
              >
                <td className={`px-4 py-2 font-mono text-[10px] ${t.muted}`}>{timeAgo(i.time)}</td>
                <td className="px-4 py-2 font-black text-pdrrmo-orange uppercase text-[10px]">
                  {i.town}
                  <div className={`font-normal normal-case ${t.muted}`}>{i.barangay}</div>
                </td>
                <td className={`px-4 py-2 text-[10px] ${t.body}`}>{i.msg}</td>
                <td className={`px-4 py-2 text-right font-bold text-[9px] ${SEVERITY_TEXT[i.severity]}`}>
                  {i.severity}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className={`text-center py-8 text-[11px] ${t.muted}`}>
                  No incident records for the active incident.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </footer>
  );
}
