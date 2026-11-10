// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";

import { localDateKey, msUntilNextDay, photoFromFeed, pickImageUrl } from "../scripts/backgrounds/photo-of-the-day.js";
import { normalizeSettings } from "../scripts/core/normalize.js";
import { createDefaultSettings } from "../scripts/core/defaults.js";

// Trimmed real `image` entry of the Wikimedia featured feed (2026-11-10).
const FEED_IMAGE = {
    title: "File:Verdun – Cathédrale Notre-Dame – Crypte 2025 08 16.jpg",
    file_page: "https://commons.wikimedia.org/wiki/File:Verdun_%E2%80%93_Cath%C3%A9drale_Notre-Dame_%E2%80%93_Crypte_2025_08_16.jpg",
    thumbnail: {
        source: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Verdun.jpg/960px-Verdun.jpg?utm_source=commons.wikimedia.org",
        width: 640,
        height: 427
    },
    image: { source: "https://upload.wikimedia.org/wikipedia/commons/5/56/Verdun.jpg?utm_source=commons.wikimedia.org", width: 6231, height: 4154 },
    artist: { text: "Andreas F. Borchert" },
    credit: { text: "Self-photographed" },
    license: { type: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0" }
};

test("the thumbnail covers the screen with a width the servers generate", () => {
    assert.equal(pickImageUrl(FEED_IMAGE, 1366), "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Verdun.jpg/1920px-Verdun.jpg");
    assert.equal(pickImageUrl(FEED_IMAGE, 1280), "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Verdun.jpg/1280px-Verdun.jpg");
    // 2560 px is not a generated size (HTTP 400), so wide screens get 3840.
    assert.equal(pickImageUrl(FEED_IMAGE, 2560), "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Verdun.jpg/3840px-Verdun.jpg");
});

test("small originals are used as they are", () => {
    const small = { ...FEED_IMAGE, image: { ...FEED_IMAGE.image, width: 1600 } };
    assert.equal(pickImageUrl(small, 1920), "https://upload.wikimedia.org/wikipedia/commons/5/56/Verdun.jpg");
});

test("feed entries become photos with author and license", () => {
    assert.deepEqual(photoFromFeed(FEED_IMAGE, 1920), {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Verdun.jpg/1920px-Verdun.jpg",
        author: "Andreas F. Borchert",
        sourceUrl: FEED_IMAGE.file_page,
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    });
    assert.equal(photoFromFeed(undefined, 1920), null);
    assert.equal(photoFromFeed({ title: "no image" }, 1920), null);
});

test("the photo changes at local midnight", () => {
    assert.equal(localDateKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
    const lateEvening = new Date(2026, 0, 5, 23, 0, 0);
    assert.equal(msUntilNextDay(lateEvening), 60 * 60 * 1000 + 30 * 1000);
});

test("photo of the day settings are added for existing users and repaired", () => {
    assert.deepEqual(createDefaultSettings().background.photoOfTheDay, { date: "", photo: null });
    assert.deepEqual(normalizeSettings({ background: { mode: "onlinePhoto" } }).background.photoOfTheDay, { date: "", photo: null });

    const broken = { background: { photoOfTheDay: { date: "today", photo: { url: "javascript:alert(1)" } } } };
    assert.deepEqual(normalizeSettings(broken).background.photoOfTheDay, { date: "", photo: null });

    const saved = { date: "2026-11-10", photo: photoFromFeed(FEED_IMAGE, 1920) };
    assert.deepEqual(normalizeSettings({ background: { mode: "photoOfTheDay", photoOfTheDay: saved } }).background.photoOfTheDay, saved);
    assert.equal(normalizeSettings({ background: { mode: "photoOfTheDay" } }).background.mode, "photoOfTheDay");
});
