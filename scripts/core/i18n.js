/**
 * UI translations from settings/localization.json: { key: { en, ru, pl, de, es, be, uk } }.
 *
 * Markup attributes:
 *   data-i18n="key"             – replaces the element's own text (child elements are kept)
 *   data-i18n-html="key"        – replaces innerHTML (only for trusted strings from the dictionary)
 *   data-i18n-placeholder="key" – sets the placeholder
 *   data-i18n-title="key"       – sets the tooltip
 */
import { DEFAULT_LOCALE } from "./defaults.js";

let dictionary = {};
let currentLocale = DEFAULT_LOCALE;

export async function initI18n(locale) {
    currentLocale = locale;
    try {
        const response = await fetch(browser.runtime.getURL("settings/localization.json"));
        dictionary = await response.json();
    } catch (error) {
        console.error("Could not load translations:", error);
        dictionary = {};
    }
    document.documentElement.lang = locale;
}

export function getLocale() {
    return currentLocale;
}

/** Returns the translation for `key`; "{name}" placeholders are filled from `values`. */
export function t(key, values = {}) {
    const entry = dictionary[key];
    let text = entry?.[currentLocale] ?? entry?.[DEFAULT_LOCALE];

    if (text === undefined) {
        console.warn(`Missing translation key: ${key}`);
        return key;
    }

    for (const [name, value] of Object.entries(values)) {
        text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
}

/** Replaces the first non-empty text node, so inputs nested inside labels survive. */
function setOwnText(element, text) {
    const textNodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
    const target = textNodes.find(node => node.nodeValue.trim() !== "") ?? textNodes[0];

    if (!target) {
        element.prepend(document.createTextNode(text));
        return;
    }

    const leading = target.nodeValue.match(/^\s*/)[0];
    const trailing = target.nodeValue.match(/\s*$/)[0];
    target.nodeValue = leading + text + trailing;
}

export function applyTranslations(root = document) {
    for (const element of root.querySelectorAll("[data-i18n]")) {
        setOwnText(element, t(element.dataset.i18n));
    }
    for (const element of root.querySelectorAll("[data-i18n-html]")) {
        // DOMParser never runs scripts; the strings come from our own dictionary anyway.
        const parsed = new DOMParser().parseFromString(t(element.dataset.i18nHtml), "text/html");
        element.replaceChildren(...parsed.body.childNodes);
    }
    for (const element of root.querySelectorAll("[data-i18n-placeholder]")) {
        element.placeholder = t(element.dataset.i18nPlaceholder);
    }
    for (const element of root.querySelectorAll("[data-i18n-title]")) {
        element.title = t(element.dataset.i18nTitle);
    }
}
