// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";

import {
    formatClockDate,
    formatClockTime,
    formatUtcOffset,
    legacyOffsetToTimeZone,
    normalizeTimeZone
} from "../scripts/core/time-format.js";

// 2025-07-20 13:05 UTC (summer, so DST is in effect in Europe).
const SUMMER_NOON = new Date(Date.UTC(2025, 6, 20, 13, 5));

test("legacy fixed offsets become Etc/GMT zones (with the inverted IANA sign)", () => {
    assert.equal(legacyOffsetToTimeZone("+3"), "Etc/GMT-3");
    assert.equal(legacyOffsetToTimeZone("-5"), "Etc/GMT+5");
    assert.equal(legacyOffsetToTimeZone("0"), "Etc/GMT");
    assert.equal(legacyOffsetToTimeZone("Europe/Berlin"), null);
});

test("invalid zones fall back to local", () => {
    assert.equal(normalizeTimeZone("Mars/Base"), "local");
    assert.equal(normalizeTimeZone(undefined), "local");
    assert.equal(normalizeTimeZone("Europe/Berlin"), "Europe/Berlin");
});

test("time formats", () => {
    const utc = { timeZone: "Etc/GMT" };
    assert.equal(formatClockTime(SUMMER_NOON, { ...utc, format: "24" }), "13:05");
    assert.equal(formatClockTime(SUMMER_NOON, { ...utc, format: "12" }), "1:05 PM");
    assert.equal(formatClockTime(SUMMER_NOON, { ...utc, format: "arabic" }), "١٣:٠٥");
    assert.equal(formatClockTime(SUMMER_NOON, { ...utc, format: "chinese" }), "下午1:05");
    assert.equal(formatClockTime(SUMMER_NOON, { ...utc, format: "japanese" }), "13時05分");
});

test("the custom format works with any time zone (crashed in 1.0.2)", () => {
    assert.doesNotThrow(() => formatClockTime(SUMMER_NOON, { format: "custom", timeZone: "Etc/GMT-3" }));
    assert.match(formatClockTime(SUMMER_NOON, { format: "custom", timeZone: "Etc/GMT-3" }), /16.05/);
});

test("IANA zones follow daylight saving time", () => {
    assert.equal(formatClockTime(SUMMER_NOON, { format: "24", timeZone: "Europe/Berlin" }), "15:05");
    const winter = new Date(Date.UTC(2025, 0, 20, 13, 5));
    assert.equal(formatClockTime(winter, { format: "24", timeZone: "Europe/Berlin" }), "14:05");
    assert.equal(formatUtcOffset("Europe/Berlin", SUMMER_NOON), "UTC+02:00");
    assert.equal(formatUtcOffset("Asia/Kolkata", SUMMER_NOON), "UTC+05:30");
});

test("date formats use the selected language", () => {
    const options = { timeZone: "Etc/GMT", locale: "ru" };
    assert.equal(formatClockDate(SUMMER_NOON, { ...options, format: "day-month-year" }), "20 Июль 2025");
    assert.equal(formatClockDate(SUMMER_NOON, { ...options, format: "dd-mm-yyyy" }), "20-07-2025");
    assert.equal(formatClockDate(SUMMER_NOON, { ...options, locale: "en", format: "month-day-year" }), "July 20 2025");
});
