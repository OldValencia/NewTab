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
        await saveCustomSettings(settings);
    }

    weatherApiKeyInput.value = settings.weatherWidget.weatherApiKey;

    await applyWeatherVisibilitySetting();
    const shouldFetch = await loadCachedWeather();
    await loadSavedCity(shouldFetch);

    toggleWeatherWidget.addEventListener("change", async () => {
        const settings = loadCustomSettings();

        if (!settings.weatherWidget.weatherApiKey || settings.weatherWidget.weatherApiKey.trim() === "") {
            alert("Please enter a valid WeatherAPI.com key to enable the weather widget.");
            toggleWeatherWidget.checked = false;
            settings.weatherWidget.showWeather = false;
            await saveCustomSettings(settings);
            await applyWeatherVisibilitySetting();
            return;
        }

        settings.weatherWidget.showWeather = toggleWeatherWidget.checked;
        await saveCustomSettings(settings);
        await applyWeatherVisibilitySetting();
    });

    resetWeatherBtn.addEventListener("click", async () => {
        const settings = loadCustomSettings();
        settings.weatherWidget.weatherCity = "";
        settings.weatherWidget.cachedWeather = "";
        settings.weatherWidget.showWeather = true;
        await saveCustomSettings(settings);

        weatherInput.value = "";
        weatherSummary.textContent = DEFAULT_WEATHER_SUMMARY_VALUE;

        if (!sidebar.classList.contains("open")) {
            weatherWidgetElement.classList.remove("sidebar-shifted");
        }

        await applyWeatherVisibilitySetting();
    });

    weatherApiKeyInput.addEventListener("change", async () => {
        const settings = loadCustomSettings();
        settings.weatherWidget.weatherApiKey = weatherApiKeyInput.value.trim();

        if (!settings.weatherWidget.weatherApiKey || settings.weatherWidget.weatherApiKey.trim() === "") {
            alert("Please enter a valid WeatherAPI.com key to enable the weather widget.");
            toggleWeatherWidget.checked = false;
            settings.weatherWidget.showWeather = false;

            await saveCustomSettings(settings);
            await applyWeatherVisibilitySetting();
        }

        await saveCustomSettings(settings);
    })
}

weatherWidgetElement.addEventListener("mouseover", () => {
    addCustomNotificationButton.classList.toggle("weather-active", true);
});

weatherWidgetElement.addEventListener("mouseleave", () => {
    addCustomNotificationButton.classList.toggle("weather-active", false);
});