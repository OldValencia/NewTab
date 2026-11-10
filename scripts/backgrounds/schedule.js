/**
 * Day / night backgrounds: when enabled, background.mode is switched to schedule.dayMode or
 * schedule.nightMode at the chosen times. Choosing a background in the sidebar list while the
 * schedule is on remembers it for the current part of the day, so the list, the two selects
 * and the per-background clock themes always agree.
 */
import { getSettings, subscribe, updateSettings } from "../core/settings.js";
import { isNightTime } from "../core/time-format.js";

let timerId = null;

function currentSlot(schedule, now = new Date()) {
    return isNightTime(now, schedule.nightStart, schedule.dayStart) ? "nightMode" : "dayMode";
}

/** Switches background.mode to the one for the current part of the day. */
export function applySchedule() {
    const { schedule, mode } = getSettings().background;
    if (!schedule.enabled) return;
    const wanted = schedule[currentSlot(schedule)];
    if (wanted && wanted !== mode) {
        updateSettings(settings => { settings.background.mode = wanted; });
    }
}

/** A background picked in the list becomes the one for the current part of the day. */
function rememberPickedMode() {
    const { schedule, mode } = getSettings().background;
    if (!schedule.enabled) return;
    const slot = currentSlot(schedule);
    if (schedule[slot] !== mode) {
        updateSettings(settings => { settings.background.schedule[slot] = mode; });
    }
}

/** Fills empty slots with the current background when the schedule is switched on. */
function prepareSlots() {
    const { schedule, mode } = getSettings().background;
    if (!schedule.enabled || (schedule.dayMode && schedule.nightMode)) return;
    updateSettings(settings => {
        const slots = settings.background.schedule;
        slots.dayMode ||= mode;
        slots.nightMode ||= mode;
    });
}

function scheduleCheck() {
    clearTimeout(timerId);
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    timerId = setTimeout(() => {
        applySchedule();
        scheduleCheck();
    }, msToNextMinute + 50);
}

/** Call before initBackground(), so the first render already shows the right background. */
export function initBackgroundSchedule() {
    prepareSlots();
    applySchedule();

    subscribe(settings => settings.background.mode, rememberPickedMode);
    subscribe(settings => settings.background.schedule.enabled, () => {
        prepareSlots();
        applySchedule();
    });
    subscribe(settings => {
        const { dayMode, nightMode, dayStart, nightStart } = settings.background.schedule;
        return [dayMode, nightMode, dayStart, nightStart];
    }, applySchedule);

    scheduleCheck();
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) return;
        applySchedule();
        scheduleCheck();
    });
}
