import { getSettings, subscribe, updateSettings } from "../core/settings.js";
import { getLocale, t } from "../core/i18n.js";
import { CityNotFoundError, describeWeather, fetchCurrentWeather, findCity } from "./weather-api.js";
import { showWeatherEffects } from "./weather-effects.js";

const widget = document.getElementById("weather-widget");
const summary = document.getElementById("weather-summary");
const cityInput = document.getElementById("location-input");
const cityButton = document.getElementById("weather-city-btn");
const geolocationButton = document.getElementById("weather-geo-btn");

const CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const EMPTY_SUMMARY = "🌦️ —";

function isCacheFresh(cache, location) {
    return cache !== null
        && Date.now() - cache.fetchedAt < CACHE_MAX_AGE_MS
        && cache.latitude === location.latitude
        && cache.longitude === location.longitude;
}

function placeName(location) {
    if (!location.name) return t("weather_my_location");
    return location.country ? `${location.name}, ${location.country}` : location.name;
}

function showStatus(text) {
    summary.textContent = text;
    showWeatherEffects(widget, []);
}

function showWeather(weather, location) {
    const { emoji, effects } = describeWeather(weather);
    summary.textContent = `${emoji} ${Math.round(weather.temperature)}°C — ${placeName(location)}`;
    showWeatherEffects(widget, effects);
}

async function refreshWeather() {
    const { weather } = getSettings();
    if (!weather.enabled) return;

    let location = weather.location;
    try {
        if (!location && weather.city) {
            location = await findCity(weather.city, getLocale());
            await updateSettings(settings => { settings.weather.location = location; });
        }
        if (!location) {
            showStatus(EMPTY_SUMMARY);
            return;
        }
        if (isCacheFresh(weather.cache, location)) {
            showWeather(weather.cache, location);
            return;
        }

        const current = await fetchCurrentWeather(location);
        await updateSettings(settings => { settings.weather.cache = current; });
        showWeather(current, location);
    } catch (error) {
        console.warn("Could not load weather:", error);
        showStatus(error instanceof CityNotFoundError ? t("weather_city_not_found") : t("weather_load_error"));
    }
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
        console.warn("Could not find city:", error);
        showStatus(error instanceof CityNotFoundError ? t("weather_city_not_found") : t("weather_load_error"));
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
    if (weather.enabled) refreshWeather();
}

export function initWeather() {
    summary.textContent = EMPTY_SUMMARY;
    renderVisibility();

    subscribe(settings => settings.weather.enabled, renderVisibility);
    subscribe(settings => [settings.weather.city, settings.weather.location], () => {
        const { weather } = getSettings();
        cityInput.value = weather.city;
        if (!weather.location && !weather.city) showStatus(EMPTY_SUMMARY);
    });

    cityButton.addEventListener("click", useCity);
    cityInput.addEventListener("keydown", event => {
        if (event.key === "Enter") useCity();
    });
    geolocationButton.addEventListener("click", useGeolocation);
}
