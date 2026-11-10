/**
 * Open-Meteo (https://open-meteo.com): free weather and geocoding without an API key.
 * Data is licensed CC BY 4.0, attribution is shown in the weather settings section.
 */
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export class CityNotFoundError extends Error {}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
}

/** @returns {Promise<{ name, country, latitude, longitude }>} */
export async function findCity(name, language) {
    const params = new URLSearchParams({ name, count: "1", language, format: "json" });
    const data = await fetchJson(`${GEOCODING_URL}?${params}`);
    const place = data.results?.[0];
    if (!place) throw new CityNotFoundError(name);

    return {
        name: place.name ?? name,
        country: place.country ?? "",
        latitude: place.latitude,
        longitude: place.longitude
    };
}

/** @returns {Promise<{ fetchedAt, latitude, longitude, temperature, weatherCode, windSpeed, isDay }>} */
export async function fetchCurrentWeather({ latitude, longitude }) {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: "temperature_2m,weather_code,wind_speed_10m,is_day",
        wind_speed_unit: "kmh",
        timezone: "auto"
    });
    const data = await fetchJson(`${FORECAST_URL}?${params}`);
    const current = data.current;
    if (!current || !Number.isFinite(current.temperature_2m)) throw new Error("Unexpected weather response");

    return {
        fetchedAt: Date.now(),
        latitude,
        longitude,
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        windSpeed: current.wind_speed_10m ?? 0,
        isDay: current.is_day !== 0
    };
}

/** WMO weather codes → emoji (day / night) and widget animations. */
const CONDITIONS = [
    { codes: [0], day: "☀️", night: "🌕" },
    { codes: [1, 2], day: "🌤️", night: "🌥️" },
    { codes: [3], day: "☁️", night: "☁️" },
    { codes: [45, 48], day: "🌫️", night: "🌫️", effects: ["fog"] },
    { codes: [51, 53], day: "🌦️", night: "🌧️", effects: ["rain"] },
    { codes: [55], day: "🌧️", night: "🌧️", effects: ["rain"] },
    { codes: [56, 57], day: "🌧️🧊", night: "🌧️🧊", effects: ["rain", "snow"] },
    { codes: [61, 63], day: "🌧️", night: "🌧️", effects: ["rain"] },
    { codes: [65], day: "🌧️💦", night: "🌧️💦", effects: ["rain"] },
    { codes: [66, 67], day: "🧊🌧️", night: "🧊🌧️", effects: ["rain", "snow"] },
    { codes: [71, 73, 77], day: "❄️", night: "❄️", effects: ["snow"] },
    { codes: [75], day: "❄️❄️", night: "❄️❄️", effects: ["snow"] },
    { codes: [80, 81], day: "🌦️", night: "🌧️", effects: ["rain"] },
    { codes: [82], day: "🌧️💦", night: "🌧️💦", effects: ["rain"] },
    { codes: [85, 86], day: "🌨️", night: "🌨️", effects: ["snow"] },
    { codes: [95], day: "⛈️", night: "🌩️", effects: ["thunder"] },
    { codes: [96, 99], day: "⛈️🧊", night: "🌩️🧊", effects: ["thunder"] }
];

const WINDY_KMH = 30;

export function describeWeather({ weatherCode, isDay, windSpeed }) {
    const condition = CONDITIONS.find(item => item.codes.includes(weatherCode));
    const effects = [...(condition?.effects ?? [])];
    if (windSpeed >= WINDY_KMH) effects.push("wind");

    return {
        emoji: condition ? (isDay ? condition.day : condition.night) : "❔",
        effects
    };
}
