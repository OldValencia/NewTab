import { getSettings, updateSettings } from "../core/settings.js";
import { DEFAULT_LOCALE } from "../core/defaults.js";
import { SUPPORTED_LOCALES } from "../core/locales.js";
import { createElement } from "../core/utils.js";

const select = document.getElementById("localization-select");
const resetButton = document.getElementById("reset-localization-settings");

/** The whole page is built in the chosen language, so switching reloads it. */
async function switchLanguage(locale) {
    await updateSettings(settings => { settings.locale = locale; });
    location.reload();
}

export function initLanguageSection() {
    select.replaceChildren(...SUPPORTED_LOCALES.map(({ code, name }) =>
        createElement("option", { text: name, attrs: { value: code } })));
    select.value = getSettings().locale;

    select.addEventListener("change", () => switchLanguage(select.value));
    resetButton.addEventListener("click", () => switchLanguage(DEFAULT_LOCALE));
}
