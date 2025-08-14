const defaultLocale = "en";
let dictionary = {};

async function loadLocalizationSettings() {
    try {
        const res = await fetch('settings/localization.json');
        dictionary = await res.json();
    } catch (err) {
        console.error('Failed to load localization.json:', err);
    }
}

function setTextPreserveChildren(el, text) {
    for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) {
            const leading = node.nodeValue.match(/^\s*/)[0];
            const trailing = node.nodeValue.match(/\s*$/)[0];
            node.nodeValue = leading + text + trailing;
            return;
        }
    }

    for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = text;
            return;
        }
    }

    el.appendChild(document.createTextNode(text));
}

async function getLocalizationByKey(key, locale) {
    if (!dictionary || Object.keys(dictionary).length === 0) {
        await loadLocalizationSettings()
    }

    let text = dictionary[key] && dictionary[key][locale];
    if (text == null) {
        text = dictionary[key] && dictionary[key][defaultLocale];
        if (text == null) {
            return key;
        }
    }

    return text;
}

function applyLocalization(lang) {
    document.querySelectorAll(
        '[data-value-localization-key], [data-placeholder-localization-key], [data-html-localization-key]'
    ).forEach(el => {
        if (el.dataset.valueLocalizationKey) {
            const key = el.dataset.valueLocalizationKey;
            const text = dictionary[key] && dictionary[key][lang];
            if (text == null) return;

            const tag = el.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                el.value = text;
            } else if (tag === 'OPTION') {
                el.innerText = text;
            } else {
                setTextPreserveChildren(el, text);
            }
        }

        if (el.dataset.placeholderLocalizationKey) {
            const key = el.dataset.placeholderLocalizationKey;
            const text = dictionary[key] && dictionary[key][lang];
            if (text != null) el.placeholder = text;
        }

        if (el.dataset.htmlLocalizationKey) {
            const key = el.dataset.htmlLocalizationKey;
            const html = dictionary[key] && dictionary[key][lang];
            if (html != null) el.innerHTML = html;
        }
    });
}
