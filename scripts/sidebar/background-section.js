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

const scheduleCheckbox = document.getElementById("bg-schedule-enabled");
const scheduleOptions = document.getElementById("bg-schedule-options");
const scheduleDayModeSelect = document.getElementById("bg-schedule-day-mode");
const scheduleNightModeSelect = document.getElementById("bg-schedule-night-mode");

const customImageOptions = document.getElementById("custom-image-options");
const chooseImageButton = document.getElementById("choose-custom-image");
const imageFileInput = document.getElementById("bg-upload");

const onlinePhotoOptions = document.getElementById("online-photo-options");
const photoOfTheDayOptions = document.getElementById("photo-of-the-day-options");
const photoOfTheDayStatus = document.getElementById("photo-of-the-day-status");
const photoQueryInput = document.getElementById("online-photo-query");
const photoIntervalSelect = document.getElementById("online-photo-interval");
const nextPhotoButton = document.getElementById("online-photo-next");
const photoStatus = document.getElementById("online-photo-status");

const IMAGE_MODE_LABELS = {
    customImage: "background_section_custom_image",
    onlinePhoto: "background_section_online_photo",
    photoOfTheDay: "background_section_photo_of_the_day"
};

const IMAGE_MODE_OPTIONS = {
    customImage: customImageOptions,
    onlinePhoto: onlinePhotoOptions,
    photoOfTheDay: photoOfTheDayOptions
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
        const options = IMAGE_MODE_OPTIONS[mode];
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

/** Every background with its label, in the order of the list above. */
function allModeOptions() {
    return [
        ...EFFECTS.map(effect => ({ value: effect.id, labelKey: effect.labelKey })),
        ...Object.entries(IMAGE_MODE_LABELS).map(([mode, labelKey]) => ({ value: mode, labelKey }))
    ];
}

function fillModeSelect(select) {
    select.replaceChildren(...allModeOptions().map(({ value, labelKey }) =>
        createElement("option", { text: t(labelKey), attrs: { value } })));
}

function renderScheduleOptions() {
    scheduleOptions.hidden = !getSettings().background.schedule.enabled;
}

function initSchedule() {
    fillModeSelect(scheduleDayModeSelect);
    fillModeSelect(scheduleNightModeSelect);

    const defaults = createDefaultSettings().background.schedule;
    const bindScheduleField = (element, field, defaultValue, isValid = () => true) => bindControl(element, {
        get: settings => settings.background.schedule[field],
        set: (settings, value) => {
            // A half-typed or cleared time field is not saved; the last valid time stays.
            if (isValid(value)) settings.background.schedule[field] = value;
        },
        defaultValue
    });
    const isTime = value => /^\d{2}:\d{2}$/.test(value);
    const currentMode = () => getSettings().background.mode;

    bindScheduleField(scheduleCheckbox, "enabled", defaults.enabled);
    bindScheduleField(scheduleDayModeSelect, "dayMode", currentMode);
    bindScheduleField(scheduleNightModeSelect, "nightMode", currentMode);
    bindScheduleField(document.getElementById("bg-schedule-night-start"), "nightStart", defaults.nightStart, isTime);
    bindScheduleField(document.getElementById("bg-schedule-day-start"), "dayStart", defaults.dayStart, isTime);

    renderScheduleOptions();
    subscribe(settings => settings.background.schedule.enabled, renderScheduleOptions);
    // The schedule changes modes and fills empty slots by itself; keep the selects in step.
    subscribe(settings => [settings.background.mode, settings.background.schedule], syncBoundControls);
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

        // Both photo modes report through the same status; only the visible block matters.
        photoOfTheDayStatus.hidden = status === "idle";
        photoOfTheDayStatus.textContent = status === "loading" ? t("background_section_search_process_text") : t("background_photo_of_the_day_error");
        photoOfTheDayStatus.classList.toggle("error", status === "error");
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
    initSchedule();

    chooseImageButton.addEventListener("click", chooseImage);
    imageFileInput.addEventListener("change", handleImageFile);
    resetButton.addEventListener("click", resetBackgrounds);

    subscribe(settings => settings.background.mode, renderActiveMode);
    onExternalChange(() => {
        renderActiveMode();
        renderScheduleOptions();
        syncBoundControls();
    });
}
