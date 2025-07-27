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
    const emojiMap = {
        clear: [1000],
        partlyCloudy: [1003],
        cloudy: [1006, 1009],
        mist: [1030],
        fog: [1135, 1147],
        drizzle: [1150, 1153, 1168, 1171],
        lightRain: [1180, 1183, 1240],
        moderateRain: [1186, 1189, 1243],
        heavyRain: [1192, 1195, 1246],
        freezingRain: [1198, 1201],
        sleet: [1069, 1072, 1204, 1207, 1249, 1252],
        snow: [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258],
        icePellets: [1237, 1261, 1264],
        thunderRain: [1087, 1273, 1276],
        thunderSnow: [1279, 1282],
        blizzard: [1117],
        showerRain: [1240, 1243, 1246],
        showerSleet: [1249, 1252],
        showerSnow: [1255, 1258],
        showerIce: [1261, 1264]
    };

    if (emojiMap.clear.includes(code)) return "☀️";
    if (emojiMap.partlyCloudy.includes(code)) return "🌤️";
    if (emojiMap.cloudy.includes(code)) return "☁️";
    if (emojiMap.mist.includes(code)) return "🌁";
    if (emojiMap.fog.includes(code)) return "🌫️";
    if (emojiMap.drizzle.includes(code)) return "🌦️";
    if (emojiMap.lightRain.includes(code)) return "🌧️";
    if (emojiMap.moderateRain.includes(code)) return "🌧️";
    if (emojiMap.heavyRain.includes(code)) return "🌧️💦";
    if (emojiMap.freezingRain.includes(code)) return "🧊🌧️";
    if (emojiMap.sleet.includes(code)) return "🌨️🧊";
    if (emojiMap.snow.includes(code)) return "❄️";
    if (emojiMap.icePellets.includes(code)) return "🧊";
    if (emojiMap.thunderRain.includes(code)) return "⛈️";
    if (emojiMap.thunderSnow.includes(code)) return "🌩️❄️";
    if (emojiMap.blizzard.includes(code)) return "🌬️❄️";
    if (emojiMap.showerRain.includes(code)) return "🌦️";
    if (emojiMap.showerSleet.includes(code)) return "🌨️🧊";
    if (emojiMap.showerSnow.includes(code)) return "🌨️";
    if (emojiMap.showerIce.includes(code)) return "🧊🌨️";

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
