import { getActiveTheme, getSettings, subscribe } from "../core/settings.js";
import { hexToRgba } from "../core/color.js";
import { createElement } from "../core/utils.js";
import { formatClockDate, formatClockTime, formatNumericDate } from "../core/time-format.js";

const clocksContainer = document.getElementById("multiple-clocks");

/*
 * The clock time is bold (styles/time.css), but SF Pro Display — the default font up to 1.0.x —
 * shipped only a regular face, so default clocks always looked regular. Inter replaced it and
 * is drawn at regular weight to keep that look.
 */
const REGULAR_WEIGHT_FONTS = new Set(["Inter"]);

function shadowToCss(shadow) {
    if (!shadow || shadow.opacity === 0) return "none";
    return `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${hexToRgba(shadow.color, shadow.opacity)}`;
}

function createClockElement(clock, theme, locale, now) {
    const time = createElement("div", {
        className: "time",
        text: formatClockTime(now, { format: clock.timeFormat, timeZone: clock.timezone })
    });
    Object.assign(time.style, {
        fontFamily: `"${clock.timeFont}"`,
        fontWeight: REGULAR_WEIGHT_FONTS.has(clock.timeFont) ? "400" : "",
        color: clock.timeColor,
        textShadow: shadowToCss(clock.timeShadow)
    });
    time.hidden = !theme.showTime;

    const date = createElement("div", {
        className: "date",
        text: formatClockDate(now, { format: clock.dateFormat, timeZone: clock.timezone, locale }),
        attrs: { "data-tooltip": formatNumericDate(now, clock.timezone) }
    });
    Object.assign(date.style, {
        fontFamily: `"${clock.dateFont}"`,
        color: clock.dateColor,
        textShadow: shadowToCss(clock.dateShadow)
    });
    date.hidden = !theme.showDate;

    return createElement("div", { className: "time-and-date-element", children: [time, date] });
}

export function renderClocks() {
    const settings = getSettings();
    const theme = getActiveTheme(settings);
    const now = new Date();

    clocksContainer.replaceChildren(
        ...theme.clocks.map(clock => createClockElement(clock, theme, settings.locale, now))
    );
}

/** Re-renders at the start of every minute (a chained timeout does not drift like setInterval). */
function scheduleMinuteTick() {
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => {
        renderClocks();
        scheduleMinuteTick();
    }, msToNextMinute + 50);
}

export function initClocks() {
    renderClocks();
    scheduleMinuteTick();
    subscribe(settings => getActiveTheme(settings), renderClocks);

    // Timers are throttled in background tabs, so refresh as soon as the tab is visible again.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) renderClocks();
    });
}
