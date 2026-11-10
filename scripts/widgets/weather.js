import { getSettings, subscribe, updateSettings } from "../core/settings.js";
import { getLocale, t } from "../core/i18n.js";
import { createElement } from "../core/utils.js";
import { CityNotFoundError, fetchForecast, findCity, findPlaceName } from "./weather-api.js";
import { convertSpeed, describeWeather, formatTemperature, localDateAt, upcomingDays, upcomingHours } from "./weather-conditions.js";
import { createWeatherIcon } from "./weather-icons.js";
import { showWeatherEffects } from "./weather-effects.js";

const widget = document.getElementById("weather-widget");
const summary = document.getElementById("weather-summary");
const details = document.getElementById("weather-details");
const forecast = document.getElementById("weather-forecast");
const hourlyStrip = document.getElementById("weather-hourly");
const cityInput = document.getElementById("location-input");
const cityButton = document.getElementById("weather-city-btn");
const geolocationButton = document.getElementById("weather-geo-btn");

const CACHE_MAX_AGE_MS = 30 * 60 * 1000;
// How often an open tab checks whether the cached weather has become stale.
const STALE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const FORECAST_COLUMNS = 5;
const HOURLY_COLUMNS = 24;
// Below this chance the hourly strip does not mention precipitation, to keep it calm.
const SHOWN_PRECIPITATION_CHANCE = 20;

// Weather loads run one after another, so a slow answer for an old city can't overwrite a new one.
let loadQueue = Promise.resolve();
// Coordinates whose name was already looked up on this page, so a place without a name
// (or a failing service) is asked once per page load, not on every refresh.
const placeNameLookups = new Set();

const sameCoordinates = (a, b) => a !== null && b !== null && a.latitude === b.latitude && a.longitude === b.longitude;

function isCacheFresh(cache, location) {
    // Caches from before the hourly forecast existed are fetched again.
    return sameCoordinates(cache, location) && cache.hourly.length > 0 && Date.now() - cache.fetchedAt < CACHE_MAX_AGE_MS;
}

function placeName(location) {
    if (!location.name) return t("weather_my_location");
    return location.country ? `${location.name}, ${location.country}` : location.name;
}

function formatSpeed(kmh, units) {
    const unitKey = units === "imperial" ? "weather_unit_mph" : "weather_unit_kmh";
    return `${Math.round(convertSpeed(kmh, units))} ${t(unitKey)}`;
}

/** A message instead of the weather (nothing chosen yet, loading, or an error). */
function showStatus(text) {
    summary.replaceChildren(
        createWeatherIcon("cloudy", { className: "weather-icon weather-summary-icon" }),
        createElement("span", { className: "weather-status", text })
    );
    details.replaceChildren();
    hourlyStrip.replaceChildren();
    forecast.replaceChildren();
    showWeatherEffects(widget, []);
}

function renderSummary(current, location, units) {
    const { labelKey, icon } = describeWeather(current);
    const condition = t(labelKey);
    summary.replaceChildren(
        createWeatherIcon(icon, { className: "weather-icon weather-summary-icon", label: condition }),
        createElement("span", {
            className: "weather-temperature",
            text: formatTemperature(current.temperature, units, { withUnit: true })
        }),
        createElement("span", {
            className: "weather-summary-text",
            children: [
                createElement("span", { className: "weather-place", text: placeName(location) }),
                createElement("span", { className: "weather-condition", text: condition })
            ]
        })
    );
}

function detailItem(labelKey, value) {
    return createElement("div", {
        className: "weather-detail",
        children: [
            createElement("span", { className: "weather-detail-label", text: t(labelKey) }),
            createElement("span", { className: "weather-detail-value", text: value })
        ]
    });
}

function renderDetails(cache, units) {
    const { current } = cache;
    const today = upcomingDays(cache.daily, cache.utcOffsetSeconds, 1)[0];
    const items = [
        current.feelsLike !== null && detailItem("weather_feels_like", formatTemperature(current.feelsLike, units)),
        detailItem("weather_wind", formatSpeed(current.windSpeed, units)),
        current.humidity !== null && detailItem("weather_humidity", `${Math.round(current.humidity)}%`),
        today?.precipitationChance != null && detailItem("weather_precipitation", `${today.precipitationChance}%`)
    ];
    details.replaceChildren(...items.filter(Boolean));
}

function dayLabel(date, today) {
    if (date === today) return t("weather_today");
    // Noon UTC keeps the calendar date the same whatever the formatter's time zone is.
    const name = new Intl.DateTimeFormat(getLocale(), { weekday: "short", timeZone: "UTC" })
        .format(new Date(`${date}T12:00:00Z`));
    // Slavic locales give lowercase names ("ср"); next to "Today" they should start with a capital.
    return name.charAt(0).toLocaleUpperCase(getLocale()) + name.slice(1);
}

function renderForecast(cache, units) {
    const today = localDateAt(cache.utcOffsetSeconds);
    const days = upcomingDays(cache.daily, cache.utcOffsetSeconds, FORECAST_COLUMNS);
    forecast.replaceChildren(...days.map(day => {
        const { labelKey, icon } = describeWeather({ weatherCode: day.weatherCode });
        const condition = t(labelKey);
        return createElement("div", {
            className: "weather-day",
            attrs: { title: condition },
            children: [
                createElement("span", { className: "weather-day-name", text: dayLabel(day.date, today) }),
                createWeatherIcon(icon, { label: condition }),
                createElement("span", { className: "weather-day-max", text: formatTemperature(day.max, units) }),
                createElement("span", { className: "weather-day-min", text: formatTemperature(day.min, units) })
            ]
        });
    }));
}

function hourLabel(time, isFirst) {
    if (isFirst) return t("weather_now");
    // The time is the wall clock of the place; formatting it as UTC keeps it unchanged.
    return new Intl.DateTimeFormat(getLocale(), { hour: "numeric", timeZone: "UTC" }).format(new Date(`${time}:00Z`));
}

function renderHourly(cache, units) {
    const hours = upcomingHours(cache.hourly, cache.utcOffsetSeconds, HOURLY_COLUMNS);
    hourlyStrip.replaceChildren(...hours.map((hour, index) => {
        const { labelKey, icon } = describeWeather(hour);
        const condition = t(labelKey);
        const chance = hour.precipitationChance;
        return createElement("div", {
            className: "weather-hour",
            attrs: { title: condition },
            children: [
                createElement("span", { className: "weather-hour-time", text: hourLabel(hour.time, index === 0) }),
                createWeatherIcon(icon, { label: condition }),
                createElement("span", { className: "weather-hour-temp", text: formatTemperature(hour.temperature, units) }),
                createElement("span", {
                    className: "weather-hour-chance",
                    text: chance !== null && chance >= SHOWN_PRECIPITATION_CHANCE ? `${chance}%` : ""
                })
            ]
        });
    }));
}

function showWeather(cache, location, units) {
    renderSummary(cache.current, location, units);
    renderDetails(cache, units);
    renderHourly(cache, units);
    renderForecast(cache, units);
    showWeatherEffects(widget, describeWeather(cache.current).effects);
}

/** Draws whatever the settings hold; fetching is done separately by refreshWeather(). */
function render() {
    const { weather } = getSettings();
    if (!weather.enabled) return;

    if (sameCoordinates(weather.cache, weather.location)) {
        showWeather(weather.cache, weather.location, weather.units);
    } else {
        showStatus("—");
    }
}

function showError(error) {
    console.warn("Could not load weather:", error);
    showStatus(error instanceof CityNotFoundError ? t("weather_city_not_found") : t("weather_load_error"));
}

/**
 * Locations from the geolocation button (also those migrated from 1.0.x) have only coordinates.
 * Until a name is found the widget says "My location".
 */
async function nameUnnamedLocation(location) {
    const key = `${location.latitude},${location.longitude}`;
    if (location.name || placeNameLookups.has(key)) return;
    placeNameLookups.add(key);

    try {
        const { name, country } = await findPlaceName(location, getLocale());
        if (!name) return;
        await updateSettings(settings => {
            const current = settings.weather.location;
            if (!sameCoordinates(current, location) || current.name) return; // another place was chosen meanwhile
            settings.weather.location = { ...current, name, country };
        });
    } catch (error) {
        console.warn("Could not find the name of the location:", error);
    }
}

async function loadWeather() {
    const { weather } = getSettings();
    if (!weather.enabled) return;

    let location = weather.location;
    try {
        if (!location && weather.city) {
            location = await findCity(weather.city, getLocale());
            await updateSettings(settings => { settings.weather.location = location; });
        }
        if (!location) return;
        nameUnnamedLocation(location); // in parallel with the forecast; failures only keep "My location"
        if (isCacheFresh(getSettings().weather.cache, location)) return;

        const result = await fetchForecast(location);
        if (!sameCoordinates(result, getSettings().weather.location)) return; // another place was chosen meanwhile
        await updateSettings(settings => { settings.weather.cache = result; });
    } catch (error) {
        // Offline or the API is down: keep showing the last known weather for this place.
        if (sameCoordinates(getSettings().weather.cache, location)) {
            console.warn("Could not refresh weather, showing the cached one:", error);
            return;
        }
        showError(error);
    }
}

/** Fetches new weather when the cached one is missing or stale. Safe to call often. */
function refreshWeather() {
    loadQueue = loadQueue.then(loadWeather);
    return loadQueue;
}

async function useCity() {
    const city = cityInput.value.trim();
    if (!city) return;

    try {
        const location = await findCity(city, getLocale());
        await updateSettings(settings => {
            settings.weather.city = city;
            settings.weather.location = location;
            settings.weather.cache = null;
        });
        await refreshWeather();
    } catch (error) {
        showError(error);
    }
}

function useGeolocation() {
    if (!navigator.geolocation) {
        showStatus(t("weather_geolocation_unsupported"));
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
            await updateSettings(settings => {
                settings.weather.city = "";
                settings.weather.location = { latitude: coords.latitude, longitude: coords.longitude, name: "", country: "" };
                settings.weather.cache = null;
            });
            cityInput.value = "";
            await refreshWeather();
        },
        () => showStatus(t("weather_geolocation_denied"))
    );
}

function renderVisibility() {
    const { weather } = getSettings();
    widget.hidden = !weather.enabled;
    cityInput.value = weather.city;
    render();
    if (weather.enabled) refreshWeather();
}

function refreshIfVisible() {
    if (!document.hidden) refreshWeather();
}

export function initWeather() {
    renderVisibility();

    subscribe(settings => settings.weather.enabled, renderVisibility);
    subscribe(settings => settings.weather.city, settings => { cityInput.value = settings.weather.city; });
    // Also covers weather fetched by another open tab and the units switch in the sidebar.
    subscribe(settings => {
        const { location, cache, units } = settings.weather;
        return [location, cache, units];
    }, render);

    cityButton.addEventListener("click", useCity);
    cityInput.addEventListener("keydown", event => {
        if (event.key === "Enter") useCity();
    });
    geolocationButton.addEventListener("click", useGeolocation);
    // A mouse wheel scrolls the hourly strip sideways.
    hourlyStrip.addEventListener("wheel", event => {
        if (event.deltaX !== 0 || event.deltaY === 0) return;
        event.preventDefault();
        hourlyStrip.scrollLeft += event.deltaY;
    }, { passive: false });

    // A new tab can stay open for days; keep the weather (and day/night) current.
    document.addEventListener("visibilitychange", refreshIfVisible);
    setInterval(refreshIfVisible, STALE_CHECK_INTERVAL_MS);
}
