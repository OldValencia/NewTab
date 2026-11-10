import { updateSettings } from "../core/settings.js";
import { createDefaultSettings } from "../core/defaults.js";
import { bindControl } from "./controls.js";

const DEFAULT_UNITS = createDefaultSettings().weather.units;

export function initWeatherSection() {
    bindControl(document.getElementById("toggle-weather-widget"), {
        get: settings => settings.weather.enabled,
        set: (settings, value) => { settings.weather.enabled = value; }
    });

    bindControl(document.getElementById("weather-units"), {
        get: settings => settings.weather.units,
        set: (settings, value) => { settings.weather.units = value; },
        defaultValue: DEFAULT_UNITS
    });

    document.getElementById("reset-weather-settings").addEventListener("click", () => updateSettings(settings => {
        settings.weather.city = "";
        settings.weather.location = null;
        settings.weather.units = DEFAULT_UNITS;
        settings.weather.cache = null;
    }));
}
