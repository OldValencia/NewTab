const HEX_6 = /^#[0-9a-f]{6}$/i;
const HEX_3 = /^#[0-9a-f]{3}$/i;
const RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i;

export function isHexColor(value) {
    return typeof value === "string" && HEX_6.test(value);
}

/**
 * Converts "#abc", "#aabbcc" or "rgb(1, 2, 3)" to lowercase "#rrggbb".
 * Returns the fallback for anything else.
 */
export function normalizeHexColor(value, fallback = "#000000") {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();

    if (HEX_6.test(trimmed)) return trimmed.toLowerCase();

    if (HEX_3.test(trimmed)) {
        const [r, g, b] = trimmed.slice(1);
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    const rgbMatch = trimmed.match(RGB);
    if (rgbMatch) {
        const channels = rgbMatch.slice(1, 4).map(channel => Math.min(255, Number(channel)));
        return "#" + channels.map(channel => channel.toString(16).padStart(2, "0")).join("");
    }

    return fallback;
}

function hexToChannels(hex) {
    const normalized = normalizeHexColor(hex);
    const number = parseInt(normalized.slice(1), 16);
    return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

export function hexToRgba(hex, alpha = 1) {
    const [r, g, b] = hexToChannels(hex);
    return `rgba(${r},${g},${b},${alpha})`;
}

/** Lightens (positive amount) or darkens (negative amount) a color; amount is a fraction of 255. */
export function adjustColor(hex, amount) {
    const delta = Math.round(255 * amount);
    const channels = hexToChannels(hex).map(channel => Math.min(255, Math.max(0, channel + delta)));
    return "#" + channels.map(channel => channel.toString(16).padStart(2, "0")).join("");
}
