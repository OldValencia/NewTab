/**
 * Inputs bound to a settings value.
 * Right-clicking a bound input resets it to its default (documented in the Hotkeys section).
 */
import { getSettings, updateSettings } from "../core/settings.js";
import { createElement, debounce } from "../core/utils.js";
import { t } from "../core/i18n.js";

const boundControls = new Set();

function valueProperty(input) {
    return input.type === "checkbox" ? "checked" : "value";
}

function changeEvent(input) {
    return input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "input";
}

function parseValue(input) {
    if (input.type === "checkbox") return input.checked;
    if (input.type === "range" || input.type === "number") return Number(input.value);
    return input.value;
}

/**
 * @param {HTMLInputElement | HTMLSelectElement} input
 * @param {object} binding
 * @param {(settings) => any} binding.get           reads the value from settings
 * @param {(settings, value) => void} binding.set   writes the value into settings
 * @param {any | (() => any)} [binding.defaultValue] value restored on right-click
 * @param {number} [binding.debounceMs]             delay saving (for expensive re-renders)
 */
export function bindControl(input, { get, set, defaultValue, debounceMs = 0 }) {
    const property = valueProperty(input);
    const sync = () => {
        input[property] = get(getSettings());
    };
    const save = value => updateSettings(settings => set(settings, value));
    const saveSoon = debounceMs > 0 ? debounce(save, debounceMs) : save;

    input.addEventListener(changeEvent(input), () => saveSoon(parseValue(input)));

    if (defaultValue !== undefined) {
        input.addEventListener("contextmenu", event => {
            event.preventDefault();
            const value = typeof defaultValue === "function" ? defaultValue() : defaultValue;
            input[property] = value;
            save(value);
        });
    }

    sync();
    boundControls.add({ input, sync });
    return input;
}

/** Re-reads every bound input that is still on the page from the current settings. */
export function syncBoundControls() {
    for (const control of boundControls) {
        if (control.input.isConnected) control.sync();
        else boundControls.delete(control);
    }
}

/** `<label>Text <input></label>` for color / range / checkbox controls. */
export function createLabeledInput({ labelKey, type, min, max, step, className }) {
    const input = createElement("input", { attrs: { type, min, max, step } });
    const label = createElement("label", {
        className,
        children: [document.createTextNode(`${t(labelKey)} `), input]
    });
    return { label, input };
}

/** @param {{ value: string, label?: string, labelKey?: string }[]} options */
export function createSelect(options, { className } = {}) {
    const select = createElement("select", { className });
    for (const { value, label, labelKey } of options) {
        select.append(createElement("option", { text: label ?? t(labelKey), attrs: { value } }));
    }
    return select;
}
