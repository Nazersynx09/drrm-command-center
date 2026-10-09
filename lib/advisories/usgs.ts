import type { AdvisoryData } from './types';

// USGS earthquake catalog: free, keyless. Used here because PHIVOLCS has no public API.
// Official Philippine bulletins: https://earthquake.phivolcs.dost.gov.ph
const QUERY_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

const LAT = Number(process.env.FORECAST_LAT ?? 10.7202);
const LON = Number(process.env.FORECAST_LON ?? 122.5621);
const RADIUS_KM = 300;
const MIN_MAGNITUDE = 4.0;
const LOOKBACK_DAYS = 3;

type UsgsFeature = {
  id: string;
  properties: { mag: number | null; place: string | null; time: number; url: string | null };
  geometry: { coordinates: [number, number, number] };
};

function magnitudeToType(mag: number): AdvisoryData['type'] {
  if (mag >= 6.5) return 'Critical';
  if (mag >= 5.0) return 'Warning';
  return 'Info';
}

export async function getUsgsAdvisories(): Promise<AdvisoryData[]> {
  const url = new URL(QUERY_URL);
  url.searchParams.set('format', 'geojson');
  url.searchParams.set('latitude', String(LAT));
  url.searchParams.set('longitude', String(LON));
  url.searchParams.set('maxradiuskm', String(RADIUS_KM));
  url.searchParams.set('minmagnitude', String(MIN_MAGNITUDE));
  url.searchParams.set('starttime', new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString());
  url.searchParams.set('orderby', 'time');
  url.searchParams.set('limit', '10');

  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`USGS returned ${response.status}`);

  const features: UsgsFeature[] = (await response.json())?.features ?? [];

  return features
    .filter((f) => f.properties.mag !== null)
    .map((f) => {
      const mag = f.properties.mag as number;
      const [lon, lat, depth] = f.geometry.coordinates;
      return {
        id: `usgs-${f.id}`,
        title: `M${mag.toFixed(1)} earthquake`,
        type: magnitudeToType(mag),
        issuer: 'USGS',
        source: 'USGS' as const,
        issuedAt: new Date(f.properties.time).toISOString(),
        message: f.properties.place ?? 'Earthquake near Iloilo',
        details: {
          Magnitude: mag.toFixed(1),
          Depth: `${depth.toFixed(0)} km`,
          Note: `Within ${RADIUS_KM} km of Iloilo. Confirm with PHIVOLCS for official parameters.`,
        },
        latitude: lat,
        longitude: lon,
        url: f.properties.url ?? undefined,
      };
    });
}
