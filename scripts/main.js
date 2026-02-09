const backgroundLayer = document.getElementById("background-layer");

let settingsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 100;

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function throttle(fn, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

async function enrichObserverMetadata(settings) {
    if (!settings) return settings;
    settings.lastUpdated = Date.now();
    const [info, platform] = await Promise.all([
        browser.runtime.getBrowserInfo(),
        browser.runtime.getPlatformInfo()
    ]);
    settings.info = info;
    settings.platform = platform;
    return settings;
}

async function saveCustomSettings(settings) {
    if (!settings) return;
    settingsCache = settings;
    cacheTimestamp = Date.now();
    const enriched = await enrichObserverMetadata(settings);
    localStorage.setItem("custom_settings", JSON.stringify(enriched));
}

function loadCustomSettings() {
    const now = Date.now();
    if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return settingsCache;
    }
    const json = localStorage.getItem("custom_settings");
    settingsCache = json ? JSON.parse(json) : {};
    cacheTimestamp = now;
    return settingsCache;
}

function applyBackgroundEffects(settings) {
    const blur = settings.bg.bgBlur || 0;
    const brightness = settings.bg.bgBrightness || 100;
    backgroundLayer.style.filter = `blur(${blur}px) brightness(${brightness}%)`;
    const intensity = settings.bg.bgVignette;
    const alpha = intensity / 100 * 0.8;
    vignetteLayer.style.background = `radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,${alpha}) 100%)`;
}

async function applyBackgroundFit(fit) {
    if (!fit) {
        fit = "cover";
        const settings = loadCustomSettings();
        settings.bg.bgFit = fit;
        await saveCustomSettings(settings);
        bgFit.value = fit;
    }

    const styles = {
        cover: { size: "cover", repeat: "no-repeat", position: "center" },
        contain: { size: "contain", repeat: "no-repeat", position: "center" },
        repeat: { size: "auto", repeat: "repeat", position: "top left" },
        stretch: { size: "100% 100%", repeat: "no-repeat", position: "center" },
        center: { size: "auto", repeat: "no-repeat", position: "center" }
    };

    const style = styles[fit];
    if (style) {
        backgroundLayer.style.backgroundSize = style.size;
        backgroundLayer.style.backgroundRepeat = style.repeat;
        backgroundLayer.style.backgroundPosition = style.position;
    }
}

function adjustColor(hex, percent) {
    const rgb = hex.replace("#", "").match(/.{2}/g).map(x => parseInt(x, 16));
    const adjusted = rgb.map(c => {
        const delta = Math.round(255 * percent);
        return Math.min(255, Math.max(0, c + delta));
    });
    return "#" + adjusted.map(x => x.toString(16).padStart(2, "0")).join("");
}

function hexToRgba(hex, alpha = 1) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

async function createColorInput(localizationKey, labelId, defaultColor, bgMode, bgModeVariable, onChangeCallback) {
    const settings = loadCustomSettings();
    const colorLabel = document.createElement("label");
    colorLabel.setAttribute("for", labelId);
    colorLabel.textContent = await getLocalizationByKey(localizationKey, settings.locale);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = labelId;
    colorInput.value = defaultColor;

    const debounceColorHandler = debounce(async (e) => {
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = e.target.value;
        await saveCustomSettings(settings);
        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    }, 200);

    colorInput.addEventListener("input", debounceColorHandler);
    colorInput.addEventListener("contextmenu", async (e) => {
        e.preventDefault();
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = defaultColor;
        colorInput.value = defaultColor;
        await saveCustomSettings(settings);
        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    });

    colorLabel.appendChild(colorInput);
    return colorLabel;
}

async function createRangeInput(localizationKey, labelId, labelMin, labelMax, labelStep, defaultValue, bgMode, bgModeVariable, onChangeCallback) {
    const settings = loadCustomSettings();
    const rangeLabel = document.createElement("label");
    rangeLabel.setAttribute("for", labelId);
    rangeLabel.textContent = await getLocalizationByKey(localizationKey, settings.locale);

    const rangeInput = document.createElement("input");
    rangeInput.type = "range";
    rangeInput.id = labelId;
    rangeInput.min = labelMin;
    rangeInput.max = labelMax;
    rangeInput.step = labelStep;
    rangeInput.value = defaultValue;

    const debounceSizeHandler = debounce(async (e) => {
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = e.target.value;
        await saveCustomSettings(settings);
        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    }, 200);

    rangeInput.addEventListener("input", debounceSizeHandler);
    rangeInput.addEventListener("contextmenu", async (e) => {
        e.preventDefault();
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = defaultValue;
        rangeInput.value = defaultValue;
        await saveCustomSettings(settings);
        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    });

    rangeLabel.appendChild(rangeInput);
    return rangeLabel;
}

async function createCheckbox(localizationKey, labelId, defaultValue, bgMode, bgModeVariable, onChangeCallback) {
    const settings = loadCustomSettings();
    const checkboxLabel = document.createElement("label");
    checkboxLabel.setAttribute("for", labelId);
    checkboxLabel.textContent = await getLocalizationByKey(localizationKey, settings.locale);

    const checkboxInput = document.createElement("input");
    checkboxInput.type = "checkbox";
    checkboxInput.id = labelId;
    checkboxInput.checked = defaultValue;

    const debounceSizeHandler = debounce(async (e) => {
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = e.target.checked;
        await saveCustomSettings(settings);
        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    }, 200);

    checkboxInput.addEventListener("change", debounceSizeHandler);
    checkboxLabel.appendChild(checkboxInput);
    return checkboxLabel;
}

function showConfirmation(message, onConfirm, onCancel = () => {}) {
    const modal = document.getElementById("confirm-modal");
    const msg = document.getElementById("confirm-message");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    msg.textContent = message;
    modal.classList.remove("hidden");

    const cleanup = () => {
        modal.classList.add("hidden");
        yesBtn.onclick = null;
        noBtn.onclick = null;
        document.removeEventListener("keydown", handleKey);
    };

    const handleKey = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            cleanup();
            setTimeout(() => onCancel(), 50);
        } else if (e.key === "Enter") {
            e.preventDefault();
            cleanup();
            setTimeout(() => onConfirm(), 50);
        }
    };

    yesBtn.onclick = () => {
        cleanup();
        onConfirm();
    };

    noBtn.onclick = () => {
        cleanup();
        onCancel();
    };

    document.addEventListener("keydown", handleKey);
    setTimeout(cleanup, 60000);
}

function makeContainerDraggable(container, handler = "#drag-handle") {
    const dragHandle = container.querySelector(handler);
    if (!dragHandle) return;

    let isDragging = false;
    let offsetX, offsetY;

    const handleMouseDown = (e) => {
        isDragging = true;
        offsetX = e.clientX - container.offsetLeft;
        offsetY = e.clientY - container.offsetTop;
        document.body.style.userSelect = "none";
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            container.style.left = `${e.clientX - offsetX}px`;
            container.style.top = `${e.clientY - offsetY}px`;
        }
    };

    const handleMouseUp = () => {
        isDragging = false;
        document.body.style.userSelect = "";
    };

    dragHandle.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
}

window.addEventListener("beforeunload", () => {
    const settings = loadCustomSettings();
    if (settings.autoCloudSave) {
        browser.storage.local.set({custom_settings: settings});
    }
});

window.addEventListener("DOMContentLoaded", async () => {
    const localSettings = loadCustomSettings();

    if (localSettings.autoCloudSave) {
        const settings = await browser.storage.local.get("custom_settings");

        if (localSettings.toString() !== settings?.custom_settings?.toString()) {
            const localLast = localSettings.lastUpdated ? new Date(localSettings.lastUpdated).getTime() : 0;
            const cloudLast = settings?.custom_settings?.lastUpdated ? new Date(settings.custom_settings.lastUpdated).getTime() : 0;

            const keys = [
                "main_confirmation_window_dom_loaded_auto_save_cloud_first_line",
                "main_confirmation_window_dom_loaded_auto_save_cloud_second_line",
                "main_confirmation_window_dom_loaded_auto_save_cloud_third_line",
                "main_confirmation_window_dom_loaded_auto_save_cloud_fourth_line",
                "main_confirmation_window_dom_loaded_auto_save_cloud_fifth_line",
                "main_confirmation_window_dom_loaded_auto_save_cloud_sixth_line",
                "main_confirmation_window_dom_loaded_auto_save_cloud_cloud_settings_metadata_text",
                "main_confirmation_window_dom_loaded_auto_save_cloud_not_available_na_text"
            ];

            const confirmationLocalizedText = await Promise.all(
                keys.map(key => getLocalizationByKey(key, localSettings.locale))
            );

            showConfirmation(
                `${confirmationLocalizedText[0]}
                ${confirmationLocalizedText[1]}
                ${confirmationLocalizedText[2]}${localLast}
                ${confirmationLocalizedText[3]}${localSettings.platform.os} (${localSettings.platform.arch})
                ${confirmationLocalizedText[4]}${localSettings.info.version}\n\n

                ${confirmationLocalizedText[6]}
                ${confirmationLocalizedText[2]}${cloudLast}
                ${confirmationLocalizedText[3]}${settings?.custom_settings?.platform?.os || confirmationLocalizedText[7]} (${settings?.custom_settings?.platform?.arch || confirmationLocalizedText[7]})
                ${confirmationLocalizedText[4]}${settings?.custom_settings?.info?.version || confirmationLocalizedText[7]}\n\n
                ${confirmationLocalizedText[5]}`,
                async () => {
                    if (!settings?.custom_settings) return;
                    await saveCustomSettings(settings.custom_settings);
                },
                async () => {
                    await browser.storage.local.set({custom_settings: localSettings});
                });
        }
    }
});
