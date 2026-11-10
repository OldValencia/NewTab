/**
 * Settings store.
 *
 * - Settings live in browser.storage.local under "settings" (current schema, see defaults.js).
 * - On first run they are migrated from the 1.0.x localStorage format; the old data is left untouched.
 * - getSettings() is synchronous and returns the live object. Never mutate it directly —
 *   use updateSettings(settings => { ... }), which saves and notifies subscribers.
 * - Changes made in another open new tab are picked up through storage.onChanged.
 */
import { createDefaultSettings } from "./defaults.js";
import { isLegacySettings, migrateLegacySettings } from "./migration.js";
import { normalizeSettings } from "./normalize.js";
import { saveCustomImage } from "./image-store.js";

const SETTINGS_KEY = "settings";
const WRITER_KEY = "settingsWriter";
const LEGACY_LOCAL_STORAGE_KEY = "custom_settings";
const LEGACY_CLOUD_KEY = "custom_settings";

// Identifies writes made by this page, so our own storage.onChanged events are ignored.
// Every write gets a new id, so the writer key always changes and is always reported.
const pageId = crypto.randomUUID();
let writeCount = 0;

let current = null;
let canSave = true; // see createInitialSettings()
let pendingWrite = Promise.resolve();
const subscriptions = [];
const externalChangeListeners = new Set();

/** @returns {{ value: object | null, failed: boolean }} */
function readLegacyLocalStorage() {
    try {
        const json = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
        return { value: json ? JSON.parse(json) : null, failed: false };
    } catch (error) {
        console.warn("Could not read legacy settings from localStorage:", error);
        return { value: null, failed: true };
    }
}

/**
 * Creates the first settings object: migrated from 1.0.x (localStorage first, then the old
 * "Cloud Save" copy) or defaults.
 * `canSave` is false when old data may exist but is invisible from this page: private windows
 * have their own empty localStorage, and a read error hides it too. Saving defaults then would
 * mark migration as done and lose the user's settings, so we wait for a normal page instead.
 */
async function createInitialSettings() {
    const fromLocalStorage = readLegacyLocalStorage();
    let legacy = isLegacySettings(fromLocalStorage.value) ? fromLocalStorage.value : null;

    if (!legacy) {
        const stored = await browser.storage.local.get(LEGACY_CLOUD_KEY);
        legacy = isLegacySettings(stored[LEGACY_CLOUD_KEY]) ? stored[LEGACY_CLOUD_KEY] : null;
    }

    if (!legacy) {
        const legacyMayBeHidden = fromLocalStorage.failed || browser.extension.inIncognitoContext;
        return { settings: createDefaultSettings(), canSave: !legacyMayBeHidden };
    }

    const { settings, customImage } = migrateLegacySettings(legacy);
    if (customImage) await saveCustomImage(customImage);
    return { settings, canSave: true };
}

function persist() {
    if (!canSave) return Promise.resolve();

    const snapshot = structuredClone(current);
    const writeId = `${pageId}:${++writeCount}`;
    pendingWrite = pendingWrite
        .then(() => browser.storage.local.set({ [SETTINGS_KEY]: snapshot, [WRITER_KEY]: writeId }))
        .catch(error => console.error("Could not save settings:", error));
    return pendingWrite;
}

function notifySubscribers() {
    for (const subscription of subscriptions) {
        const key = JSON.stringify(subscription.select(current));
        if (key !== subscription.lastKey) {
            subscription.lastKey = key;
            subscription.callback(current);
        }
    }
}

function handleStorageChange(changes, areaName) {
    if (areaName !== "local" || !changes[SETTINGS_KEY]) return;
    if (String(changes[WRITER_KEY]?.newValue).startsWith(`${pageId}:`)) return;
    if (!changes[SETTINGS_KEY].newValue) return;

    current = normalizeSettings(changes[SETTINGS_KEY].newValue);
    canSave = true; // real settings exist now (e.g. migrated by a normal window)
    notifySubscribers();
    notifyExternalChange();
}

function notifyExternalChange() {
    for (const listener of externalChangeListeners) listener(current);
}

export async function initSettings() {
    const stored = await browser.storage.local.get(SETTINGS_KEY);
    const isFirstRun = stored[SETTINGS_KEY] === undefined;

    if (isFirstRun) {
        ({ settings: current, canSave } = await createInitialSettings());
        await persist();
    } else {
        current = normalizeSettings(stored[SETTINGS_KEY]);
    }

    browser.storage.onChanged.addListener(handleStorageChange);
    return current;
}

export function getSettings() {
    return current;
}

/** Applies `mutate` to the settings, saves them and notifies subscribers whose selection changed. */
export function updateSettings(mutate) {
    mutate(current);
    notifySubscribers();
    return persist();
}

/** Replaces all settings (import / reset). The value is normalized first. */
export function replaceSettings(rawSettings) {
    current = normalizeSettings(rawSettings);
    notifySubscribers();
    notifyExternalChange();
    return persist();
}

/**
 * Called when settings change without the user touching this page's controls
 * (another open tab, or an import) — the sidebar uses it to refresh its inputs.
 */
export function onExternalChange(listener) {
    externalChangeListeners.add(listener);
}

/**
 * Calls `callback(settings)` whenever the value returned by `select(settings)` changes.
 * The selection is compared by JSON, so return small plain data.
 */
export function subscribe(select, callback) {
    subscriptions.push({ select, callback, lastKey: JSON.stringify(select(current)) });
}

export { getActiveTheme } from "./normalize.js";
