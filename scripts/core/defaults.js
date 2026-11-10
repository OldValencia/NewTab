import { EFFECTS, IMAGE_MODES } from "../backgrounds/registry.js";

export const SCHEMA_VERSION = 2;
export const MAX_CLOCKS = 3;
export const MAX_LINKS = 30;
export const DEFAULT_LOCALE = "en";
export const DEFAULT_FONT = "Inter";
export const CLOCK_STYLES = ["digital", "analog"];
export const CLOCK_LAYOUTS = ["row", "column"];
/** Font sizes in px; the defaults are the sizes every clock had before they became adjustable. */
export const CLOCK_TIME_SIZE = { min: 24, max: 160, default: 64 };
export const CLOCK_DATE_SIZE = { min: 10, max: 48, default: 20 };
export const MAX_CLOCK_LABEL_LENGTH = 40;

/** Every background mode: procedural effects plus image modes. */
export const BACKGROUND_MODES = [...EFFECTS.map(effect => effect.id), ...IMAGE_MODES];

const NO_SHADOW = { color: "#000000", opacity: 0, blur: 0, offsetX: 0, offsetY: 0 };

function clock({ timeFont, timeColor, dateFont = timeFont, dateColor, timeFormat = "24", timeShadow = NO_SHADOW, dateShadow = NO_SHADOW }) {
    return {
        timeFont,
        timeColor,
        dateFont,
        dateColor,
        timeFormat,
        dateFormat: "day-month-year",
        timezone: "local",
        timeShadow: { ...timeShadow },
        dateShadow: { ...dateShadow },
        // Added in 1.1.0; the defaults keep clocks looking as before.
        style: "digital",
        timeSize: CLOCK_TIME_SIZE.default,
        dateSize: CLOCK_DATE_SIZE.default,
        showSeconds: false,
        blinkColon: false,
        showLabel: false,
        label: "" // empty = the city of the time zone (defaultClockLabel)
    };
}

function theme(linksColor, clockOptions) {
    return { linksColor, showTime: true, showDate: true, clocksLayout: "row", clocks: [clock(clockOptions)] };
}

const PHOTO_SHADOWS = {
    timeShadow: { color: "#000000", opacity: 0.27, blur: 5, offsetX: 2, offsetY: 2 },
    dateShadow: { color: "#000000", opacity: 0.34, blur: 5, offsetX: 1, offsetY: 1 }
};

/** Clock and link styling tuned for each background ("theme"). */
const THEME_DEFAULTS = {
    stars: theme("#ffffff", { timeFont: "Inter", timeColor: "#7e4600", dateColor: "#aaaaaa" }),
    blobFlow: theme("#ffffff", { timeFont: "Verdana", timeColor: "#7e97a5", dateColor: "#c7c7c7" }),
    nebulaDust: theme("#ffffff", { timeFont: "Courier New", timeColor: "#aa6aff", dateFont: "Verdana", dateColor: "#aaaaaa" }),
    glassGrid: theme("#ffffff", { timeFont: "Georgia", timeColor: "#9e6247", dateFont: "Courier New", dateColor: "#aaaaaa" }),
    orbitalRings: theme("#ffffff", { timeFont: "Tahoma", timeColor: "#b9b9b9", dateFont: "Verdana", dateColor: "#b9b9b9" }),
    particleDrift: theme("#ffffff", { timeFont: "Arial", timeColor: "#b9b9b9", dateColor: "#b9b9b9" }),
    cloudySpiral: theme("#15507b", {
        timeFont: "Roboto", timeColor: "#15507b", dateFont: "Open Sans", dateColor: "#15507b", timeFormat: "12",
        timeShadow: { color: "#e2e3fc", opacity: 0.71, blur: 7, offsetX: 0, offsetY: 0 },
        dateShadow: { color: "#e2e3fc", opacity: 0.65, blur: 4, offsetX: 0, offsetY: 0 }
    }),
    solarSystem: theme("#ffffff", {
        timeFont: "Tahoma", timeColor: "#fd7d40", dateColor: "#ffffff",
        timeShadow: { color: "#000000", opacity: 0.87, blur: 19, offsetX: 2, offsetY: 2 }
    }),
    waves: theme("#2974bc", { timeFont: "Inter", timeColor: "#75d5ff", dateColor: "#ffffff", ...PHOTO_SHADOWS }),
    fallingLines: theme("#ffffff", { timeFont: "Helvetica", timeColor: "#770000", dateColor: "#9e9e9e" }),
    floatingCircles: theme("#ffffff", { timeFont: "Courier New", timeColor: "#ced0f0", dateColor: "#ced0f0" }),
    customImage: theme("#ffffff", { timeFont: "Inter", timeColor: "#ffffff", dateColor: "#ffffff", ...PHOTO_SHADOWS }),
    onlinePhoto: theme("#ffffff", { timeFont: "Inter", timeColor: "#ffffff", dateColor: "#ffffff", ...PHOTO_SHADOWS }),
    photoOfTheDay: theme("#ffffff", { timeFont: "Inter", timeColor: "#ffffff", dateColor: "#ffffff", ...PHOTO_SHADOWS })
};

export function getDefaultTheme(mode) {
    return structuredClone(THEME_DEFAULTS[mode] ?? THEME_DEFAULTS.stars);
}

export function getDefaultClock(mode) {
    return getDefaultTheme(mode).clocks[0];
}

export function getDefaultEffectParams(effectId) {
    const effect = EFFECTS.find(item => item.id === effectId);
    return structuredClone(effect?.defaults ?? {});
}

export const DEFAULT_LINKS = [
    { url: "https://youtube.com", label: "YouTube" },
    { url: "https://www.wikipedia.org", label: "Wikipedia" },
    { url: "https://www.firefox.com/en-US/", label: "Mozilla Firefox" }
];

export const DEFAULT_IMAGE_FILTERS = { blur: 0, brightness: 100, vignette: 5, fit: "cover" };

export function createDefaultSettings() {
    const effects = {};
    for (const effect of EFFECTS) {
        effects[effect.id] = getDefaultEffectParams(effect.id);
    }

    const themes = {};
    for (const mode of BACKGROUND_MODES) {
        themes[mode] = getDefaultTheme(mode);
    }

    return {
        schemaVersion: SCHEMA_VERSION,
        locale: DEFAULT_LOCALE,
        background: {
            mode: "stars",
            effects,
            imageFilters: { ...DEFAULT_IMAGE_FILTERS },
            // Different background at night (scripts/backgrounds/schedule.js); off by default.
            // Empty modes are filled with the current background when it is switched on.
            schedule: { enabled: false, dayMode: "", nightMode: "", nightStart: "20:00", dayStart: "07:00" },
            // The Wikimedia Commons picture of the day; `date` is the local day it was loaded for.
            photoOfTheDay: { date: "", photo: null },
            onlinePhoto: {
                query: "",
                interval: "onload",
                current: null,
                queue: [],
                queueQuery: "",
                lastChangedAt: 0
            }
        },
        themes,
        links: {
            items: structuredClone(DEFAULT_LINKS),
            columns: 3,
            visible: true,
            openInNewTab: false,
            underlineOnHover: false,
            useGoogleIcons: false
        },
        weather: {
            enabled: false,
            city: "",
            location: null,
            units: "metric",
            cache: null
        },
        bookmarks: {
            enabled: false,
            openByDefault: false,
            showEmptyFolders: false,
            openInNewTab: false,
            pinned: []
        }
    };
}
