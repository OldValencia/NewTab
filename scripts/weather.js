const weatherSummary = document.getElementById("weather-summary");
const weatherInput = document.getElementById("location-input");
const cityBtn = document.getElementById("weather-city-btn");
const geoBtn = document.getElementById("weather-geo-btn");

const DEFAULT_WEATHER_SUMMARY_VALUE = "🌦️ —";
const CACHE_DURATION_MS = 60 * 60 * 1000;

function loadCachedWeather() {
    const {cachedWeather} = loadCustomSettings();
    if (!cachedWeather) return false;

    const {data, timestamp} = JSON.parse(cachedWeather);
    if (Date.now() - timestamp < CACHE_DURATION_MS) {
        updateWeather(data);
        return true;
    }
    return false;
}

function applyWeatherVisibilitySetting() {
    const settings = loadCustomSettings();
    if (settings.showWeather === undefined || settings.showWeather === null) {
        settings.showWeather = false;
    }
    toggleWeatherWidget.checked = settings.showWeather;
    weatherWidget.style.display = settings.showWeather ? "block" : "none";
}

function saveWeatherData(data, city) {
    const settings = loadCustomSettings();
    settings.cachedWeather = JSON.stringify({data, timestamp: Date.now()});
    settings.weatherCity = city;
    saveCustomSettings(settings);
}

function loadSavedCity() {
    const {weatherCity} = loadCustomSettings();
    if (weatherCity) {
        weatherInput.value = weatherCity;
        fetchWeatherByCity(weatherCity);
    }
}

function fetchWeatherByCity(city) {
    fetchWeather(`q=${encodeURIComponent(city)}`, city);
}

function getWeatherByCity() {
    const city = weatherInput.value.trim();
    if (city) fetchWeatherByCity(city);
}

function getWeatherByGeolocation() {
    if (!navigator.geolocation) {
        weatherSummary.textContent = "Geolocation is not supported";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        ({coords: {latitude, longitude}}) => {
            const location = `${latitude},${longitude}`;
            fetchWeather(`q=${location}`, location);
        },
        () => weatherSummary.textContent = "Access to geolocation is prohibited"
    );
}

function fetchWeather(query, cityLabel) {
    fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&${query}&aqi=no`)
        .then(res => res.json())
        .then(data => {
            updateWeather(data);
            saveWeatherData(data, cityLabel);
        })
        .catch(() => weatherSummary.textContent = "Load error");
}

function updateWeather(data) {
    const {showWeather = true} = loadCustomSettings();
    if (!showWeather) return;

    const emoji = getWeatherEmoji(data.current.condition.code);
    const temp = Math.round(data.current.temp_c);
    const {name: city, country} = data.location;
    weatherSummary.textContent = `${emoji} ${temp}°C — ${city}, ${country}`;

    const bg = window.getComputedStyle(document.body).backgroundColor;
    weatherSummary.style.color = getBrightness(bg) < 128 ? "#fff" : "#000";

    applyWeatherVisibilitySetting();
}

function getWeatherEmoji(code) {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18

    const emojiMap = {
        clear: { codes: [1000], day: "☀️", night: "🌕" },
        partlyCloudy: { codes: [1003], day: "🌤️", night: "🌥️" },
        cloudy: { codes: [1006, 1009], day: "☁️", night: "☁️" },
        mist: { codes: [1030], day: "🌁", night: "🌁" },
        patchyRain: { codes: [1063, 1180, 1273], day: "🌦️", night: "🌧️" },
        patchySnow: { codes: [1066, 1210, 1279], day: "❄️", night: "❄️" },
        patchySleet: { codes: [1069], day: "🌨️🧊", night: "🌨️🧊" },
        patchyFreezingDrizzle: { codes: [1072], day: "🌧️🧊", night: "🌧️🧊" },
        thunder: { codes: [1087, 1276, 1282], day: "⛈️", night: "🌩️" },
        blowingSnow: { codes: [1114], day: "🌬️❄️", night: "🌬️❄️" },
        blizzard: { codes: [1117], day: "🌬️❄️", night: "🌬️❄️" },
        fog: { codes: [1135, 1147], day: "🌫️", night: "🌫️" },
        drizzle: { codes: [1150, 1153], day: "🌦️", night: "🌧️" },
        freezingDrizzle: { codes: [1168, 1171], day: "🌧️🧊", night: "🌧️🧊" },
        lightRain: { codes: [1183, 1240], day: "🌧️", night: "🌧️" },
        moderateRain: { codes: [1186, 1189, 1243], day: "🌧️", night: "🌧️" },
        heavyRain: { codes: [1192, 1195, 1246], day: "🌧️💦", night: "🌧️💦" },
        freezingRain: { codes: [1198, 1201], day: "🧊🌧️", night: "🧊🌧️" },
        lightSleet: { codes: [1204], day: "🌨️🧊", night: "🌨️🧊" },
        heavySleet: { codes: [1207], day: "🌨️🧊", night: "🌨️🧊" },
        lightSnow: { codes: [1213], day: "❄️", night: "❄️" },
        moderateSnow: { codes: [1216, 1219], day: "❄️", night: "❄️" },
        heavySnow: { codes: [1222, 1225], day: "❄️❄️", night: "❄️❄️" },
        icePellets: { codes: [1237], day: "🧊", night: "🧊" },
        showerRain: { codes: [1240, 1243, 1246], day: "🌦️", night: "🌧️" },
        showerSleet: { codes: [1249, 1252], day: "🌨️🧊", night: "🌨️🧊" },
        showerSnow: { codes: [1255, 1258], day: "🌨️", night: "🌨️" },
        showerIce: { codes: [1261, 1264], day: "🧊🌨️", night: "🧊🌨️" },
        thunderRain: { codes: [1273, 1276], day: "⛈️", night: "🌩️" },
        thunderSnow: { codes: [1279, 1282], day: "🌩️❄️", night: "🌩️❄️" }
    };
    for (const key in emojiMap) {
        if (emojiMap[key].codes.includes(code)) {
            return isDay ? emojiMap[key].day : emojiMap[key].night;
        }
    }

    return "❔";
}

function getBrightness(rgb) {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return (r * 299 + g * 587 + b * 114) / 1000;
}

cityBtn.addEventListener("click", getWeatherByCity);
geoBtn.addEventListener("click", getWeatherByGeolocation);

document.addEventListener("DOMContentLoaded", () => {
    applyWeatherVisibilitySetting();
    if (!loadCachedWeather()) loadSavedCity();
});
