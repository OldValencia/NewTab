// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";

import { isNightTime } from "../scripts/core/time-format.js";
import { normalizeSettings } from "../scripts/core/normalize.js";
import { createDefaultSettings } from "../scripts/core/defaults.js";

const at = (hours, minutes = 0) => new Date(2026, 0, 15, hours, minutes);

test("night that crosses midnight (20:00 → 07:00)", () => {
    assert.equal(isNightTime(at(19, 59), "20:00", "07:00"), false);
    assert.equal(isNightTime(at(20, 0), "20:00", "07:00"), true);
    assert.equal(isNightTime(at(0, 30), "20:00", "07:00"), true);
    assert.equal(isNightTime(at(6, 59), "20:00", "07:00"), true);
    assert.equal(isNightTime(at(7, 0), "20:00", "07:00"), false);
});

test("night inside one day (01:00 → 09:00) and equal times", () => {
    assert.equal(isNightTime(at(0, 59), "01:00", "09:00"), false);
    assert.equal(isNightTime(at(3, 0), "01:00", "09:00"), true);
    assert.equal(isNightTime(at(9, 0), "01:00", "09:00"), false);
    assert.equal(isNightTime(at(12, 0), "08:00", "08:00"), false);
});

test("the schedule is off for existing users and broken values are repaired", () => {
    const defaults = createDefaultSettings().background.schedule;
    assert.deepEqual(defaults, { enabled: false, dayMode: "", nightMode: "", nightStart: "20:00", dayStart: "07:00" });
    assert.deepEqual(normalizeSettings({ background: { mode: "waves" } }).background.schedule, defaults);

    const broken = { background: { schedule: { enabled: "true", dayMode: "lava", nightMode: "waves", nightStart: "25:00", dayStart: "6:00" } } };
    assert.deepEqual(normalizeSettings(broken).background.schedule,
        { enabled: true, dayMode: "", nightMode: "waves", nightStart: "20:00", dayStart: "07:00" });
});
