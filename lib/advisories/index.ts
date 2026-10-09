import type { AdvisoryData } from './types';
import { getGdacsAdvisories } from './gdacs';
import { getPagasaAdvisories } from './pagasa';

export async function getAdvisories(): Promise<AdvisoryData[]> {
  const results = await Promise.allSettled([getPagasaAdvisories(), getGdacsAdvisories()]);

  const advisories: AdvisoryData[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') advisories.push(...result.value);
    else console.error('Advisory provider error:', result.reason);
  }

  return advisories
    .sort((a, b) => {
      const rank = { Critical: 0, Warning: 1, Info: 2 };
      return rank[a.type] - rank[b.type] || +new Date(b.issuedAt) - +new Date(a.issuedAt);
    })
    .slice(0, 30);
}
