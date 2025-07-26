const weatherSummary = document.getElementById("weather-summary");
const weatherInput = document.getElementById("location-input");
const cityBtn = document.getElementById("weather-city-btn");
const geoBtn = document.getElementById("weather-geo-btn");

const DEFAULT_WEATHER_SUMMARY_VALUE = "🌦️ —";
const CACHE_DURATION_MS = 60 * 60 * 1000;

function loadCachedWeather() {
    const { cachedWeather } = loadCustomSettings();
    if (!cachedWeather) return false;

    const { data, timestamp } = JSON.parse(cachedWeather);
    if (Date.now() - timestamp < CACHE_DURATION_MS) {
        updateWeather(data);
        return true;
    }
    return false;
}

function applyWeatherVisibilitySetting() {
    const { showWeather = true } = loadCustomSettings();
    toggleWeatherWidget.checked = showWeather;
    weatherWidget.style.display = showWeather ? "block" : "none";
}

function saveWeatherData(data, city) {
    const settings = loadCustomSettings();
    settings.cachedWeather = JSON.stringify({ data, timestamp: Date.now() });
    settings.weatherCity = city;
    saveCustomSettings(settings);
}

function loadSavedCity() {
    const { weatherCity } = loadCustomSettings();
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
        ({ coords: { latitude, longitude } }) => {
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
    const { showWeather = true } = loadCustomSettings();
    if (!showWeather) return;

    const emoji = getWeatherEmoji(data.current.condition.code);
    const temp = Math.round(data.current.temp_c);
    const { name: city, country } = data.location;
    weatherSummary.textContent = `${emoji} ${temp}°C — ${city}, ${country}`;

    const bg = window.getComputedStyle(document.body).backgroundColor;
    weatherSummary.style.color = getBrightness(bg) < 128 ? "#fff" : "#000";

    applyWeatherVisibilitySetting();
}

function getWeatherEmoji(code) {
    const emojiMap = {
        sun: [1000],
        partly: [1003],
        cloud: [1006, 1009],
        fog: [1030, 1135, 1147],
        rain: [1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195],
        snow: [1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225],
        storm: [1273, 1276, 1279, 1282]
    };

    if (emojiMap.sun.includes(code)) return "☀️";
    if (emojiMap.partly.includes(code)) return "🌤️";
    if (emojiMap.cloud.includes(code)) return "☁️";
    if (emojiMap.fog.includes(code)) return "🌫️";
    if (emojiMap.rain.includes(code)) return "🌧️";
    if (emojiMap.snow.includes(code)) return "❄️";
    if (emojiMap.storm.includes(code)) return "⛈️";
    return "❔";
}

function getBrightness(rgb) {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return (r * 299 + g * 587 + b * 114) / 1000;
}

cityBtn.addEventListener("click", getWeatherByCity);
geoBtn.addEventListener("click", getWeatherByGeolocation);

if (!loadCachedWeather()) loadSavedCity();
