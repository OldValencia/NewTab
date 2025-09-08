const toggleWeatherWidget = document.getElementById("toggle-weather-widget");
const weatherWidgetElement = document.getElementById("weather-widget");
const resetWeatherBtn = document.getElementById("reset-weather-settings");
const weatherApiKeyInput = document.getElementById("weather-api-key");

async function loadWeatherWidget() {
    const settings = loadCustomSettings();

    if (!settings.weatherWidget) {
        settings.weatherWidget = {
            showWeather: false,
            weatherCity: "",
            cachedWeather: "",
            weatherApiKey: ""
        };
        saveCustomSettings(settings);
    }

    weatherApiKeyInput.value = settings.weatherWidget.weatherApiKey;

    await applyWeatherVisibilitySetting();
    const shouldFetch = await loadCachedWeather();
    await loadSavedCity(shouldFetch);

    toggleWeatherWidget.addEventListener("change", () => {
        const settings = loadCustomSettings();

        if (!settings.weatherWidget.weatherApiKey || settings.weatherWidget.weatherApiKey.trim() === "") {
            alert("Please enter a valid WeatherAPI.com key to enable the weather widget.");
            toggleWeatherWidget.checked = false;
            settings.weatherWidget.showWeather = false;
            saveCustomSettings(settings);
            applyWeatherVisibilitySetting();
            return;
        }

        settings.weatherWidget.showWeather = toggleWeatherWidget.checked;
        saveCustomSettings(settings);
        applyWeatherVisibilitySetting();
    });

    resetWeatherBtn.addEventListener("click", () => {
        const settings = loadCustomSettings();
        settings.weatherWidget.weatherCity = "";
        settings.weatherWidget.cachedWeather = "";
        settings.weatherWidget.showWeather = true;
        saveCustomSettings(settings);

        weatherInput.value = "";
        weatherSummary.textContent = DEFAULT_WEATHER_SUMMARY_VALUE;

        if (!sidebar.classList.contains("open")) {
            weatherWidgetElement.classList.remove("sidebar-shifted");
        }

        applyWeatherVisibilitySetting();
    });

    weatherApiKeyInput.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.weatherWidget.weatherApiKey = weatherApiKeyInput.value.trim();

        if (!settings.weatherWidget.weatherApiKey || settings.weatherWidget.weatherApiKey.trim() === "") {
            alert("Please enter a valid WeatherAPI.com key to enable the weather widget.");
            toggleWeatherWidget.checked = false;
            settings.weatherWidget.showWeather = false;

            saveCustomSettings(settings);
            applyWeatherVisibilitySetting();
        }

        saveCustomSettings(settings);
    })
}

weatherWidgetElement.addEventListener("mouseover", () => {
    addCustomNotificationButton.classList.toggle("weather-active", true);
});

weatherWidgetElement.addEventListener("mouseleave", () => {
    addCustomNotificationButton.classList.toggle("weather-active", false);
});