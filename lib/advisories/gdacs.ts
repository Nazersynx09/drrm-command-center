import type { AdvisoryData } from './types';

const URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';

function levelToType(level: string): AdvisoryData['type'] {
  const value = level.toLowerCase();
  if (value === 'red') return 'Critical';
  if (value === 'orange') return 'Warning';
  return 'Info';
}

function featureValue(props: any, keys: string[]) {
  for (const key of keys) {
    if (props?.[key] !== undefined && props?.[key] !== null) return props[key];
  }
  return undefined;
}

export async function getGdacsAdvisories(): Promise<AdvisoryData[]> {
  const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const url = new URL(URL);
  url.searchParams.set('eventlist', 'EQ;TC;FL;VO;WF;DR');
  url.searchParams.set('fromDate', from);
  url.searchParams.set('toDate', to);
  url.searchParams.set('alertlevel', 'Red;Orange;Green');
  url.searchParams.set('country', 'PHL');

  const response = await fetch(url, {
    headers: { Accept: 'application/geo+json, application/json' },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`GDACS returned ${response.status}`);

  const payload = await response.json();
  const features = Array.isArray(payload?.features) ? payload.features : [];

  return features
    .filter((feature: any) => {
      const props = feature?.properties ?? {};
      return String(featureValue(props, ['iso3', 'ISO3', 'country']))
        .toUpperCase()
        .includes('PHL') || String(featureValue(props, ['country'])).toLowerCase().includes('philippines');
    })
    .map((feature: any, index: number) => {
      const props = feature.properties ?? {};
      const level = String(featureValue(props, ['alertlevel', 'alertLevel']) ?? 'Green');
      const eventType = String(featureValue(props, ['eventtype', 'eventType']) ?? 'Hazard');
      const name = String(featureValue(props, ['name', 'eventname']) ?? eventType);
      const fromDate = featureValue(props, ['fromdate', 'fromDate']);
      const toDate = featureValue(props, ['todate', 'toDate']);
      const point = feature?.geometry?.coordinates;

      return {
        id: `gdacs-${featureValue(props, ['eventid', 'eventId']) ?? index}`,
        title: `${name}`,
        type: levelToType(level),
        issuer: 'GDACS',
        source: 'GDACS',
        issuedAt: fromDate ? new Date(fromDate).toISOString() : new Date().toISOString(),
        expiresAt: toDate ? new Date(toDate).toISOString() : undefined,
        message: `${eventType} event reported by GDACS for the Philippines. Alert level: ${level}.`,
        details: {
          Hazard: eventType,
          'Alert level': level,
          ...(featureValue(props, ['severity', 'severitytext']) != null ? { Severity: String(featureValue(props, ['severity', 'severitytext'])) } : {}),
          ...(featureValue(props, ['country']) != null ? { Country: String(featureValue(props, ['country'])) } : {}),
        },
        latitude: Array.isArray(point) ? Number(point[1]) : undefined,
        longitude: Array.isArray(point) ? Number(point[0]) : undefined,
        url: featureValue(props, ['reporturl', 'reportUrl', 'detailsurl', 'detailsUrl']) ?? undefined,
      };
    });
}
