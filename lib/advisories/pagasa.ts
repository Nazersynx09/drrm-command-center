import type { AdvisoryData } from './types';

const BASE_URL = 'https://tenday.pagasa.dost.gov.ph/api/v1';

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.forecast)) return value.forecast;
  if (Array.isArray(value?.forecasts)) return value.forecasts;
  return [];
}

function first(obj: any, keys: string[]) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function toNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function getPagasaAdvisories(): Promise<AdvisoryData[]> {
  const token = process.env.PAGASA_API_TOKEN;
  if (!token) return [];

  const url = new URL(`${BASE_URL}/tenday/current`);
  url.searchParams.set('province', process.env.PAGASA_PROVINCE ?? 'Iloilo');
  url.searchParams.set('page', 'none');
  url.searchParams.set('token', token);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`PAGASA returned ${response.status}`);

  const payload = await response.json();
  const rows = asArray(payload);

  return rows.slice(0, 20).map((row: any, index: number) => {
    const location = first(row, ['municity', 'municipality', 'city', 'location', 'name']) ?? 'Iloilo';
    const rainfall = first(row, ['rainfall', 'rainfallAmount', 'rainfall_amount']);
    const temperature = first(row, ['temperature', 'temp']);
    const humidity = first(row, ['humidity', 'relativeHumidity']);
    const wind = first(row, ['wind', 'windSpeed', 'wind_speed']);
    const issuedAt =
      first(row, ['date', 'datetime', 'forecastDate', 'forecast_date']) ?? new Date().toISOString();

    return {
      id: `pagasa-${index}-${String(location).replace(/\W+/g, '-').toLowerCase()}`,
      title: `PAGASA Weather Forecast — ${location}`,
      type: 'Info',
      issuer: 'PAGASA',
      source: 'PAGASA',
      issuedAt: new Date(issuedAt).toISOString(),
      message: `Current forecast information for ${location}, Iloilo. This is forecast data and should not be treated as a replacement for an official PAGASA warning or bulletin.`,
      details: {
        Location: String(location),
        ...(rainfall != null ? { Rainfall: String(rainfall) } : {}),
        ...(temperature != null ? { Temperature: String(temperature) } : {}),
        ...(humidity != null ? { Humidity: String(humidity) } : {}),
        ...(wind != null ? { Wind: String(wind) } : {}),
      },
      latitude: toNumber(first(row, ['latitude', 'lat'])),
      longitude: toNumber(first(row, ['longitude', 'lng', 'lon'])),
      url: 'https://tenday.pagasa.dost.gov.ph/',
    };
  });
}
