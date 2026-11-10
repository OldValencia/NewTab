/**
 * Open-Meteo (https://open-meteo.com): free weather and geocoding without an API key.
 * Data is licensed CC BY 4.0, attribution is shown in the weather settings section.
 *
 * Open-Meteo can't turn coordinates into a place name, so the "My location" button asks
 * OpenStreetMap's Nominatim once per click (its usage policy allows that; no bulk requests).
 * Data © OpenStreetMap contributors (ODbL), attribution is next to Open-Meteo's.
 */
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REVERSE_GEOCODING_URL = "https://nominatim.openstreetmap.org/reverse";

// From the most to the least specific; the first one the place has is shown.
const PLACE_NAME_FIELDS = ["city", "town", "village", "hamlet", "municipality", "suburb", "county", "state"];

// Today + 5 days: the widget shows 5 columns and drops days that are already over.
const FORECAST_DAYS = 6;

export class CityNotFoundError extends Error {}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
}

const finiteOrNull = value => (Number.isFinite(value) ? value : null);

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

/**
 * Picks a short name from a Nominatim answer.
 * @returns {{ name: string, country: string }} empty strings when the place has no name (e.g. at sea)
 */
export function placeFromNominatim(data) {
    const address = data?.address ?? {};
    const text = value => (typeof value === "string" ? value.trim() : "");
    const name = PLACE_NAME_FIELDS.map(field => text(address[field])).find(Boolean) ?? text(data?.name);
    return { name, country: name ? text(address.country) : "" };
}

/** @returns {Promise<{ name: string, country: string }>} */
export async function findPlaceName({ latitude, longitude }, language) {
    const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(latitude),
        lon: String(longitude),
        zoom: "10", // city level; higher zoom returns streets and houses
        "accept-language": language
    });
    return placeFromNominatim(await fetchJson(`${REVERSE_GEOCODING_URL}?${params}`));
}

function parseDaily(daily) {
    if (!daily || !Array.isArray(daily.time)) return [];
    return daily.time
        .map((date, index) => ({
            date,
            weatherCode: daily.weather_code?.[index],
            max: daily.temperature_2m_max?.[index],
            min: daily.temperature_2m_min?.[index],
            precipitationChance: finiteOrNull(daily.precipitation_probability_max?.[index])
        }))
        .filter(day => [day.weatherCode, day.max, day.min].every(Number.isFinite));
}

/**
 * Current weather and the daily forecast, in °C and km/h (see weather-conditions.js).
 * The shape is the one stored in settings.weather.cache (validated in normalize.js).
 */
export async function fetchForecast({ latitude, longitude }) {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        forecast_days: String(FORECAST_DAYS),
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
        utcOffsetSeconds: finiteOrNull(data.utc_offset_seconds) ?? 0,
        current: {
            temperature: current.temperature_2m,
            feelsLike: finiteOrNull(current.apparent_temperature),
            humidity: finiteOrNull(current.relative_humidity_2m),
            weatherCode: finiteOrNull(current.weather_code) ?? -1,
            windSpeed: finiteOrNull(current.wind_speed_10m) ?? 0,
            isDay: current.is_day !== 0
        },
        daily: parseDaily(data.daily)
    };
}
