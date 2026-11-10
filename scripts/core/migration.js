/**
 * Migration from the settings format used by versions up to 1.0.x
 * (localStorage["custom_settings"]) to the current schema.
 *
 * The result is passed through normalizeSettings(), so this file only maps structure;
 * type fixes (string numbers, "rgb()" colors, "true"/"false" strings…) happen there.
 * Pure (no DOM / browser APIs) — covered by tests/settings.test.mjs.
 */
import { isPlainObject } from "./utils.js";
import { normalizeSettings } from "./normalize.js";
import { EFFECTS } from "../backgrounds/registry.js";

/** Old background mode name → new mode name. */
const LEGACY_MODE_NAMES = {
    "custom-image": "customImage",
    "search-image": "onlinePhoto",
    "dynamic-search": "onlinePhoto"
};

const LEGACY_WEATHER_COORDINATES = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export function isLegacySettings(raw) {
    return isPlainObject(raw) && raw.schemaVersion === undefined && (isPlainObject(raw.bg) || isPlainObject(raw.links));
}

function migrateTheme(legacyCustomization) {
    if (!isPlainObject(legacyCustomization)) return undefined;
    const clocks = Array.isArray(legacyCustomization.clocks) ? legacyCustomization.clocks : [];
    // `elements` was the number of visible clocks; extra array entries were never shown.
    const visibleCount = Number(legacyCustomization.elements) || 1;

    return {
        linksColor: legacyCustomization.linksColor,
        showTime: legacyCustomization.showTime,
        showDate: legacyCustomization.showDate,
        clocks: clocks.slice(0, visibleCount)
    };
}

function migrateThemes(bg) {
    const themes = {};

    for (const effect of EFFECTS) {
        themes[effect.id] = migrateTheme(bg[effect.id]?.customization);
    }

    themes.customImage = migrateTheme(bg["custom-image"]?.customization);

    // Both Pixabay modes become the "online photo" mode; prefer the one the user was using.
    const photoModeOrder = bg.bgMode === "search-image"
        ? ["search-image", "dynamic-search"]
        : ["dynamic-search", "search-image"];
    for (const legacyMode of photoModeOrder) {
        const theme = migrateTheme(bg[legacyMode]?.customization);
        if (theme) {
            themes.onlinePhoto = theme;
            break;
        }
    }

    return themes;
}

function migrateEffects(bg) {
    const effects = {};
    for (const effect of EFFECTS) {
        if (!isPlainObject(bg[effect.id])) continue;
        const { customization, ...params } = bg[effect.id];
        effects[effect.id] = params;
    }
    return effects;
}

function migrateOnlinePhoto(bg) {
    const hasPhoto = typeof bg.bgImage === "string" && /^https?:\/\//.test(bg.bgImage)
        && (bg.bgSource === "search" || bg.bgSource === "dynamic");

    return {
        query: bg.dynamicTag,
        // "Search image" showed one picked photo forever; "never" keeps that behavior.
        interval: bg.bgMode === "search-image" ? "never" : (bg.dynamicInterval || "onload"),
        current: hasPhoto ? { url: bg.bgImage } : null,
        lastChangedAt: Number(bg.dynamicBgLast) || 0
    };
}

function migrateBackground(bg) {
    return {
        mode: LEGACY_MODE_NAMES[bg.bgMode] ?? bg.bgMode,
        effects: migrateEffects(bg),
        imageFilters: {
            blur: bg.bgBlur,
            brightness: bg.bgBrightness,
            vignette: bg.bgVignette,
            fit: bg.bgFit
        },
        onlinePhoto: migrateOnlinePhoto(bg)
    };
}

function migrateLinks(legacy) {
    const links = isPlainObject(legacy.links) ? legacy.links : {};
    const items = Array.isArray(links.list) ? links.list : undefined;

    return {
        items: items?.map(item => ({
            url: item?.url,
            label: item?.label,
            // Keep the icon cached by 1.0.2 so existing links look exactly the same.
            icon: item?.cachedUrl === item?.url ? item?.cachedFavicon : undefined
        })),
        columns: legacy.cols,
        // 1.0.x stored this as true / "true" / "false" / missing, and only true or "true" meant visible
        // after a reload ("false" was a bug that also showed links; missing hid them).
        visible: links.showLinks === true || links.showLinks === "true",
        openInNewTab: links.openInNewTabState,
        underlineOnHover: links.underlineLinksOnHover,
        // 1.0.x loaded every icon through Google; keep that so icons look the same after the update.
        useGoogleIcons: true
    };
}

function migrateWeather(legacy) {
    const weather = isPlainObject(legacy.weatherWidget) ? legacy.weatherWidget : {};
    const savedPlace = typeof weather.weatherCity === "string" ? weather.weatherCity.trim() : "";
    const coordinates = savedPlace.match(LEGACY_WEATHER_COORDINATES);

    return {
        enabled: weather.showWeather === true,
        // A city name is geocoded again on first load; "lat,lon" came from the geolocation button.
        city: coordinates ? "" : savedPlace,
        location: coordinates
            ? { latitude: Number(coordinates[1]), longitude: Number(coordinates[2]), name: "", country: "" }
            : null,
        cache: null
    };
}

function migrateBookmarks(legacy) {
    const bookmarks = isPlainObject(legacy.bookmarks) ? legacy.bookmarks : {};
    return {
        enabled: bookmarks.show,
        openByDefault: bookmarks.alwaysOpen,
        showEmptyFolders: bookmarks.showEmptyFolders,
        openInNewTab: bookmarks.openBookmarksInNewTab,
        pinned: bookmarks.pinnedBookmarks
    };
}

/**
 * @returns {{ settings: object, customImage: string | null }}
 *   customImage is the uploaded picture (a data: URL), which is now stored separately.
 */
export function migrateLegacySettings(legacy) {
    const bg = isPlainObject(legacy.bg) ? legacy.bg : {};
    const customImage = bg.bgSource === "custom" && typeof bg.bgImage === "string" && bg.bgImage.startsWith("data:image/")
        ? bg.bgImage
        : null;

    const migrated = {
        locale: legacy.locale,
        background: migrateBackground(bg),
        themes: migrateThemes(bg),
        links: migrateLinks(legacy),
        weather: migrateWeather(legacy),
        bookmarks: migrateBookmarks(legacy)
    };

    return { settings: normalizeSettings(migrated), customImage };
}
