/**
 * Open-Meteo provider — a second, unrelated data domain.
 *
 * It exists to prove the point that the catalog, not the domain, is what bounds
 * the agent: the same fifteen components render a weather widget and a
 * repository widget with no new client code.
 *
 * No API key required. Note that some sandboxed environments block
 * open-meteo.com; the GitHub provider is the one used by the default demo.
 */

import { ProviderError } from './github';

const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'cloud' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'cloud' },
  48: { label: 'Freezing fog', icon: 'cloud' },
  51: { label: 'Light drizzle', icon: 'rain' },
  53: { label: 'Drizzle', icon: 'rain' },
  55: { label: 'Heavy drizzle', icon: 'rain' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  71: { label: 'Light snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  80: { label: 'Rain showers', icon: 'rain' },
  81: { label: 'Rain showers', icon: 'rain' },
  82: { label: 'Violent rain showers', icon: 'rain' },
  95: { label: 'Thunderstorm', icon: 'rain' },
  96: { label: 'Thunderstorm with hail', icon: 'rain' },
  99: { label: 'Thunderstorm with hail', icon: 'rain' },
};

export interface WeatherDay {
  date: string;
  max: number;
  min: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export interface WeatherReport {
  location: string;
  country: string;
  unit: 'celsius' | 'fahrenheit';
  unitSymbol: '°C' | '°F';
  temperature: number;
  apparent: number;
  humidity: number;
  wind: number;
  condition: string;
  icon: string;
  days: WeatherDay[];
  fetchedAt: string;
}

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new ProviderError(`Weather service responded with ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export async function getWeather(
  location: string,
  { unit = 'celsius', days = 3 }: { unit?: 'celsius' | 'fahrenheit'; days?: number } = {},
): Promise<WeatherReport> {
  const geo = await json<{ results?: Record<string, any>[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`,
  );
  const place = geo.results?.[0];
  if (!place) throw new ProviderError(`No place called "${location}" was found.`);

  const forecastDays = Math.min(Math.max(days, 1), 7);
  const forecast = await json<Record<string, any>>(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
      `&forecast_days=${forecastDays}&timezone=auto&temperature_unit=${unit}`,
  );

  const current = forecast.current ?? {};
  const daily = forecast.daily ?? {};
  const code = WEATHER_CODES[current.weather_code] ?? { label: 'Unknown', icon: 'cloud' };

  return {
    location: place.name,
    country: place.country ?? '',
    unit,
    unitSymbol: unit === 'celsius' ? '°C' : '°F',
    temperature: Math.round(current.temperature_2m),
    apparent: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    wind: Math.round(current.wind_speed_10m),
    condition: code.label,
    icon: code.icon,
    days: (daily.time ?? []).map((date: string, index: number) => {
      const dayCode = WEATHER_CODES[daily.weather_code?.[index]] ?? { label: 'Unknown', icon: 'cloud' };
      return {
        date,
        max: Math.round(daily.temperature_2m_max?.[index]),
        min: Math.round(daily.temperature_2m_min?.[index]),
        condition: dayCode.label,
        icon: dayCode.icon,
        precipitation: daily.precipitation_probability_max?.[index] ?? 0,
      };
    }),
    fetchedAt: new Date().toISOString(),
  };
}
