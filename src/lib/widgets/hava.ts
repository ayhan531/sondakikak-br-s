/**
 * KKTC şehirleri için canlı hava durumu.
 * Kaynak: Open-Meteo (open-meteo.com) — anahtarsız, ücretsiz, gerçek zamanlı model verisi.
 */

import { cached } from "./cache";

export type CityWeather = {
  city: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  code: number;
  description: string;
  emoji: string;
  todayMin: number;
  todayMax: number;
  tomorrowMin: number;
  tomorrowMax: number;
  tomorrowCode: number;
};

export type WeatherData = {
  updatedAt: string;
  cities: CityWeather[];
};

const CITIES = [
  { name: "Lefkoşa", lat: 35.185, lon: 33.382 },
  { name: "Girne", lat: 35.341, lon: 33.319 },
  { name: "Gazimağusa", lat: 35.125, lon: 33.941 },
  { name: "Güzelyurt", lat: 35.198, lon: 32.993 },
  { name: "İskele", lat: 35.286, lon: 33.891 },
  { name: "Lefke", lat: 35.11, lon: 32.849 },
];

/** WMO hava kodu → Türkçe açıklama + simge */
export function describeWeather(code: number): { description: string; emoji: string } {
  if (code === 0) return { description: "Açık", emoji: "☀️" };
  if (code === 1) return { description: "Az bulutlu", emoji: "🌤️" };
  if (code === 2) return { description: "Parçalı bulutlu", emoji: "⛅" };
  if (code === 3) return { description: "Çok bulutlu", emoji: "☁️" };
  if (code === 45 || code === 48) return { description: "Sisli", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { description: "Çisenti", emoji: "🌦️" };
  if (code >= 61 && code <= 67) return { description: "Yağmurlu", emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { description: "Karlı", emoji: "🌨️" };
  if (code >= 80 && code <= 82) return { description: "Sağanak yağış", emoji: "🌦️" };
  if (code === 85 || code === 86) return { description: "Kar sağanağı", emoji: "🌨️" };
  if (code >= 95) return { description: "Gök gürültülü fırtına", emoji: "⛈️" };
  return { description: "Bilinmiyor", emoji: "🌡️" };
}

type MeteoResult = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
};

/** 15 dakikalık önbellekle 6 şehrin hava durumunu getirir. */
export async function getWeather(): Promise<WeatherData | null> {
  return cached("hava", 15 * 60 * 1000, async () => {
    const lats = CITIES.map((c) => c.lat).join(",");
    const lons = CITIES.map((c) => c.lon).join(",");
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
      `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=Asia%2FNicosia&forecast_days=2`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;

    const json = (await res.json()) as MeteoResult | MeteoResult[];
    const results = Array.isArray(json) ? json : [json];
    if (results.length !== CITIES.length) return null;

    const cities: CityWeather[] = [];
    for (let i = 0; i < CITIES.length; i++) {
      const r = results[i];
      const cur = r.current;
      const daily = r.daily;
      if (!cur || typeof cur.temperature_2m !== "number") continue;
      const code = cur.weather_code ?? 0;
      const { description, emoji } = describeWeather(code);
      cities.push({
        city: CITIES[i].name,
        temperature: Math.round(cur.temperature_2m),
        humidity: Math.round(cur.relative_humidity_2m ?? 0),
        windSpeed: Math.round(cur.wind_speed_10m ?? 0),
        code,
        description,
        emoji,
        todayMin: Math.round(daily?.temperature_2m_min?.[0] ?? cur.temperature_2m),
        todayMax: Math.round(daily?.temperature_2m_max?.[0] ?? cur.temperature_2m),
        tomorrowMin: Math.round(daily?.temperature_2m_min?.[1] ?? cur.temperature_2m),
        tomorrowMax: Math.round(daily?.temperature_2m_max?.[1] ?? cur.temperature_2m),
        tomorrowCode: daily?.weather_code?.[1] ?? code,
      });
    }

    if (!cities.length) return null;
    return { updatedAt: new Date().toISOString(), cities };
  });
}
