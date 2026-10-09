import { Moon, ShieldAlert, Sun } from 'lucide-react';
import type { Summary } from '@/lib/dashboard/types';

type Props = { summary: Summary; lastSync: Date | null; dark: boolean; onToggleTheme: () => void };

function alertColor(level?: string) {
  if (level === 'RED') return 'bg-red-600';
  if (level === 'BLUE') return 'bg-blue-600';
  return 'bg-slate-600';
}

export function Header({ summary, lastSync, dark, onToggleTheme }: Props) {
  const { incident, reporting } = summary;
  const stats = [
    ['Active Reports', reporting.activeReports.toLocaleString()],
    ['Affected LGUs', `${reporting.affectedLGUs}/${reporting.totalLGUs}`],
    ['Status', incident?.status ?? 'IDLE'],
  ];

  return (
    <header className="bg-pdrrmo-navy border-b border-white/10 px-6 py-2 flex justify-between items-center shrink-0 z-40">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <ShieldAlert className="text-pdrrmo-navy" size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black uppercase tracking-tight text-white truncate">
              {incident?.name ?? 'No Active Incident'}
            </h1>
            {incident && (
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${alertColor(incident.alertLevel)}`}
              >
                {incident.alertLevel}
              </span>
            )}
          </div>
          <p className="text-[9px] text-white/50 font-mono">
            Last Sync: {lastSync?.toLocaleTimeString('en-PH') ?? 'Loading...'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="hidden md:flex gap-6 border-x border-white/10 px-6">
          {stats.map(([label, value]) => (
            <div key={label} className="text-center">
              <p className="text-[8px] uppercase text-white/40">{label}</p>
              <p className="text-xs font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <button onClick={onToggleTheme} aria-label="Toggle theme">
          {dark ? <Sun size={18} className="text-pdrrmo-gold" /> : <Moon size={18} className="text-white" />}
        </button>
      </div>
    </header>
  );
}
