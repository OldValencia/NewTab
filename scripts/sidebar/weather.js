const toggleWeatherWidget = document.getElementById("toggle-weather-widget");
const weatherWidget = document.getElementById("weather-widget");
const resetWeatherBtn = document.getElementById("reset-weather-settings");

function loadWeatherWidget() {
    toggleWeatherWidget.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.showWeather = toggleWeatherWidget.checked;
        saveCustomSettings(settings);
        weatherWidget.style.display = toggleWeatherWidget.checked ? "block" : "none";
    });

    resetWeatherBtn.addEventListener("click", () => {
        const settings = loadCustomSettings();
        settings.weatherCity = "";
        settings.cachedWeather = "";
        settings.showWeather = true;
        saveCustomSettings(settings);

        weatherInput.value = "";
        weatherSummary.textContent = DEFAULT_WEATHER_SUMMARY_VALUE;
        weatherWidget.style.display = "block";
        toggleWeatherWidget.checked = true;
    });
}