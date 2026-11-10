/**
 * "Time and date" section: up to MAX_CLOCKS clock editors for the active background's theme.
 */
import { getActiveTheme, getSettings, subscribe, updateSettings, onExternalChange } from "../core/settings.js";
import { CLOCK_DATE_SIZE, CLOCK_TIME_SIZE, DEFAULT_FONT, MAX_CLOCKS, getDefaultClock, getDefaultTheme } from "../core/defaults.js";
import { defaultClockLabel, formatClockDate, formatUtcOffset } from "../core/time-format.js";
import { getLocale, t } from "../core/i18n.js";
import { createElement } from "../core/utils.js";
import { createIcon } from "../core/icons.js";
import { bindControl, createLabeledInput, createSelect, syncBoundControls } from "./controls.js";

const editorsContainer = document.getElementById("time-and-date-controls");
const addClockButton = document.getElementById("add-clock");
const resetButton = document.getElementById("reset-time-date");
const showTimeCheckbox = document.getElementById("toggle-time");
const showDateCheckbox = document.getElementById("toggle-date");
const layoutRow = document.getElementById("clocks-layout-row");
const layoutSelect = document.getElementById("clocks-layout");

const FONTS = [
    "Inter", "Arial", "Segoe UI", "Georgia", "Courier New", "Roboto", "Helvetica", "Verdana", "Tahoma",
    "Trebuchet MS", "Lucida Sans", "Times New Roman", "Fira Sans", "Open Sans", "Lato", "Quicksand", "Monaco"
];

const TIME_FORMAT_OPTIONS = [
    { value: "24", labelKey: "date_and_time_clocks_customization_time_format_first_option" },
    { value: "12", labelKey: "date_and_time_clocks_customization_time_format_second_option" },
    { value: "arabic", labelKey: "date_and_time_clocks_customization_time_format_third_option" },
    { value: "chinese", labelKey: "date_and_time_clocks_customization_time_format_fourth_option" },
    { value: "japanese", labelKey: "date_and_time_clocks_customization_time_format_fifth_option" },
    { value: "custom", labelKey: "date_and_time_clocks_customization_time_format_sixth_option" }
];

// The same day as in the other examples (Sunday, 20 July 2025).
const EXAMPLE_DATE = new Date(Date.UTC(2025, 6, 20, 12));

function dateFormatOptions() {
    return [
        { value: "month-day-year", labelKey: "date_and_time_clocks_customization_date_format_first_option" },
        { value: "day-month-year", labelKey: "date_and_time_clocks_customization_date_format_second_option" },
        { value: "year-month-day", labelKey: "date_and_time_clocks_customization_date_format_third_option" },
        { value: "dd-mm-yyyy", label: "20-07-2025" },
        { value: "mm-dd-yyyy", label: "07-20-2025" },
        { value: "weekday", label: formatClockDate(EXAMPLE_DATE, { format: "weekday", timeZone: "UTC", locale: getLocale() }) }
    ];
}

const STYLE_OPTIONS = [
    { value: "digital", labelKey: "clock_style_digital" },
    { value: "analog", labelKey: "clock_style_analog" }
];

/** Slider changes re-render the page clocks; saving waits until the slider stops for a moment. */
const SIZE_DEBOUNCE_MS = 100;

const SHADOW_STEPS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let timeZoneSelectTemplate = null;

/** Builds the (large) time zone <select> once and clones it for every clock. */
function createTimeZoneSelect(currentZone) {
    if (!timeZoneSelectTemplate) {
        const select = createElement("select");
        select.append(createElement("option", { text: t("date_and_time_clocks_customization_timezone_local_label_option"), attrs: { value: "local" } }));

        const fixedGroup = createElement("optgroup", { attrs: { label: t("timezone_group_fixed_offsets") } });
        for (let hours = -12; hours <= 14; hours++) {
            const value = hours === 0 ? "Etc/GMT" : `Etc/GMT${hours > 0 ? "-" : "+"}${Math.abs(hours)}`;
            const label = hours === 0 ? "UTC±0" : `UTC${hours > 0 ? "+" : "−"}${Math.abs(hours)}`;
            fixedGroup.append(createElement("option", { text: label, attrs: { value } }));
        }

        const regionGroup = createElement("optgroup", { attrs: { label: t("timezone_group_regions") } });
        const now = new Date();
        for (const zone of Intl.supportedValuesOf("timeZone")) {
            const label = `${zone.replaceAll("_", " ")} (${formatUtcOffset(zone, now)})`;
            regionGroup.append(createElement("option", { text: label, attrs: { value: zone } }));
        }

        select.append(fixedGroup, regionGroup);
        timeZoneSelectTemplate = select;
    }

    const select = timeZoneSelectTemplate.cloneNode(true);
    // Aliases such as "Europe/Kiev" are valid but not listed; keep them selectable.
    if (![...select.options].some(option => option.value === currentZone)) {
        select.append(createElement("option", { text: currentZone, attrs: { value: currentZone } }));
    }
    return select;
}

function createFontSelect(currentFont) {
    const options = FONTS.map(font => ({
        value: font,
        label: font === DEFAULT_FONT ? t("option_default_font_label") : font
    }));
    // Keep fonts saved by older versions selectable even if they are not in the list.
    if (currentFont && !FONTS.includes(currentFont)) options.unshift({ value: currentFont, label: currentFont });
    return createSelect(options);
}

function activeMode() {
    return getSettings().background.mode;
}

/** Binds a clock field of the active theme; right-click restores that theme's default. */
function bindClockField(input, index, field, { debounceMs = 0 } = {}) {
    return bindControl(input, {
        get: settings => getActiveTheme(settings).clocks[index]?.[field],
        set: (settings, value) => { getActiveTheme(settings).clocks[index][field] = value; },
        defaultValue: () => getDefaultClock(activeMode())[field],
        debounceMs
    });
}

function clockSwitch(index, field, labelKey, className = "") {
    const { label, input } = createLabeledInput({ labelKey, type: "checkbox", className });
    bindClockField(input, index, field);
    return label;
}

function clockSlider(index, field, labelKey, range) {
    const { label, input } = createLabeledInput({ labelKey, type: "range", min: range.min, max: range.max, step: 1 });
    bindClockField(input, index, field, { debounceMs: SIZE_DEBOUNCE_MS });
    return label;
}

/** "Show city" switch and the text field for an own label (its placeholder is the city). */
function createLabelControls(index, timeZoneSelect) {
    const input = createElement("input", {
        className: "clock-label-input",
        attrs: { type: "text", maxlength: 40, title: t("clock_label_title") }
    });
    bindClockField(input, index, "label");
    const updatePlaceholder = () => { input.placeholder = defaultClockLabel(timeZoneSelect.value); };
    updatePlaceholder();
    timeZoneSelect.addEventListener("change", updatePlaceholder);
    return [clockSwitch(index, "showLabel", "clock_show_label"), input];
}

function createLabeledRow(labelKey, control, className = "format-control") {
    return createElement("div", {
        className,
        children: [createElement("label", { text: t(labelKey) }), control]
    });
}

function createTextStyleRow(index, target, isSelected, onSelectShadowTarget) {
    const fontField = `${target}Font`;
    const label = createElement("label", {
        className: `shadow-target-label ${target}-label${isSelected ? " selected" : ""}`,
        text: t(target === "time" ? "date_and_time_clocks_customization_time_label" : "date_and_time_clocks_customization_date_label"),
        attrs: { title: t("clock_shadow_target_hint") }
    });
    label.addEventListener("click", () => onSelectShadowTarget(target));

    const fontSelect = bindClockField(createFontSelect(getActiveTheme(getSettings()).clocks[index][fontField]), index, fontField);
    const colorInput = bindClockField(createElement("input", { attrs: { type: "color" } }), index, `${target}Color`);

    return { row: createElement("div", { className: "font-control", children: [label, fontSelect, colorInput] }), label, fontSelect };
}

function createShadowEditor(index, getTarget) {
    const shadowKey = () => `${getTarget()}Shadow`;
    const readShadow = () => getActiveTheme(getSettings()).clocks[index][shadowKey()];
    const writeShadow = changes => updateSettings(settings => {
        const clock = getActiveTheme(settings).clocks[index];
        clock[shadowKey()] = { ...clock[shadowKey()], ...changes };
    });
    const defaultShadow = () => getDefaultClock(activeMode())[shadowKey()];

    const offsetDisplay = createElement("span");
    const blurInput = createElement("input", { attrs: { type: "range", min: 0, max: 20, step: 1 } });
    const opacityInput = createElement("input", { attrs: { type: "range", min: 0, max: 1, step: 0.01 } });
    const colorInput = createElement("input", { attrs: { type: "color" } });

    const refresh = () => {
        const shadow = readShadow();
        blurInput.value = shadow.blur;
        opacityInput.value = shadow.opacity;
        colorInput.value = shadow.color;
        offsetDisplay.textContent = `${shadow.offsetX}, ${shadow.offsetY}`;
    };

    const bindShadowInput = (input, field, parse) => {
        input.addEventListener("input", async () => {
            await writeShadow({ [field]: parse(input.value) });
            refresh();
        });
        input.addEventListener("contextmenu", async event => {
            event.preventDefault();
            await writeShadow({ [field]: defaultShadow()[field] });
            refresh();
        });
    };
    bindShadowInput(blurInput, "blur", Number);
    bindShadowInput(opacityInput, "opacity", Number);
    bindShadowInput(colorInput, "color", String);

    const grid = createElement("div", { className: "shadow-direction-grid" });
    const cells = [null, "up", null, "left", "center", "right", null, "down", null];
    for (const direction of cells) {
        if (direction === "center") {
            grid.append(createElement("button", { className: "shadow-dir-btn center", attrs: { type: "button", disabled: true }, children: [offsetDisplay] }));
            continue;
        }
        if (!direction) {
            grid.append(createElement("button", { className: "shadow-dir-btn corner", attrs: { type: "button", disabled: true } }));
            continue;
        }

        const button = createElement("button", {
            className: `shadow-dir-btn shadow-dir-${direction}`,
            attrs: { type: "button" },
            children: [createIcon("chevron")]
        });
        button.addEventListener("click", async () => {
            const shadow = readShadow();
            const [dx, dy] = SHADOW_STEPS[direction];
            await writeShadow({ offsetX: shadow.offsetX + dx, offsetY: shadow.offsetY + dy });
            refresh();
        });
        button.addEventListener("contextmenu", async event => {
            event.preventDefault();
            await writeShadow({ offsetX: 0, offsetY: 0 });
            refresh();
        });
        grid.append(button);
    }

    const sliderLabel = (labelKey, input) => createElement("label", {
        className: "shadow-slider-label",
        children: [document.createTextNode(`${t(labelKey)} `), input]
    });

    const element = createElement("div", {
        className: "format-control clock-shadow-control",
        children: [
            createElement("label", { text: t("date_and_time_clocks_customization_shadow_label") }),
            createElement("div", {
                className: "shadow-controls-row",
                children: [
                    grid,
                    createElement("div", {
                        className: "shadow-sliders",
                        children: [
                            sliderLabel("date_and_time_clocks_customization_shadow_blur_label", blurInput),
                            sliderLabel("date_and_time_clocks_customization_shadow_opacity_label", opacityInput),
                            sliderLabel("date_and_time_clocks_customization_shadow_color_label", colorInput)
                        ]
                    })
                ]
            })
        ]
    });

    refresh();
    return { element, refresh };
}

function createClockEditor(index, clockCount) {
    let shadowTarget = "time";
    const shadowEditor = createShadowEditor(index, () => shadowTarget);

    const selectShadowTarget = target => {
        shadowTarget = target;
        timeRow.label.classList.toggle("selected", target === "time");
        dateRow.label.classList.toggle("selected", target === "date");
        shadowEditor.refresh();
    };
    const timeRow = createTextStyleRow(index, "time", true, selectShadowTarget);
    const dateRow = createTextStyleRow(index, "date", false, selectShadowTarget);

    const removeButton = createElement("button", {
        className: "remove-element icon-button",
        attrs: { type: "button", title: t("clock_remove_button_title"), hidden: clockCount <= 1 },
        children: [createIcon("close")]
    });
    removeButton.addEventListener("click", () => updateSettings(settings => {
        const clocks = getActiveTheme(settings).clocks;
        if (clocks.length > 1) clocks.splice(index, 1);
    }));

    const clock = getActiveTheme(getSettings()).clocks[index];
    const styleSelect = bindClockField(createSelect(STYLE_OPTIONS), index, "style");
    const timeZoneSelect = bindClockField(createTimeZoneSelect(clock.timezone), index, "timezone");
    const timeFormatRow = createLabeledRow("date_and_time_clocks_customization_time_format_label",
        bindClockField(createSelect(TIME_FORMAT_OPTIONS), index, "timeFormat"));

    // Font, time format and the blinking colon mean nothing for an analog face.
    timeRow.fontSelect.classList.add("digital-only");
    timeFormatRow.classList.add("digital-only");

    const editor = createElement("div", {
        className: "time-and-date-wrapper",
        children: [
            removeButton,
            createLabeledRow("clock_style_label", styleSelect),
            timeRow.row,
            dateRow.row,
            shadowEditor.element,
            clockSlider(index, "timeSize", "clock_time_size_label", CLOCK_TIME_SIZE),
            clockSlider(index, "dateSize", "clock_date_size_label", CLOCK_DATE_SIZE),
            timeFormatRow,
            createLabeledRow("date_and_time_clocks_customization_timezone_label", timeZoneSelect),
            createLabeledRow("date_and_time_clocks_customization_date_format_label",
                bindClockField(createSelect(dateFormatOptions()), index, "dateFormat")),
            ...createLabelControls(index, timeZoneSelect),
            clockSwitch(index, "showSeconds", "clock_show_seconds"),
            clockSwitch(index, "blinkColon", "clock_blink_colon", "digital-only")
        ]
    });
    const showStyle = () => { editor.dataset.style = styleSelect.value; };
    showStyle();
    styleSelect.addEventListener("change", showStyle);
    return editor;
}

function renderEditors() {
    const clocks = getActiveTheme(getSettings()).clocks;
    editorsContainer.replaceChildren(...clocks.map((_, index) => createClockEditor(index, clocks.length)));
    addClockButton.hidden = clocks.length >= MAX_CLOCKS;
    layoutRow.hidden = clocks.length < 2;
}

async function addClock() {
    await updateSettings(settings => {
        const clocks = getActiveTheme(settings).clocks;
        if (clocks.length < MAX_CLOCKS) clocks.push(getDefaultClock(settings.background.mode));
    });
}

async function resetTimeAndDate() {
    await updateSettings(settings => {
        const theme = getActiveTheme(settings);
        const defaults = getDefaultTheme(settings.background.mode);
        // Links color shares the theme but has its own reset, so it is kept.
        Object.assign(theme, defaults, { linksColor: theme.linksColor });
    });
    renderEditors();
    syncBoundControls();
}

export function initClocksSection() {
    bindControl(showTimeCheckbox, {
        get: settings => getActiveTheme(settings).showTime,
        set: (settings, value) => { getActiveTheme(settings).showTime = value; }
    });
    bindControl(showDateCheckbox, {
        get: settings => getActiveTheme(settings).showDate,
        set: (settings, value) => { getActiveTheme(settings).showDate = value; }
    });

    bindControl(layoutSelect, {
        get: settings => getActiveTheme(settings).clocksLayout,
        set: (settings, value) => { getActiveTheme(settings).clocksLayout = value; },
        defaultValue: "row"
    });

    renderEditors();
    addClockButton.addEventListener("click", addClock);
    resetButton.addEventListener("click", resetTimeAndDate);

    subscribe(settings => [settings.background.mode, getActiveTheme(settings).clocks.length], () => {
        renderEditors();
        syncBoundControls();
    });
    onExternalChange(renderEditors);
}
