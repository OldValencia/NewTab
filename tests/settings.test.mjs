// Run with: node --test tests/
// Fixtures in tests/fixtures/ were captured from a real Firefox profile running version 1.0.2.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { isLegacySettings, migrateLegacySettings } from "../scripts/core/migration.js";
import { normalizeSettings } from "../scripts/core/normalize.js";
import { BACKGROUND_MODES, createDefaultSettings } from "../scripts/core/defaults.js";

const loadFixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const FRESH = loadFixture("v1.0.2-fresh-install.json");
const CUSTOMIZED = loadFixture("v1.0.2-customized.json");

function withLegacy(base, mutate) {
    const copy = structuredClone(base);
    mutate(copy);
    return copy;
}

test("detects legacy settings", () => {
    assert.equal(isLegacySettings(FRESH), true);
    assert.equal(isLegacySettings(createDefaultSettings()), false);
    assert.equal(isLegacySettings(null), false);
});

test("fresh 1.0.2 install keeps what the user saw", () => {
    const { settings, customImage } = migrateLegacySettings(FRESH);

    assert.equal(customImage, null);
    assert.equal(settings.locale, "en");
    assert.equal(settings.background.mode, "stars");
    assert.deepEqual(settings.links.items.map(link => link.url), FRESH.links.list.map(link => link.url));
    // 1.0.2 never wrote showLinks on a fresh install, so links were hidden.
    assert.equal(settings.links.visible, false);
    assert.equal(settings.links.columns, 3);
    // 1.0.2 loaded all icons through Google, so migrated users keep that (new installs do not).
    assert.equal(settings.links.useGoogleIcons, true);
    assert.equal(createDefaultSettings().links.useGoogleIcons, false);
    assert.equal(settings.weather.enabled, false);
    // Old "#fff" is expanded so the color picker can show it.
    assert.equal(settings.themes.stars.linksColor, "#ffffff");
    assert.equal(settings.background.effects.blobFlow.backgroundColor, "#000000");
    // SF Pro Display is no longer bundled; Inter replaces it.
    assert.equal(settings.themes.stars.clocks[0].timeFont, "Inter");
    assert.equal(settings.themes.stars.clocks[0].dateFont, "Inter");
});

test("customized 1.0.2 profile is fully carried over", () => {
    const { settings } = migrateLegacySettings(CUSTOMIZED);

    assert.equal(settings.locale, "ru");
    assert.equal(settings.background.mode, "blobFlow");
    assert.deepEqual(settings.background.effects.blobFlow, { backgroundColor: "#000000", size: 100, blur: 0 });

    const blobTheme = settings.themes.blobFlow;
    assert.equal(blobTheme.clocks.length, 2);
    assert.equal(blobTheme.clocks[0].timeColor, "#123456");
    assert.equal(blobTheme.clocks[0].timeShadow.blur, 6);
    assert.equal(blobTheme.clocks[0].timeFont, "Verdana");
    assert.equal(settings.themes.stars.linksColor, "#ff8800");

    assert.equal(settings.links.columns, 5);
    assert.equal(settings.links.visible, false);
    assert.equal(settings.weather.enabled, true);
    assert.equal(settings.weather.city, "Warsaw");
    assert.equal(settings.weather.location, null);
    assert.deepEqual(settings.bookmarks, {
        enabled: true,
        openByDefault: true,
        showEmptyFolders: false,
        openInNewTab: false,
        pinned: ["toolbar_____"]
    });
});

test("every background mode always has a theme (fixes the 1.0.1 image-mode crash)", () => {
    // Profiles created by 1.0.1+ had no bg["custom-image"] entry at all.
    const legacy = withLegacy(FRESH, s => { s.bg.bgMode = "custom-image"; });
    const { settings } = migrateLegacySettings(legacy);

    assert.equal(settings.background.mode, "customImage");
    for (const mode of BACKGROUND_MODES) {
        assert.ok(settings.themes[mode].clocks.length >= 1, `theme for ${mode}`);
    }
});

test("custom image moves out of the settings object", () => {
    const image = "data:image/png;base64,iVBORw0KGgo=";
    const legacy = withLegacy(FRESH, s => {
        s.bg.bgMode = "custom-image";
        s.bg.bgSource = "custom";
        s.bg.bgImage = image;
        s.bg.bgBlur = "12";
    });
    const { settings, customImage } = migrateLegacySettings(legacy);

    assert.equal(customImage, image);
    assert.ok(!JSON.stringify(settings).includes("base64"));
    assert.equal(settings.background.imageFilters.blur, 12);
});

test("Pixabay modes become the online photo mode", () => {
    const dynamic = withLegacy(FRESH, s => {
        s.bg.bgMode = "dynamic-search";
        s.bg.bgSource = "dynamic";
        s.bg.bgImage = "https://pixabay.com/get/abc.jpg";
        s.bg.dynamicTag = "mountains";
        s.bg.dynamicInterval = "15";
    });
    const dynamicResult = migrateLegacySettings(dynamic).settings.background;
    assert.equal(dynamicResult.mode, "onlinePhoto");
    assert.equal(dynamicResult.onlinePhoto.query, "mountains");
    assert.equal(dynamicResult.onlinePhoto.interval, "15");
    assert.equal(dynamicResult.onlinePhoto.current.url, "https://pixabay.com/get/abc.jpg");

    const picked = withLegacy(dynamic, s => {
        s.bg.bgMode = "search-image";
        s.bg.bgSource = "search";
    });
    assert.equal(migrateLegacySettings(picked).settings.background.onlinePhoto.interval, "never");
});

test("legacy values with wrong types are repaired", () => {
    const legacy = withLegacy(CUSTOMIZED, s => {
        s.links.showLinks = "true";
        const clock = s.bg.blobFlow.customization.clocks[1];
        clock.timezone = "+3";
        clock.timeFormat = "custom";
        clock.timeShadow.color = null; // 1.0.2 stored NaN (serialized as null) after a right-click reset
        s.bg.stars.customization.elements = 1;
        s.bg.stars.customization.clocks.push({ timeFont: "Arial" }); // hidden leftover clock
    });
    const { settings } = migrateLegacySettings(legacy);
    const clock = settings.themes.blobFlow.clocks[1];

    assert.equal(settings.links.visible, true);
    assert.equal(clock.timezone, "Etc/GMT-3");
    assert.equal(clock.timeFormat, "custom");
    assert.equal(clock.timeShadow.color, "#000000");
    assert.equal(settings.themes.stars.clocks.length, 1);
});

test("weather coordinates from the geolocation button are kept", () => {
    const legacy = withLegacy(FRESH, s => { s.weatherWidget.weatherCity = "52.23,21.01"; });
    const { weather } = migrateLegacySettings(legacy).settings;
    assert.equal(weather.city, "");
    assert.deepEqual(weather.location, { latitude: 52.23, longitude: 21.01, name: "", country: "" });
});

test("icons cached by 1.0.2 are kept only when they belong to the current URL", () => {
    const legacy = withLegacy(FRESH, s => {
        s.links.list[0].cachedUrl = s.links.list[0].url;
        s.links.list[0].cachedFavicon = "data:image/png;base64,AAAA";
        s.links.list[1].cachedUrl = "https://old.example";
        s.links.list[1].cachedFavicon = "data:image/png;base64,BBBB";
    });
    const { items } = migrateLegacySettings(legacy).settings.links;
    assert.equal(items[0].icon, "data:image/png;base64,AAAA");
    assert.equal(items[1].icon, undefined);
});

test("normalizing current settings is idempotent", () => {
    const { settings } = migrateLegacySettings(CUSTOMIZED);
    assert.deepEqual(normalizeSettings(structuredClone(settings)), settings);
    assert.deepEqual(normalizeSettings(createDefaultSettings()), createDefaultSettings());
});

test("garbage input falls back to defaults", () => {
    assert.deepEqual(normalizeSettings(null), createDefaultSettings());
    assert.deepEqual(normalizeSettings("nope"), createDefaultSettings());

    const repaired = normalizeSettings({ background: { mode: "unknown" }, links: { columns: 99, items: [null, 5] } });
    assert.equal(repaired.background.mode, "stars");
    assert.equal(repaired.links.columns, 10);
    assert.deepEqual(repaired.links.items, []);
});
