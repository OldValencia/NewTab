const weatherSummary = document.getElementById("weather-summary");
const weatherInput = document.getElementById("location-input");
const cityBtn = document.getElementById("weather-city-btn");
const geoBtn = document.getElementById("weather-geo-btn");

const DEFAULT_WEATHER_SUMMARY_VALUE = "🌦️ —";
const CACHE_DURATION_MS = 60 * 60 * 1000;

function loadCachedWeather() {
    const {weatherWidget} = loadCustomSettings();
    if (!weatherWidget.cachedWeather) return false;

    const {data, timestamp} = JSON.parse(weatherWidget.cachedWeather);
    if (Date.now() - timestamp < CACHE_DURATION_MS) {
        updateWeather(data);
        return false;
    }
    return true;
}

function applyWeatherVisibilitySetting() {
    const settings = loadCustomSettings();
    if (settings.weatherWidget.showWeather === undefined || settings.weatherWidget.showWeather === null) {
        settings.weatherWidget.showWeather = false;
    }
    toggleWeatherWidget.checked = settings.weatherWidget.showWeather;
    weatherWidgetElement.style.display = settings.weatherWidget.showWeather ? "block" : "none";
}

function saveWeatherData(data, city) {
    const settings = loadCustomSettings();
    settings.weatherWidget.cachedWeather = JSON.stringify({data, timestamp: Date.now()});
    settings.weatherWidget.weatherCity = city;
    weatherInput.value = settings.weatherWidget.weatherCity;
    saveCustomSettings(settings);
}

function loadSavedCity(shouldFetch = false) {
    const {weatherWidget} = loadCustomSettings();
    if (weatherWidget.weatherCity) {
        weatherInput.value = weatherWidget.weatherCity;
        if (shouldFetch) {
            fetchWeatherByCity(weatherWidget.weatherCity);
        }
    }
}

function fetchWeatherByCity(city) {
    const {weatherWidget} = loadCustomSettings();
    if (weatherWidget.cachedWeather) {
        const {data, timestamp} = JSON.parse(weatherWidget.cachedWeather);
        if (Date.now() - timestamp < CACHE_DURATION_MS && weatherWidget.weatherCity === city) {
            updateWeather(data);
            return;
        }
    }
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
            const {weatherWidget} = loadCustomSettings();
            if (weatherWidget.weatherCity === location && weatherWidget.cachedWeather) {
                const {data, timestamp} = JSON.parse(weatherWidget.cachedWeather);
                if (Date.now() - timestamp < CACHE_DURATION_MS && weatherWidget.weatherCity === location) {
                    updateWeather(data);
                    return;
                }
            }
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
    const {weatherWidget} = loadCustomSettings();
    if (!weatherWidget.showWeather) return;

    clearWeatherEffects();

    const code = data.current.condition.code;

    const rainCodes = [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246, 1273];
    if (rainCodes.includes(code)) startRainEffect();

    const snowCodes = [1066, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282];
    if (snowCodes.includes(code)) startSnowEffect();

    const fogCodes = [1030, 1135, 1147];
    if (fogCodes.includes(code)) startFogEffect();

    const thunderCodes = [1087, 1276, 1282];
    if (thunderCodes.includes(code)) {
        startThunderEffect();
        startRainEffect(5);
    }

    const windCodes = [1114, 1117, 1006, 1009];
    if (windCodes.includes(code)) startWindEffect();

    const mixedCodes = [1069, 1072, 1198, 1201, 1237, 1249, 1252, 1261, 1264];
    if (mixedCodes.includes(code)) {
        startSnowEffect();
        startRainEffect();
    }

    const emoji = getWeatherEmoji(code);
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
        clear: {codes: [1000], day: "☀️", night: "🌕"},
        partlyCloudy: {codes: [1003], day: "🌤️", night: "🌥️"},
        cloudy: {codes: [1006, 1009], day: "☁️", night: "☁️"},
        mist: {codes: [1030], day: "🌁", night: "🌁"},
        patchyRain: {codes: [1063, 1180, 1273], day: "🌦️", night: "🌧️"},
        patchySnow: {codes: [1066, 1210, 1279], day: "❄️", night: "❄️"},
        patchySleet: {codes: [1069], day: "🌨️🧊", night: "🌨️🧊"},
        patchyFreezingDrizzle: {codes: [1072], day: "🌧️🧊", night: "🌧️🧊"},
        thunder: {codes: [1087, 1276, 1282], day: "⛈️", night: "🌩️"},
        blowingSnow: {codes: [1114], day: "🌬️❄️", night: "🌬️❄️"},
        blizzard: {codes: [1117], day: "🌬️❄️", night: "🌬️❄️"},
        fog: {codes: [1135, 1147], day: "🌫️", night: "🌫️"},
        drizzle: {codes: [1150, 1153], day: "🌦️", night: "🌧️"},
        freezingDrizzle: {codes: [1168, 1171], day: "🌧️🧊", night: "🌧️🧊"},
        lightRain: {codes: [1183, 1240], day: "🌧️", night: "🌧️"},
        moderateRain: {codes: [1186, 1189, 1243], day: "🌧️", night: "🌧️"},
        heavyRain: {codes: [1192, 1195, 1246], day: "🌧️💦", night: "🌧️💦"},
        freezingRain: {codes: [1198, 1201], day: "🧊🌧️", night: "🧊🌧️"},
        lightSleet: {codes: [1204], day: "🌨️🧊", night: "🌨️🧊"},
        heavySleet: {codes: [1207], day: "🌨️🧊", night: "🌨️🧊"},
        lightSnow: {codes: [1213], day: "❄️", night: "❄️"},
        moderateSnow: {codes: [1216, 1219], day: "❄️", night: "❄️"},
        heavySnow: {codes: [1222, 1225], day: "❄️❄️", night: "❄️❄️"},
        icePellets: {codes: [1237], day: "🧊", night: "🧊"},
        showerRain: {codes: [1240, 1243, 1246], day: "🌦️", night: "🌧️"},
        showerSleet: {codes: [1249, 1252], day: "🌨️🧊", night: "🌨️🧊"},
        showerSnow: {codes: [1255, 1258], day: "🌨️", night: "🌨️"},
        showerIce: {codes: [1261, 1264], day: "🧊🌨️", night: "🧊🌨️"},
        thunderRain: {codes: [1273, 1276], day: "⛈️", night: "🌩️"},
        thunderSnow: {codes: [1279, 1282], day: "🌩️❄️", night: "🌩️❄️"}
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

function startRainEffect(dropsNumber = 30) {
    const rainContainer = document.createElement("div");
    rainContainer.className = "weather-effect rain";
    rainContainer.style.position = "absolute";
    rainContainer.style.top = "0";
    rainContainer.style.left = "0";
    rainContainer.style.width = "100%";
    rainContainer.style.height = "100%";
    rainContainer.style.pointerEvents = "none";
    rainContainer.style.overflow = "hidden";
    rainContainer.style.zIndex = "0";

    for (let i = 0; i < dropsNumber; i++) {
        const drop = document.createElement("div");
        drop.className = "rain-drop";
        drop.style.position = "absolute";
        drop.style.width = "2px";
        drop.style.height = "12px";
        drop.style.background = "rgba(255,255,255,0.3)";
        drop.style.borderRadius = "50%";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.top = `-${Math.random() * 20}px`;
        drop.style.animation = `drop 1.5s linear infinite`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        rainContainer.appendChild(drop);
    }

    weatherWidgetElement.appendChild(rainContainer);
}

function startSnowEffect() {
    const snowContainer = document.createElement("div");
    snowContainer.className = "weather-effect snow";
    snowContainer.style.position = "absolute";
    snowContainer.style.top = "0";
    snowContainer.style.left = "0";
    snowContainer.style.width = "100%";
    snowContainer.style.height = "100%";
    snowContainer.style.pointerEvents = "none";
    snowContainer.style.overflow = "hidden";
    snowContainer.style.zIndex = "0";

    for (let i = 0; i < 40; i++) {
        const flake = document.createElement("div");
        flake.className = "snow-flake";
        flake.textContent = "❄️";
        flake.style.position = "absolute";
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.top = `-${Math.random() * 20}px`;
        flake.style.fontSize = `${Math.random() * 12 + 12}px`;
        flake.style.opacity = "0.8";
        flake.style.animation = `snowFall ${Math.random() * 5 + 5}s linear infinite`;
        flake.style.animationDelay = `${Math.random() * 3}s`;
        snowContainer.appendChild(flake);
    }

    weatherWidgetElement.appendChild(snowContainer);
}

function startFogEffect() {
    const fogWrapper = document.createElement("div");
    fogWrapper.className = "weather-effect fog-wrapper";
    fogWrapper.style.position = "absolute";
    fogWrapper.style.top = "0";
    fogWrapper.style.left = "0";
    fogWrapper.style.width = "100%";
    fogWrapper.style.height = "100%";
    fogWrapper.style.overflow = "hidden";
    fogWrapper.style.pointerEvents = "none";
    fogWrapper.style.zIndex = "0";

    for (let i = 0; i < 3; i++) {
        const fogCloud = document.createElement("div");
        fogCloud.className = "fog-cloud";
        fogCloud.style.position = "absolute";
        fogCloud.style.top = `${20 + i * 20}%`;
        fogCloud.style.left = `${-30 + i * 20}%`;
        fogCloud.style.width = "200px";
        fogCloud.style.height = "120px";
        fogCloud.style.background = "url('data:image/svg+xml;utf8,<svg width=\"200\" height=\"120\" xmlns=\"http://www.w3.org/2000/svg\"><ellipse cx=\"100\" cy=\"60\" rx=\"90\" ry=\"50\" fill=\"white\" fill-opacity=\"0.15\"/></svg>')";
        fogCloud.style.backgroundSize = "cover";
        fogCloud.style.animation = `fogFloat${i} ${40 + i * 10}s linear infinite`;

        fogWrapper.appendChild(fogCloud);
    }

    weatherWidgetElement.appendChild(fogWrapper);
}

function startThunderEffect() {
    const flash = document.createElement("div");
    flash.className = "weather-effect thunder";
    flash.style.position = "absolute";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.pointerEvents = "none";
    flash.style.zIndex = "0";
    flash.style.background = "rgba(255,255,255,0.3)";
    flash.style.animation = "thunderFlash 3s ease-in-out infinite";

    weatherWidgetElement.appendChild(flash);
}

function startWindEffect() {
    const windContainer = document.createElement("div");
    windContainer.className = "weather-effect wind";
    windContainer.style.position = "absolute";
    windContainer.style.top = "0";
    windContainer.style.left = "0";
    windContainer.style.width = "100%";
    windContainer.style.height = "100%";
    windContainer.style.pointerEvents = "none";
    windContainer.style.overflow = "hidden";
    windContainer.style.zIndex = "0";

    const leafEmojis = ["🍃", "🍂", "🌿"];
    for (let i = 0; i < 20; i++) {
        const leaf = document.createElement("div");
        leaf.className = "wind-leaf";
        leaf.textContent = leafEmojis[Math.floor(Math.random() * leafEmojis.length)];
        leaf.style.position = "absolute";
        leaf.style.left = `${Math.random() * 100}%`;
        leaf.style.top = `${Math.random() * 100}px`;
        leaf.style.fontSize = `${Math.random() * 16 + 16}px`;
        leaf.style.opacity = "0.8";
        leaf.style.animation = `leafDrift ${Math.random() * 6 + 6}s ease-in-out infinite`;
        leaf.style.animationDelay = `${Math.random() * 3}s`;
        windContainer.appendChild(leaf);
    }

    weatherWidgetElement.appendChild(windContainer);
}

function clearWeatherEffects() {
    const effects = document.querySelectorAll(".weather-effect");
    effects.forEach(el => el.remove());
}

cityBtn.addEventListener("click", getWeatherByCity);
geoBtn.addEventListener("click", getWeatherByGeolocation);
