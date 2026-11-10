/**
 * "Time and date" section for the active background's theme (up to MAX_CLOCKS clocks).
 *
 * One clock is edited at a time (tabs named after each clock's city). The everyday options
 * are on top; fonts, colors, sizes and shadows wait in a collapsed "Appearance" block.
 */
import { getActiveTheme, getSettings, subscribe, updateSettings, onExternalChange } from "../core/settings.js";
import { CLOCK_DATE_SIZE, CLOCK_TIME_SIZE, DEFAULT_FONT, MAX_CLOCKS, getDefaultClock, getDefaultTheme } from "../core/defaults.js";
import { defaultClockLabel, formatClockDate, formatUtcOffset } from "../core/time-format.js";
import { getLocale, t } from "../core/i18n.js";
import { createElement } from "../core/utils.js";
import { createIcon } from "../core/icons.js";
import { bindControl, createLabeledInput, createSelect, syncBoundControls } from "./controls.js";

const editorContainer = document.getElementById("time-and-date-controls");
const tabsContainer = document.getElementById("clock-tabs");
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

const STYLES = [
    { value: "digital", labelKey: "clock_style_digital" },
    { value: "analog", labelKey: "clock_style_analog" }
];

const SHADOW_SLIDERS = [
    { key: "offsetX", labelKey: "clock_shadow_offset_x", min: -30, max: 30, step: 1 },
    { key: "offsetY", labelKey: "clock_shadow_offset_y", min: -30, max: 30, step: 1 },
    { key: "blur", labelKey: "date_and_time_clocks_customization_shadow_blur_label", min: 0, max: 20, step: 1 },
    { key: "opacity", labelKey: "date_and_time_clocks_customization_shadow_opacity_label", min: 0, max: 1, step: 0.01 }
];

/** Slider changes re-render the page clocks; saving waits until the slider stops for a moment. */
const SLIDER_DEBOUNCE_MS = 100;

let selectedIndex = 0;
// Collapsed blocks stay as the user left them when the editor is rebuilt (another clock, a new background).
const openBlocks = new Set();

let timeZoneSelectTemplate = null;

/** Builds the (large) time zone <select> once and clones it for every editor. */
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

function clocks() {
    return getActiveTheme(getSettings()).clocks;
}

function clockName(clock) {
    return clock.label.trim() || defaultClockLabel(clock.timezone);
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

/** `<label>Text <control></label>` row. */
function row(labelKey, control, className = "") {
    return createElement("label", {
        className,
        children: [document.createTextNode(`${t(labelKey)} `), control]
    });
}

function clockSwitch(index, field, labelKey, className = "") {
    const { label, input } = createLabeledInput({ labelKey, type: "checkbox", className });
    bindClockField(input, index, field);
    return { label, input };
}

function slider(range) {
    return createElement("input", { attrs: { type: "range", min: range.min, max: range.max, step: range.step ?? 1 } });
}

/** A collapsible block whose open state survives re-rendering. */
function collapsible(id, titleKey, children, className = "") {
    const details = createElement("details", { className: `clock-block ${className}`.trim() });
    details.open = openBlocks.has(id);
    details.addEventListener("toggle", () => {
        if (details.open) openBlocks.add(id);
        else openBlocks.delete(id);
    });
    details.append(
        createElement("summary", { children: [createIcon("chevron", { className: "block-chevron" }), document.createTextNode(t(titleKey))] }),
        createElement("div", { className: "clock-block-content", children })
    );
    return details;
}

// ──────────────────────────────── Tabs ────────────────────────────────

function renderTabs() {
    const list = clocks();
    const tabs = list.map((clock, index) => {
        const tab = createElement("button", {
            className: `clock-tab${index === selectedIndex ? " selected" : ""}`,
            text: clockName(clock),
            attrs: { type: "button", role: "tab", "aria-selected": String(index === selectedIndex) }
        });
        tab.addEventListener("click", () => selectClock(index));
        return tab;
    });

    const addButton = createElement("button", {
        className: "clock-tab clock-tab-add",
        attrs: { type: "button", title: t("time_and_date_section_add_clock_button"), hidden: list.length >= MAX_CLOCKS },
        children: [createIcon("plus")]
    });
    addButton.addEventListener("click", addClock);

    tabsContainer.replaceChildren(...tabs, addButton);
}

function selectClock(index) {
    selectedIndex = index;
    renderTabs();
    renderEditor();
}

// ──────────────────────────────── Editor ────────────────────────────────

function createStyleSwitch(index, editor) {
    const buttons = STYLES.map(({ value, labelKey }) => {
        const button = createElement("button", { className: "segmented-option", text: t(labelKey), attrs: { type: "button", "data-value": value } });
        button.addEventListener("click", () => {
            updateSettings(settings => { getActiveTheme(settings).clocks[index].style = value; });
            showStyle(value);
        });
        return button;
    });
    const showStyle = value => {
        editor.dataset.style = value;
        for (const button of buttons) button.classList.toggle("selected", button.dataset.value === value);
    };
    showStyle(clocks()[index].style);
    return createElement("div", { className: "segmented", attrs: { role: "group" }, children: buttons });
}

function createCityControls(index, timeZoneSelect) {
    const { label, input: toggle } = clockSwitch(index, "showLabel", "clock_show_label");
    const text = createElement("input", {
        className: "clock-label-input",
        attrs: { type: "text", maxlength: 40, title: t("clock_label_title") }
    });
    bindClockField(text, index, "label");

    const update = () => {
        text.placeholder = defaultClockLabel(timeZoneSelect.value);
        text.hidden = !toggle.checked;
    };
    update();
    toggle.addEventListener("change", update);
    timeZoneSelect.addEventListener("change", update);
    return [label, text];
}

function createShadowControls(index, target) {
    const field = `${target}Shadow`;
    const controls = SHADOW_SLIDERS.map(({ key, labelKey, ...range }) => {
        const input = slider(range);
        bindControl(input, {
            get: settings => getActiveTheme(settings).clocks[index]?.[field][key],
            set: (settings, value) => { getActiveTheme(settings).clocks[index][field][key] = value; },
            defaultValue: () => getDefaultClock(activeMode())[field][key],
            debounceMs: SLIDER_DEBOUNCE_MS
        });
        return row(labelKey, input);
    });

    const color = createElement("input", { attrs: { type: "color" } });
    bindControl(color, {
        get: settings => getActiveTheme(settings).clocks[index]?.[field].color,
        set: (settings, value) => { getActiveTheme(settings).clocks[index][field].color = value; },
        defaultValue: () => getDefaultClock(activeMode())[field].color
    });
    controls.push(row("date_and_time_clocks_customization_shadow_color_label", color));

    return collapsible(`${target}-shadow`, "clock_shadow_title", controls, "clock-shadow");
}

/** Font, color, size and shadow of the time or the date text. */
function createTextAppearance(index, target) {
    const clock = clocks()[index];
    const isTime = target === "time";
    const font = bindClockField(createFontSelect(clock[`${target}Font`]), index, `${target}Font`);
    const color = bindClockField(createElement("input", { attrs: { type: "color" } }), index, `${target}Color`);
    const size = bindClockField(slider(isTime ? CLOCK_TIME_SIZE : CLOCK_DATE_SIZE), index, `${target}Size`, { debounceMs: SLIDER_DEBOUNCE_MS });

    return createElement("div", {
        className: "clock-text-group",
        children: [
            createElement("h4", { text: t(isTime ? "clock_group_time" : "clock_group_date") }),
            // The analog face has no font; its hands use the time color.
            row("clock_font_label", font, isTime ? "digital-only" : ""),
            row("date_and_time_clocks_customization_shadow_color_label", color),
            row("clock_size_label", size),
            createShadowControls(index, target)
        ]
    });
}

function createRemoveButton(index) {
    const button = createElement("button", {
        className: "sidebar-wide-button reset-button",
        attrs: { type: "button" },
        children: [createIcon("trash"), document.createTextNode(t("clock_remove_button_title"))]
    });
    button.addEventListener("click", async () => {
        await updateSettings(settings => {
            const list = getActiveTheme(settings).clocks;
            if (list.length > 1) list.splice(index, 1);
        });
    });
    return button;
}

function createClockEditor(index) {
    const clock = clocks()[index];
    const editor = createElement("div", { className: "clock-editor" });

    const timeZoneSelect = bindClockField(createTimeZoneSelect(clock.timezone), index, "timezone");
    const timeFormat = bindClockField(createSelect(TIME_FORMAT_OPTIONS), index, "timeFormat");
    const dateFormat = bindClockField(createSelect(dateFormatOptions()), index, "dateFormat");

    editor.append(
        createStyleSwitch(index, editor),
        row("date_and_time_clocks_customization_timezone_label", timeZoneSelect),
        row("date_and_time_clocks_customization_time_format_label", timeFormat, "digital-only"),
        row("date_and_time_clocks_customization_date_format_label", dateFormat),
        clockSwitch(index, "showSeconds", "clock_show_seconds").label,
        clockSwitch(index, "blinkColon", "clock_blink_colon", "digital-only").label,
        ...createCityControls(index, timeZoneSelect),
        collapsible("appearance", "clock_appearance_title", [
            createTextAppearance(index, "time"),
            createTextAppearance(index, "date")
        ], "clock-appearance")
    );
    if (clocks().length > 1) editor.append(createRemoveButton(index));
    return editor;
}

function renderEditor() {
    const count = clocks().length;
    selectedIndex = Math.min(selectedIndex, count - 1);
    editorContainer.replaceChildren(createClockEditor(selectedIndex));
    layoutRow.hidden = count < 2;
}

function renderAll() {
    renderTabs();
    renderEditor();
}

async function addClock() {
    const count = clocks().length;
    if (count >= MAX_CLOCKS) return;
    selectedIndex = count; // open the new clock right away
    await updateSettings(settings => {
        getActiveTheme(settings).clocks.push(getDefaultClock(settings.background.mode));
    });
}

async function resetTimeAndDate() {
    await updateSettings(settings => {
        const theme = getActiveTheme(settings);
        const defaults = getDefaultTheme(settings.background.mode);
        // Links color shares the theme but has its own reset, so it is kept.
        Object.assign(theme, defaults, { linksColor: theme.linksColor });
    });
    renderAll();
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

    renderAll();
    resetButton.addEventListener("click", resetTimeAndDate);

    subscribe(settings => [settings.background.mode, getActiveTheme(settings).clocks.length], () => {
        renderAll();
        syncBoundControls();
    });
    // Tab names follow the city / own label while typing, without rebuilding the editor.
    subscribe(settings => getActiveTheme(settings).clocks.map(clock => [clock.label, clock.timezone]), renderTabs);
    onExternalChange(renderAll);
}
