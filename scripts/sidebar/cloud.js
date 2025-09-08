const forceSaveSettingsToCloudBtn = document.getElementById("force-cloud-save-settings");
const deleteSettingsFromCloudBtn = document.getElementById("delete-settings-from-cloud");
const toggleAutoSaveSettingsToCloud = document.getElementById("toggle-auto-save-to-cloud");

function loadCloudSettings() {
    const settings = loadCustomSettings();

    if (settings.autoCloudSave === undefined) {
        settings.autoCloudSave = false;
    }

    saveCustomSettings(settings);

    toggleAutoSaveSettingsToCloud.checked = settings.autoCloudSave;
}

forceSaveSettingsToCloudBtn.addEventListener("click", async () => {
    const settings = loadCustomSettings();
    alert(await getLocalizationByKey("auto_save_cloud_alert_force_save_text", settings.locale));

    const now = Date.now();
    const last = settings.lastUpdated ? new Date(settings.lastUpdated).getTime() : 0;
    if (now - last < 3000) return;

    await enrichObserverMetadata(settings).then(async (enriched) => {
        await browser.storage.local.set({custom_settings: enriched});
    })
});

deleteSettingsFromCloudBtn.addEventListener("click", async () => {
    const settings = loadCustomSettings();
    let decision = confirm(await getLocalizationByKey("auto_save_cloud_confirm_delete_settings_text", settings.locale));
    if (!decision) return;
    alert(await getLocalizationByKey("auto_save_cloud_alert_delete_success_text", settings.locale));
    await browser.storage.local.remove("custom_settings");
});

toggleAutoSaveSettingsToCloud.addEventListener("change", (e) => {
    const settings = loadCustomSettings();
    settings.autoCloudSave = e.target.checked;
    saveCustomSettings(settings);
});