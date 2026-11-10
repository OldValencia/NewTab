/**
 * Export / import of all settings as a JSON file (replaces the old "Cloud Save").
 * Files exported by 1.0.x-style settings objects are migrated on import.
 */
import { getSettings, replaceSettings } from "../core/settings.js";
import { loadCustomImage, saveCustomImage } from "../core/image-store.js";
import { isLegacySettings, migrateLegacySettings } from "../core/migration.js";
import { confirmDialog, messageDialog } from "../core/dialog.js";
import { t } from "../core/i18n.js";
import { isPlainObject } from "../core/utils.js";

const BACKUP_FORMAT = "newtab-extension-backup";

const exportButton = document.getElementById("export-settings");
const importButton = document.getElementById("import-settings");
const fileInput = document.getElementById("import-settings-file");

async function exportSettings() {
    const backup = {
        format: BACKUP_FORMAT,
        exportedAt: new Date().toISOString(),
        extensionVersion: browser.runtime.getManifest().version,
        settings: getSettings(),
        customImage: await loadCustomImage()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `newtab-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Accepts our backup files and raw 1.0.x settings objects. */
function parseBackup(json) {
    const data = JSON.parse(json);

    if (isPlainObject(data) && data.format === BACKUP_FORMAT && isPlainObject(data.settings)) {
        const customImage = typeof data.customImage === "string" && data.customImage.startsWith("data:image/")
            ? data.customImage
            : null;
        return { settings: data.settings, customImage };
    }
    if (isLegacySettings(data)) return migrateLegacySettings(data);

    throw new Error("Not a settings backup");
}

async function importSettings(file) {
    let backup;
    try {
        backup = parseBackup(await file.text());
    } catch (error) {
        console.warn("Could not import settings:", error);
        await messageDialog(t("backup_import_invalid_file"));
        return;
    }

    if (!await confirmDialog(t("backup_import_confirm"))) return;

    if (backup.customImage) await saveCustomImage(backup.customImage);
    await replaceSettings(backup.settings);
    location.reload();
}

export function initBackupSection() {
    exportButton.addEventListener("click", exportSettings);
    importButton.addEventListener("click", () => {
        fileInput.value = "";
        fileInput.click();
    });
    fileInput.addEventListener("change", () => {
        const [file] = fileInput.files;
        if (file) importSettings(file);
    });
}
