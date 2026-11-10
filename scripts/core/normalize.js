/**
 * Turns any stored/imported settings object into a valid current-schema object.
 * Missing or malformed values fall back to defaults, so the rest of the code can trust the shape.
 * Pure (no DOM / browser APIs) — covered by tests/settings.test.mjs.
 */
import { isHexColor, normalizeHexColor } from "./color.js";
import { clamp, isPlainObject, isValidHttpUrl } from "./utils.js";
import { DATE_FORMATS, TIME_FORMATS, normalizeTimeZone } from "./time-format.js";
import {
    BACKGROUND_MODES,
    CLOCK_DATE_SIZE,
    CLOCK_LAYOUTS,
    CLOCK_STYLES,
    CLOCK_TIME_SIZE,
    MAX_CLOCK_LABEL_LENGTH,
    MAX_CLOCKS,
    MAX_LINKS,
    SCHEMA_VERSION,
    createDefaultSettings,
    getDefaultClock
} from "./defaults.js";
import { EFFECTS } from "../backgrounds/registry.js";
import { SUPPORTED_LOCALE_CODES } from "./locales.js";

export const IMAGE_FITS = ["cover", "contain", "repeat", "stretch", "center"];
export const PHOTO_INTERVALS = ["onload", "3", "5", "15", "30", "60", "never"];
export const WEATHER_UNITS = ["metric", "imperial"];

function toBoolean(value, fallback) {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return fallback;
}

function toNumber(value, fallback) {
    if (typeof value === "string" && value.trim() === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

/**
 * Recursively coerces `value` to the shape of `defaultValue`.
 * Arrays and `null` defaults are returned as-is when the raw value has the right kind; callers validate them.
 */
function coerce(defaultValue, value) {
    if (isPlainObject(defaultValue)) {
        const source = isPlainObject(value) ? value : {};
        const result = {};
        for (const [key, nested] of Object.entries(defaultValue)) {
            result[key] = coerce(nested, source[key]);
        }
        return result;
    }
    if (Array.isArray(defaultValue)) return Array.isArray(value) ? value : structuredClone(defaultValue);
    if (defaultValue === null) return value ?? null;
    if (typeof defaultValue === "boolean") return toBoolean(value, defaultValue);
    if (typeof defaultValue === "number") return toNumber(value, defaultValue);
    if (typeof defaultValue === "string") {
        if (isHexColor(defaultValue)) return normalizeHexColor(value, defaultValue);
        return typeof value === "string" ? value : defaultValue;
    }
    return value ?? defaultValue;
}

function oneOf(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}

function normalizeShadow(shadow) {
    return {
        ...shadow,
        opacity: clamp(shadow.opacity, 0, 1),
        blur: clamp(shadow.blur, 0, 20),
        offsetX: Math.round(clamp(shadow.offsetX, -50, 50)),
        offsetY: Math.round(clamp(shadow.offsetY, -50, 50))
    };
}

/**
 * Fonts that are no longer bundled → their replacement.
 * SF Pro Display (Apple's license does not allow redistribution) was the default until 1.0.x;
 * Inter is the closest open font.
 */
const REPLACED_FONTS = { "SF Pro Display": "Inter" };

function normalizeFont(font, fallback) {
    const trimmed = font.trim();
    return REPLACED_FONTS[trimmed] ?? (trimmed || fallback);
}

function normalizeClock(rawClock, mode) {
    const defaults = getDefaultClock(mode);
    const clock = coerce(defaults, rawClock);
    clock.timeFont = normalizeFont(clock.timeFont, defaults.timeFont);
    clock.dateFont = normalizeFont(clock.dateFont, defaults.dateFont);
    clock.timeFormat = oneOf(clock.timeFormat, TIME_FORMATS, defaults.timeFormat);
    clock.dateFormat = oneOf(clock.dateFormat, DATE_FORMATS, defaults.dateFormat);
    clock.timezone = normalizeTimeZone(isPlainObject(rawClock) ? rawClock.timezone : undefined);
    clock.timeShadow = normalizeShadow(clock.timeShadow);
    clock.dateShadow = normalizeShadow(clock.dateShadow);
    clock.style = oneOf(clock.style, CLOCK_STYLES, defaults.style);
    clock.timeSize = Math.round(clamp(clock.timeSize, CLOCK_TIME_SIZE.min, CLOCK_TIME_SIZE.max));
    clock.dateSize = Math.round(clamp(clock.dateSize, CLOCK_DATE_SIZE.min, CLOCK_DATE_SIZE.max));
    clock.label = clock.label.slice(0, MAX_CLOCK_LABEL_LENGTH);
    return clock;
}

function normalizeTheme(theme, rawTheme, mode) {
    const rawClocks = isPlainObject(rawTheme) && Array.isArray(rawTheme.clocks) ? rawTheme.clocks : [];
    const clocks = rawClocks.slice(0, MAX_CLOCKS).map(rawClock => normalizeClock(rawClock, mode));
    return {
        ...theme,
        clocksLayout: oneOf(theme.clocksLayout, CLOCK_LAYOUTS, "row"),
        clocks: clocks.length > 0 ? clocks : [getDefaultClock(mode)]
    };
}

function normalizeEffectParams(effect, params) {
    const result = { ...params };
    for (const control of effect.controls) {
        if (control.type === "range") {
            result[control.param] = clamp(result[control.param], control.min, control.max);
        }
    }
    return result;
}

function normalizeLinkItem(item) {
    if (!isPlainObject(item)) return null;
    const link = {
        url: typeof item.url === "string" ? item.url.trim() : "",
        label: typeof item.label === "string" ? item.label : ""
    };
    if (typeof item.icon === "string" && item.icon.startsWith("data:image/")) {
        link.icon = item.icon;
    }
    return link;
}

function normalizePhoto(photo) {
    if (!isPlainObject(photo) || !isValidHttpUrl(photo.url)) return null;
    const text = value => typeof value === "string" ? value : "";
    return {
        url: photo.url,
        author: text(photo.author),
        sourceUrl: isValidHttpUrl(photo.sourceUrl) ? photo.sourceUrl : "",
        license: text(photo.license),
        licenseUrl: isValidHttpUrl(photo.licenseUrl) ? photo.licenseUrl : ""
    };
}

function normalizeLocation(location) {
    if (!isPlainObject(location)) return null;
    const latitude = toNumber(location.latitude, NaN);
    const longitude = toNumber(location.longitude, NaN);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return {
        latitude: clamp(latitude, -90, 90),
        longitude: clamp(longitude, -180, 180),
        name: typeof location.name === "string" ? location.name : "",
        country: typeof location.country === "string" ? location.country : ""
    };
}

const finiteOrNull = value => (Number.isFinite(value) ? value : null);
const allFinite = (...values) => values.every(Number.isFinite);

function normalizeForecastDay(day) {
    if (!isPlainObject(day) || typeof day.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) return null;
    if (!allFinite(day.weatherCode, day.max, day.min)) return null;
    return {
        date: day.date,
        weatherCode: day.weatherCode,
        max: day.max,
        min: day.min,
        precipitationChance: finiteOrNull(day.precipitationChance)
    };
}

function normalizeForecastHour(hour) {
    if (!isPlainObject(hour) || typeof hour.time !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(hour.time)) return null;
    if (!allFinite(hour.weatherCode, hour.temperature)) return null;
    return {
        time: hour.time,
        weatherCode: hour.weatherCode,
        temperature: hour.temperature,
        precipitationChance: finiteOrNull(hour.precipitationChance),
        isDay: hour.isDay !== false
    };
}

/**
 * Last weather response (see fetchForecast() in widgets/weather-api.js). It is only a cache:
 * anything unexpected — including the flat shape of 1.1.0 pre-release builds — becomes null
 * and is simply fetched again.
 */
function normalizeWeatherCache(cache) {
    if (!isPlainObject(cache) || !isPlainObject(cache.current)) return null;
    const { current } = cache;
    if (!allFinite(cache.fetchedAt, cache.latitude, cache.longitude)) return null;
    if (!allFinite(current.temperature, current.weatherCode, current.windSpeed)) return null;

    return {
        fetchedAt: cache.fetchedAt,
        latitude: cache.latitude,
        longitude: cache.longitude,
        utcOffsetSeconds: finiteOrNull(cache.utcOffsetSeconds) ?? 0,
        current: {
            temperature: current.temperature,
            feelsLike: finiteOrNull(current.feelsLike),
            humidity: finiteOrNull(current.humidity),
            weatherCode: current.weatherCode,
            windSpeed: current.windSpeed,
            isDay: current.isDay !== false
        },
        hourly: Array.isArray(cache.hourly) ? cache.hourly.map(normalizeForecastHour).filter(Boolean).slice(0, 48) : [],
        daily: Array.isArray(cache.daily) ? cache.daily.map(normalizeForecastDay).filter(Boolean).slice(0, 16) : []
    };
}

export function normalizeSettings(raw) {
    const defaults = createDefaultSettings();
    const source = isPlainObject(raw) ? raw : {};
    const settings = coerce(defaults, source);

    settings.schemaVersion = SCHEMA_VERSION;
    settings.locale = oneOf(settings.locale, SUPPORTED_LOCALE_CODES, defaults.locale);

    const background = settings.background;
    background.mode = oneOf(background.mode, BACKGROUND_MODES, "stars");
    for (const effect of EFFECTS) {
        background.effects[effect.id] = normalizeEffectParams(effect, background.effects[effect.id]);
    }

    const filters = background.imageFilters;
    filters.blur = clamp(filters.blur, 0, 40);
    filters.brightness = clamp(filters.brightness, 20, 150);
    filters.vignette = clamp(filters.vignette, 0, 100);
    filters.fit = oneOf(filters.fit, IMAGE_FITS, "cover");

    const photo = background.onlinePhoto;
    photo.query = photo.query.trim();
    photo.interval = oneOf(String(photo.interval), PHOTO_INTERVALS, "onload");
    photo.current = normalizePhoto(photo.current);
    photo.queue = photo.queue.map(normalizePhoto).filter(Boolean).slice(0, 50);

    const photoOfTheDay = background.photoOfTheDay;
    photoOfTheDay.photo = normalizePhoto(photoOfTheDay.photo);
    photoOfTheDay.date = /^\d{4}-\d{2}-\d{2}$/.test(photoOfTheDay.date) && photoOfTheDay.photo ? photoOfTheDay.date : "";

    for (const mode of BACKGROUND_MODES) {
        settings.themes[mode] = normalizeTheme(settings.themes[mode], source.themes?.[mode], mode);
    }

    const links = settings.links;
    links.items = links.items.map(normalizeLinkItem).filter(Boolean).slice(0, MAX_LINKS);
    links.columns = Math.round(clamp(links.columns, 1, 10));

    const weather = settings.weather;
    weather.city = weather.city.trim();
    weather.location = normalizeLocation(weather.location);
    weather.units = oneOf(weather.units, WEATHER_UNITS, defaults.weather.units);
    weather.cache = normalizeWeatherCache(weather.cache);

    const bookmarks = settings.bookmarks;
    bookmarks.pinned = [...new Set(bookmarks.pinned.filter(id => typeof id === "string" && id !== ""))];

    return settings;
}

/** Returns the clock/link styling of the active background. */
export function getActiveTheme(settings) {
    return settings.themes[settings.background.mode];
}
