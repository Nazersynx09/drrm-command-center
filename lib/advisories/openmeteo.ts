import type { AdvisoryData } from './types';

// Free, keyless forecast data (CC BY 4.0, free for non-commercial use): https://open-meteo.com
// These are model outlooks, not official warnings. Check PAGASA for official bulletins.
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const LAT = Number(process.env.FORECAST_LAT ?? 10.7202); // Iloilo City
const LON = Number(process.env.FORECAST_LON ?? 122.5621);

type DailyForecast = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: (number | null)[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
};

const WEATHER_TEXT: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

// Daily thresholds used to flag a day. They are heuristics for this dashboard, not PAGASA criteria.
function classify(rainMm: number, windKph: number): AdvisoryData['type'] {
  if (rainMm >= 200 || windKph >= 89) return 'Critical';
  if (rainMm >= 100 || windKph >= 62) return 'Warning';
  return 'Info';
}

export async function getOpenMeteoAdvisories(): Promise<AdvisoryData[]> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(LAT));
  url.searchParams.set('longitude', String(LON));
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
    ].join(','),
  );
  url.searchParams.set('timezone', 'Asia/Manila');
  url.searchParams.set('forecast_days', '3');

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);

  const daily = (await response.json())?.daily as DailyForecast | undefined;
  if (!daily?.time?.length) return [];

  const issuedAt = new Date().toISOString();

  return daily.time
    .map((date, i): AdvisoryData | null => {
      const rain = daily.precipitation_sum[i] ?? 0;
      const wind = daily.wind_speed_10m_max[i] ?? 0;
      const gust = daily.wind_gusts_10m_max[i] ?? 0;
      const type = classify(rain, wind);

      // Always show today; only show later days when they are worth flagging.
      if (i > 0 && type === 'Info') return null;

      const summary = WEATHER_TEXT[daily.weather_code[i]] ?? 'Mixed conditions';
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date;

      return {
        id: `open-meteo-${date}`,
        title: `${label}: ${summary}`,
        type,
        issuer: 'Open-Meteo model forecast',
        source: 'Open-Meteo',
        issuedAt,
        message: `Expected rainfall ${rain.toFixed(0)} mm, winds up to ${wind.toFixed(0)} km/h (gusts ${gust.toFixed(0)} km/h) for Iloilo.`,
        details: {
          Date: date,
          'Rainfall total': `${rain.toFixed(1)} mm`,
          'Rain probability': `${daily.precipitation_probability_max[i] ?? 'n/a'}%`,
          'Max wind': `${wind.toFixed(0)} km/h`,
          'Max gust': `${gust.toFixed(0)} km/h`,
          Temperature: `${daily.temperature_2m_min[i]}–${daily.temperature_2m_max[i]} °C`,
          Note: 'Model forecast, not an official PAGASA warning. Weather data by Open-Meteo.com (CC BY 4.0).',
        },
        latitude: LAT,
        longitude: LON,
        url: 'https://open-meteo.com',
      };
    })
    .filter((a): a is AdvisoryData => a !== null);
}
