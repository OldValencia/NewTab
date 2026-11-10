/**
 * "Background" section: mode list, per-effect controls, picture options and image filters.
 */
import { getSettings, onExternalChange, subscribe, updateSettings, replaceSettings } from "../core/settings.js";
import { DEFAULT_IMAGE_FILTERS, createDefaultSettings, getDefaultEffectParams } from "../core/defaults.js";
import { hasLoadedCustomImage, loadCustomImage, saveCustomImage } from "../core/image-store.js";
import { confirmDialog, messageDialog } from "../core/dialog.js";
import { t } from "../core/i18n.js";
import { createElement } from "../core/utils.js";
import { EFFECTS, isImageMode } from "../backgrounds/registry.js";
import { onPhotoStatusChange, showNextOnlinePhoto } from "../backgrounds/manager.js";
import { bindControl, createLabeledInput, syncBoundControls } from "./controls.js";

const modeList = document.getElementById("background-modes");
const imageFiltersGroup = document.getElementById("bg-effects-group");
const resetButton = document.getElementById("reset-bg");

const customImageOptions = document.getElementById("custom-image-options");
const chooseImageButton = document.getElementById("choose-custom-image");
const imageFileInput = document.getElementById("bg-upload");

const onlinePhotoOptions = document.getElementById("online-photo-options");
const photoQueryInput = document.getElementById("online-photo-query");
const photoIntervalSelect = document.getElementById("online-photo-interval");
const nextPhotoButton = document.getElementById("online-photo-next");
const photoStatus = document.getElementById("online-photo-status");

const IMAGE_MODE_LABELS = {
    customImage: "background_section_custom_image",
    onlinePhoto: "background_section_online_photo"
};

/** Effect params change on every slider step; the effect restarts only after the user pauses. */
const EFFECT_CONTROL_DEBOUNCE_MS = 150;

function setMode(mode) {
    return updateSettings(settings => { settings.background.mode = mode; });
}

function createEffectControls(effect) {
    const container = createElement("div", { className: "procedural-controls-element" });

    for (const control of effect.controls) {
        const { label, input } = createLabeledInput({
            labelKey: control.labelKey,
            type: control.type,
            min: control.min,
            max: control.max,
            step: control.step
        });
        bindControl(input, {
            get: settings => settings.background.effects[effect.id][control.param],
            set: (settings, value) => { settings.background.effects[effect.id][control.param] = value; },
            defaultValue: getDefaultEffectParams(effect.id)[control.param],
            debounceMs: EFFECT_CONTROL_DEBOUNCE_MS
        });
        container.append(label);
    }
    return container;
}

function createModeOption(mode, labelKey) {
    const radio = createElement("input", { attrs: { type: "radio", name: "bg-mode", value: mode } });
    radio.addEventListener("change", () => {
        if (radio.checked) selectMode(mode);
    });
    return createElement("label", { children: [radio, document.createTextNode(t(labelKey))] });
}

function selectMode(mode) {
    // An empty "custom image" mode is useless, so ask for a picture right away. This must happen
    // synchronously inside the click handler, otherwise Firefox blocks the file dialog.
    if (mode === "customImage" && !hasLoadedCustomImage()) chooseImage();
    return setMode(mode);
}

function renderModeList() {
    const items = [];
    for (const effect of EFFECTS) {
        items.push(createModeOption(effect.id, effect.labelKey));
        if (effect.controls.length > 0) {
            const controls = createEffectControls(effect);
            controls.dataset.mode = effect.id;
            items.push(controls);
        }
    }
    for (const [mode, labelKey] of Object.entries(IMAGE_MODE_LABELS)) {
        items.push(createModeOption(mode, labelKey));
        const options = mode === "customImage" ? customImageOptions : onlinePhotoOptions;
        options.dataset.mode = mode;
        items.push(options);
    }
    modeList.replaceChildren(...items);
}

/** Checks the active radio and shows only the controls that belong to it. */
function renderActiveMode() {
    const { mode } = getSettings().background;
    for (const radio of modeList.querySelectorAll('input[name="bg-mode"]')) {
        radio.checked = radio.value === mode;
    }
    for (const options of modeList.querySelectorAll("[data-mode]")) {
        options.hidden = options.dataset.mode !== mode;
    }
    imageFiltersGroup.hidden = !isImageMode(mode);
}

function chooseImage() {
    imageFileInput.value = "";
    imageFileInput.click();
}

async function handleImageFile() {
    const [file] = imageFileInput.files;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        await messageDialog(t("background_custom_image_not_an_image"));
        return;
    }

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
    await saveCustomImage(dataUrl);
    if (getSettings().background.mode !== "customImage") await setMode("customImage");
}

function initImageFilters() {
    const filterBindings = [
        ["bg-blur", "blur"],
        ["bg-brightness", "brightness"],
        ["bg-vignette", "vignette"],
        ["bg-fit", "fit"]
    ];
    for (const [id, key] of filterBindings) {
        bindControl(document.getElementById(id), {
            get: settings => settings.background.imageFilters[key],
            set: (settings, value) => { settings.background.imageFilters[key] = value; },
            defaultValue: DEFAULT_IMAGE_FILTERS[key]
        });
    }
}

function initOnlinePhotoOptions() {
    bindControl(photoQueryInput, {
        get: settings => settings.background.onlinePhoto.query,
        set: (settings, value) => { settings.background.onlinePhoto.query = value.trim(); },
        defaultValue: "",
        debounceMs: 800
    });
    bindControl(photoIntervalSelect, {
        get: settings => settings.background.onlinePhoto.interval,
        set: (settings, value) => { settings.background.onlinePhoto.interval = value; },
        defaultValue: "onload"
    });
    nextPhotoButton.addEventListener("click", () => showNextOnlinePhoto());

    onPhotoStatusChange(status => {
        photoStatus.hidden = status === "idle";
        photoStatus.textContent = status === "loading" ? t("background_section_search_process_text") : t("background_online_photo_error");
        photoStatus.classList.toggle("error", status === "error");
        nextPhotoButton.disabled = status === "loading";
    });
}

async function resetBackgrounds() {
    if (!await confirmDialog(t("background_reset_confirm"))) return;

    const defaults = createDefaultSettings();
    const settings = structuredClone(getSettings());
    settings.background = defaults.background;
    settings.themes = defaults.themes;
    await replaceSettings(settings);
}

export function initBackgroundSection() {
    loadCustomImage(); // warm the cache for hasLoadedCustomImage()
    renderModeList();
    renderActiveMode();
    initImageFilters();
    initOnlinePhotoOptions();

    chooseImageButton.addEventListener("click", chooseImage);
    imageFileInput.addEventListener("change", handleImageFile);
    resetButton.addEventListener("click", resetBackgrounds);

    subscribe(settings => settings.background.mode, renderActiveMode);
    onExternalChange(() => {
        renderActiveMode();
        syncBoundControls();
    });
}
