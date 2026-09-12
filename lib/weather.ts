import type { WeatherData } from '../types';

export interface WeatherLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export const SINGAPORE: WeatherLocation = { label: 'Singapore', latitude: 1.3521, longitude: 103.8198 };
export const WEATHER_DEADLINE_MS = 10_000;

const CONDITIONS: Record<number, [string, string]> = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌦️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Heavy freezing drizzle', '🌧️'],
  61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Heavy freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '🌨️'], 77: ['Snow grains', '🌨️'],
  80: ['Light rain showers', '🌦️'], 81: ['Rain showers', '🌦️'], 82: ['Heavy rain showers', '🌦️'],
  85: ['Snow showers', '🌨️'], 86: ['Heavy snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Thunderstorm with heavy hail', '⛈️'],
};

export function weatherCondition(weather: WeatherData): [string, string] {
  if (weather.weatherCode === 0 && !weather.isDay) return ['Clear sky', '🌙'];
  return CONDITIONS[weather.weatherCode] ?? ['Unknown conditions', '—'];
}

export function parseWeather(value: unknown): WeatherData {
  const data = value as { current?: Record<string, unknown>; current_units?: Record<string, unknown> } | null;
  const current = data?.current;
  if (!current || data?.current_units?.temperature_2m !== '°C'
    || typeof current.temperature_2m !== 'number' || !Number.isFinite(current.temperature_2m)
    || typeof current.weather_code !== 'number' || !Object.hasOwn(CONDITIONS, current.weather_code)
    || typeof current.time !== 'number' || !Number.isFinite(current.time) || current.time <= 0
    || !Number.isFinite(new Date(current.time * 1000).getTime())
    || (current.is_day !== 0 && current.is_day !== 1)) {
    throw new Error('Weather response is unavailable');
  }
  return { temperature: current.temperature_2m, weatherCode: current.weather_code,
    observedAt: current.time * 1000, isDay: current.is_day === 1 };
}

export async function fetchWeather(location: WeatherLocation, signal: AbortSignal): Promise<WeatherData> {
  if (!Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90
    || !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180) {
    throw new Error('Weather location is unavailable');
  }
  const query = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude),
    current: 'temperature_2m,weather_code,is_day', temperature_unit: 'celsius', timeformat: 'unixtime' });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal });
  if (!response.ok) throw new Error('Weather provider is unavailable');
  return parseWeather(await response.json());
}
