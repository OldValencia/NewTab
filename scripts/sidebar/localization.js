const resetLocalizationBtn = document.getElementById("reset-localization-settings");
const localizationSelectElement = document.getElementById("localization-select");

async function loadLocalization() {
    const settings = loadCustomSettings();

    if (!settings.locale) {
        settings.locale = defaultLocale;
        await saveCustomSettings(settings);
    }

    localizationSelectElement.value = settings.locale;
    if (settings.locale === defaultLocale) return;
    await loadLocalizationSettings();
    applyLocalization(settings.locale);
}

resetLocalizationBtn.addEventListener("click", async () => {
    const settings = loadCustomSettings();
    settings.locale = defaultLocale;
    await saveCustomSettings(settings);
    location.reload();
})

localizationSelectElement.addEventListener("change", async e => {
    const settings = loadCustomSettings();
    settings.locale = e.target.value;
    await saveCustomSettings(settings);
    location.reload();
});
