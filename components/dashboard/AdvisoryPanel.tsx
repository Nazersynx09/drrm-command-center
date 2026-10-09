import { Bell } from 'lucide-react';
import type { Advisory } from '@/lib/dashboard/types';
import { timeAgo } from '@/lib/format';
import type { Theme } from '@/lib/theme';

type Props = { advisories: Advisory[]; t: Theme; onSelect: (advisory: Advisory) => void };

const BADGE: Record<Advisory['type'], string> = {
  Critical: 'bg-red-600',
  Warning: 'bg-orange-500',
  Info: 'bg-blue-600',
};

function AdvisoryCard({ adv, t, onClick }: { adv: Advisory; t: Theme; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${t.cardBg} ${t.cardBorder} hover:border-orange-400/60`}
    >
      <div className="flex justify-between items-start gap-2">
        <span
          className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${BADGE[adv.type]}`}
        >
          {adv.type}
        </span>
        <span className={`text-[9px] font-mono ${t.muted}`}>{timeAgo(adv.issuedAt)}</span>
      </div>
      <h4 className="text-xs font-bold text-pdrrmo-gold mt-2">{adv.title}</h4>
      <p className={`text-[9px] uppercase font-bold ${t.muted}`}>
        {adv.issuer} · {adv.source}
      </p>
      <p className={`text-[10px] leading-relaxed mt-2 ${t.body}`}>{adv.message}</p>
    </button>
  );
}

export function AdvisoryPanel({ advisories, t, onSelect }: Props) {
  return (
    <aside className={`w-[310px] lg:w-[340px] rounded-xl border flex flex-col ${t.panelBg} ${t.panelBorder}`}>
      <div className={`px-3 py-2.5 border-b flex items-center gap-2 ${t.subheadBg} ${t.subheadBorder}`}>
        <Bell size={13} className="text-pdrrmo-orange" />
        <h2 className="text-[10px] font-black uppercase">Advisory & Alerts</h2>
        <span className={`ml-auto text-[9px] ${t.muted}`}>{advisories.length} loaded</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {advisories.length ? (
          advisories.map((a) => <AdvisoryCard key={a.id} adv={a} t={t} onClick={() => onSelect(a)} />)
        ) : (
          <p className={`text-[10px] p-3 ${t.muted}`}>
            No external advisories available. Configure PAGASA API access to load PAGASA forecast data.
          </p>
        )}
      </div>
    </aside>
  );
}
