const resetLocalizationBtn = document.getElementById("reset-localization-settings");
const localizationSelectElement = document.getElementById("localization-select");

async function loadLocalization() {
    const settings = loadCustomSettings();

    if (!settings.locale) {
        settings.locale = defaultLocale;
        saveCustomSettings(settings);
    }

    localizationSelectElement.value = settings.locale;
    if (settings.locale === defaultLocale) return;
    await loadLocalizationSettings();
    applyLocalization(settings.locale);
}

resetLocalizationBtn.addEventListener("click", () => {
    const settings = loadCustomSettings();
    settings.locale = defaultLocale;
    saveCustomSettings(settings);
    location.reload();
})

localizationSelectElement.addEventListener("change", e => {
    const settings = loadCustomSettings();
    settings.locale = e.target.value;
    saveCustomSettings(settings);
    location.reload();
});
