// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    KNOWN_WEATHER_CODES,
    convertSpeed,
    describeWeather,
    formatTemperature,
    localDateAt,
    upcomingDays
} from "../scripts/widgets/weather-conditions.js";
import { placeFromNominatim } from "../scripts/widgets/weather-api.js";
import { normalizeSettings } from "../scripts/core/normalize.js";
import { createDefaultSettings } from "../scripts/core/defaults.js";

const LOCALES = ["en", "ru", "pl", "de", "es", "be", "uk"];
const dictionary = JSON.parse(readFileSync(new URL("../settings/localization.json", import.meta.url), "utf8"));

// Every code Open-Meteo documents for weather_code.
const WMO_CODES = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];

const VALID_CACHE = {
    fetchedAt: 1_700_000_000_000,
    latitude: 52.23,
    longitude: 21.01,
    utcOffsetSeconds: 3600,
    current: { temperature: 4.2, feelsLike: 1.1, humidity: 81, weatherCode: 61, windSpeed: 12, isDay: true },
    daily: [{ date: "2023-11-14", weatherCode: 61, max: 6, min: 2, precipitationChance: 70 }]
};

test("every WMO code has its own description and a translated label", () => {
    assert.deepEqual([...KNOWN_WEATHER_CODES].sort((a, b) => a - b), WMO_CODES);
    for (const code of [...WMO_CODES, -1, 1000]) {
        const { labelKey } = describeWeather({ weatherCode: code, isDay: true, windSpeed: 0 });
        for (const locale of LOCALES) {
            assert.ok(dictionary[labelKey]?.[locale], `${labelKey} is missing "${locale}"`);
        }
    }
});

test("clear sky shows the sun by day and stars at night", () => {
    const day = describeWeather({ weatherCode: 0, isDay: true, windSpeed: 0 });
    const night = describeWeather({ weatherCode: 0, isDay: false, windSpeed: 0 });
    assert.equal(day.icon, "clear-day");
    assert.equal(night.icon, "clear-night");
    assert.deepEqual(day.effects.map(effect => effect.name), ["sun"]);
    assert.deepEqual(night.effects.map(effect => effect.name), ["stars"]);
});

test("precipitation, thunder and wind produce matching animations", () => {
    const names = weather => describeWeather(weather).effects.map(effect => effect.name);
    assert.deepEqual(names({ weatherCode: 65, isDay: true, windSpeed: 0 }), ["clouds", "rain"]);
    assert.deepEqual(names({ weatherCode: 66, isDay: true, windSpeed: 0 }), ["clouds", "rain", "snow"]);
    assert.deepEqual(names({ weatherCode: 99, isDay: true, windSpeed: 0 }), ["clouds", "hail", "thunder"]);
    assert.deepEqual(names({ weatherCode: 3, isDay: true, windSpeed: 45 }), ["clouds", "wind"]);

    const windyRain = describeWeather({ weatherCode: 63, isDay: true, windSpeed: 45 }).effects;
    assert.equal(windyRain.find(effect => effect.name === "rain").windy, true);
    assert.equal(windyRain.find(effect => effect.name === "wind").leaves, false);
});

test("temperatures and wind convert to imperial units", () => {
    assert.equal(formatTemperature(20, "metric"), "20°");
    assert.equal(formatTemperature(20, "imperial"), "68°");
    assert.equal(formatTemperature(-0.4, "metric", { withUnit: true }), "0°C");
    assert.equal(formatTemperature(-40, "imperial", { withUnit: true }), "-40°F");
    assert.equal(formatTemperature(null, "metric"), "—");
    assert.equal(Math.round(convertSpeed(100, "imperial")), 62);
    assert.equal(convertSpeed(100, "metric"), 100);
});

test("the forecast starts from today at the place, not from a stale first day", () => {
    // 23:30 UTC on Nov 14 is already Nov 15 in Warsaw (UTC+1).
    const now = Date.UTC(2023, 10, 14, 23, 30);
    assert.equal(localDateAt(3600, now), "2023-11-15");
    assert.equal(localDateAt(-5 * 3600, now), "2023-11-14");

    const daily = ["2023-11-14", "2023-11-15", "2023-11-16"].map(date => ({ date }));
    assert.deepEqual(upcomingDays(daily, 3600, 5, now).map(day => day.date), ["2023-11-15", "2023-11-16"]);
});

test("new weather settings get defaults that keep the old behavior", () => {
    assert.equal(createDefaultSettings().weather.units, "metric");
    assert.equal(normalizeSettings({ weather: { enabled: true, city: "Warsaw" } }).weather.units, "metric");
    assert.equal(normalizeSettings({ weather: { units: "imperial" } }).weather.units, "imperial");
    assert.equal(normalizeSettings({ weather: { units: "kelvin" } }).weather.units, "metric");
});

test("a valid weather cache is kept, a broken or old-shaped one is dropped", () => {
    assert.deepEqual(normalizeSettings({ weather: { cache: VALID_CACHE } }).weather.cache, VALID_CACHE);

    // Flat shape written by 1.1.0 pre-release builds.
    const flat = { fetchedAt: 1, latitude: 1, longitude: 1, temperature: 1, weatherCode: 0, windSpeed: 1, isDay: true };
    assert.equal(normalizeSettings({ weather: { cache: flat } }).weather.cache, null);

    const brokenCurrent = { ...VALID_CACHE, current: { ...VALID_CACHE.current, temperature: "warm" } };
    assert.equal(normalizeSettings({ weather: { cache: brokenCurrent } }).weather.cache, null);

    const partial = {
        ...VALID_CACHE,
        current: { ...VALID_CACHE.current, feelsLike: undefined, humidity: null },
        daily: [...VALID_CACHE.daily, { date: "tomorrow", weatherCode: 1, max: 1, min: 0 }]
    };
    const normalized = normalizeSettings({ weather: { cache: partial } }).weather.cache;
    assert.equal(normalized.current.feelsLike, null);
    assert.equal(normalized.current.humidity, null);
    assert.equal(normalized.daily.length, 1);
});

test("geolocated places get a short name from OpenStreetMap", () => {
    // Trimmed real answer for 52.23,21.01 with accept-language=ru.
    const warsaw = { name: "Варшава", address: { city: "Варшава", state: "Мазовецкое воеводство", country: "Польша" } };
    assert.deepEqual(placeFromNominatim(warsaw), { name: "Варшава", country: "Польша" });

    const village = { address: { village: "Zalesie", county: "powiat piaseczyński", country: "Polska" } };
    assert.deepEqual(placeFromNominatim(village), { name: "Zalesie", country: "Polska" });

    // At sea Nominatim answers 200 with only an error message.
    assert.deepEqual(placeFromNominatim({ error: "Unable to geocode" }), { name: "", country: "" });
    assert.deepEqual(placeFromNominatim(null), { name: "", country: "" });
});

test("every new weather string exists in all locales", () => {
    const keys = Object.keys(dictionary).filter(key => key.startsWith("weather_"));
    for (const key of keys) {
        for (const locale of LOCALES) assert.ok(dictionary[key][locale], `${key} is missing "${locale}"`);
    }
});
