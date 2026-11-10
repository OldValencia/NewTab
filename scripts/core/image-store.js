/**
 * The user's uploaded background picture, stored apart from the settings because it can be
 * several megabytes (settings are saved on every change and should stay small).
 */
const IMAGE_KEY = "customImage";

const listeners = new Set();
let cachedImage;

export async function loadCustomImage() {
    if (cachedImage === undefined) {
        const stored = await browser.storage.local.get(IMAGE_KEY);
        cachedImage = typeof stored[IMAGE_KEY] === "string" ? stored[IMAGE_KEY] : null;
    }
    return cachedImage;
}

/** Synchronous check for click handlers (file dialogs must open without awaiting first). */
export function hasLoadedCustomImage() {
    return typeof cachedImage === "string";
}

export async function saveCustomImage(dataUrl) {
    cachedImage = dataUrl;
    await browser.storage.local.set({ [IMAGE_KEY]: dataUrl });
    for (const listener of listeners) listener(dataUrl);
}

export function onCustomImageChange(listener) {
    listeners.add(listener);
}

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !(IMAGE_KEY in changes)) return;
    const newValue = changes[IMAGE_KEY].newValue ?? null;
    if (newValue === cachedImage) return;
    cachedImage = newValue;
    for (const listener of listeners) listener(newValue);
});
