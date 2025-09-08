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
    alert("Your settings have been saved to the cloud. You can now access them from any device where you use this extension.");

    const now = Date.now();
    const last = settings.lastUpdated ? new Date(settings.lastUpdated).getTime() : 0;
    if (now - last < 3000) return;

    await enrichObserverMetadata(settings).then(async (enriched) => {
        await browser.storage.local.set({custom_settings: enriched});
    })
});

deleteSettingsFromCloudBtn.addEventListener("click", async () => {
    let decision = confirm("Are you sure you want to delete your settings from the cloud? This action cannot be undone.");
    if (!decision) return;
    alert("Your settings have been deleted from the cloud. To re-upload your settings, please click the 'Force Save Settings to Cloud' button.");
    await browser.storage.local.remove("custom_settings");
});

toggleAutoSaveSettingsToCloud.addEventListener("change", (e) => {
    const settings = loadCustomSettings();
    settings.autoCloudSave = e.target.checked;
    saveCustomSettings(settings);
});