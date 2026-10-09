import type { ReactNode } from 'react';
import type { Theme } from '@/lib/theme';

type Props = { title: string; icon: ReactNode; data: [string, string][]; t: Theme };

export function Scorecard({ title, icon, data, t }: Props) {
  return (
    <div className={`border rounded-xl p-3 shadow-sm ${t.cardBg} ${t.cardBorder}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${t.chip}`}>{icon}</div>
        <h3 className={`text-[10px] font-black uppercase tracking-tight ${t.muted}`}>{title}</h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/10">
        {data.map(([label, value]) => (
          <div key={label} className="px-2 first:pl-0">
            <div className={`text-lg font-black leading-none ${t.pageText}`}>{value}</div>
            <div className={`text-[8px] uppercase mt-1 ${t.muted}`}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
