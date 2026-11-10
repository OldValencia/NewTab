import { updateSettings } from "../core/settings.js";
import { bindControl } from "./controls.js";

export function initWeatherSection() {
    bindControl(document.getElementById("toggle-weather-widget"), {
        get: settings => settings.weather.enabled,
        set: (settings, value) => { settings.weather.enabled = value; }
    });

    document.getElementById("reset-weather-settings").addEventListener("click", () => updateSettings(settings => {
        settings.weather.city = "";
        settings.weather.location = null;
        settings.weather.cache = null;
    }));
}
