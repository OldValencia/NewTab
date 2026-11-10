/**
 * WMO weather codes (as returned by Open-Meteo) → text, icon and the animations inside the widget,
 * plus unit conversion. Pure (no DOM) — covered by tests/weather.test.mjs.
 *
 * Weather is always fetched and cached in °C and km/h, so switching units never needs a new request.
 */

/**
 * sky:           "clear" | "partly" | "cloudy" | "fog" — the background behind precipitation
 * precipitation: { type: "rain" | "snow" | "sleet" | "hail", intensity } — intensity 1 = moderate
 * icon:          a name from weather-icons.js; "-day" / "-night" is added when `dayNight` is set
 */
const CONDITIONS = [
    { codes: [0], key: "clear", icon: "clear", dayNight: true, sky: "clear" },
    { codes: [1], key: "mainly_clear", icon: "partly", dayNight: true, sky: "clear" },
    { codes: [2], key: "partly_cloudy", icon: "partly", dayNight: true, sky: "partly" },
    { codes: [3], key: "overcast", icon: "cloudy", sky: "cloudy" },
    { codes: [45, 48], key: "fog", icon: "fog", sky: "fog" },
    { codes: [51, 53, 55], key: "drizzle", icon: "drizzle", sky: "cloudy", precipitation: { type: "rain", intensity: 0.4 } },
    { codes: [56, 57], key: "freezing_drizzle", icon: "sleet", sky: "cloudy", precipitation: { type: "sleet", intensity: 0.5 } },
    { codes: [61], key: "light_rain", icon: "rain", sky: "cloudy", precipitation: { type: "rain", intensity: 0.7 } },
    { codes: [63], key: "rain", icon: "rain", sky: "cloudy", precipitation: { type: "rain", intensity: 1 } },
    { codes: [65], key: "heavy_rain", icon: "heavy-rain", sky: "cloudy", precipitation: { type: "rain", intensity: 1.8 } },
    { codes: [66, 67], key: "freezing_rain", icon: "sleet", sky: "cloudy", precipitation: { type: "sleet", intensity: 1 } },
    { codes: [71], key: "light_snow", icon: "snow", sky: "cloudy", precipitation: { type: "snow", intensity: 0.6 } },
    { codes: [73], key: "snow", icon: "snow", sky: "cloudy", precipitation: { type: "snow", intensity: 1 } },
    { codes: [75], key: "heavy_snow", icon: "heavy-snow", sky: "cloudy", precipitation: { type: "snow", intensity: 1.8 } },
    { codes: [77], key: "snow_grains", icon: "snow", sky: "cloudy", precipitation: { type: "snow", intensity: 0.5 } },
    { codes: [80, 81], key: "rain_showers", icon: "showers", dayNight: true, sky: "partly", precipitation: { type: "rain", intensity: 1 } },
    { codes: [82], key: "heavy_showers", icon: "heavy-rain", sky: "cloudy", precipitation: { type: "rain", intensity: 2 } },
    { codes: [85, 86], key: "snow_showers", icon: "snow", sky: "partly", precipitation: { type: "snow", intensity: 1.2 } },
    { codes: [95], key: "thunderstorm", icon: "thunder", sky: "cloudy", precipitation: { type: "rain", intensity: 1.2 }, thunder: true },
    { codes: [96, 99], key: "thunderstorm_hail", icon: "thunder-hail", sky: "cloudy", precipitation: { type: "hail", intensity: 1 }, thunder: true }
];

const UNKNOWN_CONDITION = { codes: [], key: "unknown", icon: "cloudy", sky: "cloudy" };

export const KNOWN_WEATHER_CODES = CONDITIONS.flatMap(condition => condition.codes);

/** Wind from this speed on gets the wind animation and slanted rain. */
export const WINDY_KMH = 30;

function findCondition(weatherCode) {
    return CONDITIONS.find(condition => condition.codes.includes(weatherCode)) ?? UNKNOWN_CONDITION;
}

function iconName(condition, isDay) {
    if (!condition.dayNight) return condition.icon;
    return `${condition.icon}-${isDay ? "day" : "night"}`;
}

function skyEffects(sky, isDay) {
    const light = isDay ? "sun" : "stars";
    switch (sky) {
        case "clear": return [{ name: light, intensity: 1 }];
        case "partly": return [{ name: light, intensity: 0.6 }, { name: "clouds", intensity: 0.5 }];
        case "cloudy": return [{ name: "clouds", intensity: 1 }];
        case "fog": return [{ name: "fog", intensity: 1 }];
        default: return [];
    }
}

function precipitationEffects(precipitation, windy) {
    if (!precipitation) return [];
    const { type, intensity } = precipitation;
    if (type === "sleet") {
        return [{ name: "rain", intensity: intensity * 0.6, windy }, { name: "snow", intensity: intensity * 0.6 }];
    }
    return [{ name: type, intensity, windy }];
}

/**
 * @param {{ weatherCode: number, isDay: boolean, windSpeed: number }} weather
 * @returns {{ labelKey: string, icon: string, effects: { name: string, intensity: number, windy?: boolean }[] }}
 */
export function describeWeather({ weatherCode, isDay = true, windSpeed = 0 }) {
    const condition = findCondition(weatherCode);
    const windy = windSpeed >= WINDY_KMH;

    const effects = [
        ...skyEffects(condition.sky, isDay),
        ...precipitationEffects(condition.precipitation, windy)
    ];
    if (condition.thunder) effects.push({ name: "thunder", intensity: 1 });
    // Falling snow already drifts; leaves and streaks on top of it are too busy.
    if (windy) effects.push({ name: "wind", intensity: 1, leaves: !condition.precipitation });

    return { labelKey: `weather_condition_${condition.key}`, icon: iconName(condition, isDay), effects };
}

export function convertTemperature(celsius, units) {
    return units === "imperial" ? celsius * 9 / 5 + 32 : celsius;
}

export function convertSpeed(kmh, units) {
    return units === "imperial" ? kmh / 1.609344 : kmh;
}

/** "12°", or "12°C" / "54°F" with `withUnit`. */
export function formatTemperature(celsius, units, { withUnit = false } = {}) {
    if (!Number.isFinite(celsius)) return "—";
    const text = `${Math.round(convertTemperature(celsius, units))}°`;
    if (!withUnit) return text;
    return `${text}${units === "imperial" ? "F" : "C"}`;
}

/** "YYYY-MM-DD" today at the place, from the UTC offset Open-Meteo reported for it. */
export function localDateAt(utcOffsetSeconds, now = Date.now()) {
    return new Date(now + utcOffsetSeconds * 1000).toISOString().slice(0, 10);
}

/** Hours from the current one on (the cache can be up to 30 minutes old). */
export function upcomingHours(hourly, utcOffsetSeconds, count, now = Date.now()) {
    const currentHour = new Date(now + utcOffsetSeconds * 1000).toISOString().slice(0, 13);
    return hourly.filter(hour => hour.time.slice(0, 13) >= currentHour).slice(0, count);
}

/** Forecast days from today on (a stale cache may still start with yesterday). */
export function upcomingDays(daily, utcOffsetSeconds, count, now = Date.now()) {
    const today = localDateAt(utcOffsetSeconds, now);
    return daily.filter(day => day.date >= today).slice(0, count);
}
