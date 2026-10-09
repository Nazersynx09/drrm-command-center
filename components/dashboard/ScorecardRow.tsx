import { Activity, Home, MapPin, Users } from 'lucide-react';
import type { Summary } from '@/lib/dashboard/types';
import { fmt, money } from '@/lib/format';
import type { Theme } from '@/lib/theme';
import { Scorecard } from './Scorecard';

type Props = { summary: Summary; dark: boolean; t: Theme };

export function ScorecardRow({ summary, dark, t }: Props) {
  const { population, humanImpact, infrastructure, evacuation, reporting } = summary;

  return (
    <section
      className={`grid grid-cols-2 md:grid-cols-4 gap-3 px-3 py-3 shrink-0 ${dark ? 'bg-[#00111f]' : 'bg-slate-100'}`}
    >
      <Scorecard
        t={t}
        title="Population Impact"
        icon={<Users className="text-blue-500" size={15} />}
        data={[
          ['Affected', fmt(population.affected)],
          ['Displaced', fmt(population.displaced)],
        ]}
      />
      <Scorecard
        t={t}
        title="Human Impact"
        icon={<Activity className="text-red-500" size={15} />}
        data={[
          ['Validated Casualties', fmt(humanImpact.casualties)],
          ['Reporting LGUs', `${reporting.affectedLGUs}/${reporting.totalLGUs}`],
        ]}
      />
      <Scorecard
        t={t}
        title="Infrastructure"
        icon={<Home className="text-orange-500" size={15} />}
        data={[
          ['Damaged', fmt(infrastructure.damaged)],
          ['Cost', money(infrastructure.cost)],
        ]}
      />
      <Scorecard
        t={t}
        title="Evacuation"
        icon={<MapPin className="text-emerald-500" size={15} />}
        data={[
          ['Centers Reported', fmt(evacuation.centers)],
          ['Evacuees', fmt(evacuation.evacuees)],
        ]}
      />
    </section>
  );
}
