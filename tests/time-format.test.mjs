// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";

import {
    defaultClockLabel,
    formatClockDate,
    formatClockTime,
    formatUtcOffset,
    getHandAngles,
    legacyOffsetToTimeZone,
    normalizeTimeZone,
    relativeOffset
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

test("seconds are added to every time format when asked", () => {
    const moment = new Date(Date.UTC(2025, 6, 20, 13, 45, 7));
    const withSeconds = format => formatClockTime(moment, { format, timeZone: "UTC", showSeconds: true });
    assert.equal(withSeconds("24"), "13:45:07");
    assert.equal(withSeconds("12"), "1:45:07 PM");
    assert.equal(withSeconds("arabic"), "١٣:٤٥:٠٧");
    assert.equal(withSeconds("chinese"), "下午1:45:07");
    assert.equal(withSeconds("japanese"), "13時45分07秒");
    // Without the option nothing changes compared to 1.0.x.
    assert.equal(formatClockTime(moment, { format: "24", timeZone: "UTC" }), "13:45");
});

test("the weekday date format is grammatical in every language", () => {
    const date = locale => formatClockDate(SUMMER_NOON, { format: "weekday", timeZone: "UTC", locale });
    assert.equal(date("en"), "Sunday, July 20");
    assert.equal(date("ru"), "Воскресенье, 20 июля");
    assert.equal(date("uk"), "Неділя, 20 липня");
    assert.equal(date("de"), "Sonntag, 20. Juli");
});

test("clock labels default to the city of the time zone", () => {
    assert.equal(defaultClockLabel("Asia/Tokyo"), "Tokyo");
    assert.equal(defaultClockLabel("America/New_York"), "New York");
    assert.equal(defaultClockLabel("Etc/GMT-3"), "UTC+3");
    assert.equal(defaultClockLabel("Etc/GMT+5"), "UTC−5");
    assert.equal(defaultClockLabel("Etc/GMT"), "UTC");
    assert.ok(defaultClockLabel("local").length > 0);
});

test("relative offset is empty for the computer's own zone", () => {
    const ownZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    assert.equal(relativeOffset("local"), null);
    assert.equal(relativeOffset(ownZone), null);
    // Half-hour zones keep their minutes: Kolkata is 5:30 ahead of UTC.
    const fromUtc = relativeOffset("Asia/Kolkata", SUMMER_NOON);
    const utc = relativeOffset("UTC", SUMMER_NOON);
    const toMinutes = offset => (offset ? (offset.sign === "+" ? 1 : -1) * (offset.hours * 60 + offset.minutes) : 0);
    assert.equal(toMinutes(fromUtc) - toMinutes(utc), 330);
});

test("analog hands point at the right marks", () => {
    const angles = getHandAngles(new Date(Date.UTC(2025, 6, 20, 15, 30, 0)), "UTC");
    assert.equal(angles.hour, 105); // halfway between 3 and 4
    assert.equal(angles.minute, 180);
    assert.equal(angles.second, 0);
});

test("UTC offsets do not lose a minute late in the minute", () => {
    const lateInMinute = new Date(Date.UTC(2025, 6, 20, 13, 5, 50));
    assert.equal(formatUtcOffset("Asia/Tokyo", lateInMinute), "UTC+09:00");
    assert.equal(formatUtcOffset("America/St_Johns", lateInMinute), "UTC-02:30");
});
