const toggleWeatherWidget = document.getElementById("toggle-weather-widget");
const weatherWidget = document.getElementById("weather-widget");
const resetWeatherBtn = document.getElementById("reset-weather-settings");

function loadWeatherWidget(settings) {
    if (!settings.weatherWidget) {
        settings.weatherWidget = {
            showWeather: false,
            weatherCity: "",
            cachedWeather: ""
        };
        saveCustomSettings(settings);
    }

    applyWeatherVisibilitySetting();
    const shouldFetch = loadCachedWeather();
    loadSavedCity(shouldFetch);

    toggleWeatherWidget.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.weatherWidget.showWeather = toggleWeatherWidget.checked;
        saveCustomSettings(settings);
        weatherWidget.style.display = toggleWeatherWidget.checked ? "block" : "none";
    });

    resetWeatherBtn.addEventListener("click", () => {
        const settings = loadCustomSettings();
        settings.weatherWidget.weatherCity = "";
        settings.weatherWidget.cachedWeather = "";
        settings.weatherWidget.showWeather = true;
        saveCustomSettings(settings);

        weatherInput.value = "";
        weatherSummary.textContent = DEFAULT_WEATHER_SUMMARY_VALUE;
        weatherWidget.style.display = "block";
        toggleWeatherWidget.checked = true;
    });
}