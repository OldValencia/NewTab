import { getActiveTheme, getSettings, subscribe } from "../core/settings.js";
import { hexToRgba } from "../core/color.js";
import { t } from "../core/i18n.js";
import { createElement } from "../core/utils.js";
import {
    defaultClockLabel,
    formatClockDate,
    formatClockTime,
    formatNumericDate,
    getHandAngles,
    relativeOffset
} from "../core/time-format.js";

const clocksContainer = document.getElementById("multiple-clocks");
const SVG_NS = "http://www.w3.org/2000/svg";

/*
 * The clock time is bold (styles/time.css), but SF Pro Display — the default font up to 1.0.x —
 * shipped only a regular face, so default clocks always looked regular. Inter replaced it and
 * is drawn at regular weight to keep that look.
 */
const REGULAR_WEIGHT_FONTS = new Set(["Inter"]);

// The analog face is this many times the digital font size, so the size slider works for both.
const ANALOG_SIZE_FACTOR = 2.4;

/** Each rendered clock: its settings and the elements that change on every tick. */
let renderedClocks = [];
let tickTimer = null;

function shadowToCss(shadow) {
    if (!shadow || shadow.opacity === 0) return "none";
    return `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${hexToRgba(shadow.color, shadow.opacity)}`;
}

function svgElement(tag, attrs) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
    return element;
}

function hand(length, width, color, tail = 0) {
    const group = svgElement("g", {});
    group.append(svgElement("line", {
        x1: 50, y1: 50 + tail, x2: 50, y2: 50 - length,
        stroke: color, "stroke-width": width, "stroke-linecap": "round"
    }));
    return group;
}

function createAnalogFace(clock) {
    const svg = svgElement("svg", { viewBox: "0 0 100 100", class: "analog-clock", "aria-hidden": "true" });
    const size = `${clock.timeSize * ANALOG_SIZE_FACTOR}px`;
    Object.assign(svg.style, { width: size, height: size });
    const shadow = shadowToCss(clock.timeShadow);
    if (shadow !== "none") svg.style.filter = `drop-shadow(${shadow})`;

    svg.append(svgElement("circle", {
        cx: 50, cy: 50, r: 47, fill: "none", stroke: clock.timeColor, "stroke-opacity": 0.35, "stroke-width": 1.5
    }));
    for (let mark = 0; mark < 12; mark++) {
        const isQuarter = mark % 3 === 0;
        svg.append(svgElement("line", {
            x1: 50, y1: isQuarter ? 6 : 7, x2: 50, y2: isQuarter ? 14 : 11,
            stroke: clock.timeColor, "stroke-width": isQuarter ? 2.5 : 1.5, "stroke-linecap": "round",
            transform: `rotate(${mark * 30} 50 50)`
        }));
    }

    const hands = {
        hour: hand(24, 4.5, clock.timeColor),
        minute: hand(36, 3, clock.timeColor),
        second: hand(40, 1.2, clock.dateColor, 8)
    };
    hands.second.style.display = clock.showSeconds ? "" : "none";
    svg.append(hands.hour, hands.minute, hands.second, svgElement("circle", { cx: 50, cy: 50, r: 2.8, fill: clock.timeColor }));
    return { svg, hands };
}

/** Text with each ":" in its own span, so the colon can blink. */
function setTimeText(element, text, blinkColon) {
    if (!blinkColon) {
        element.textContent = text;
        return;
    }
    const parts = text.split(":").flatMap((part, index) => index === 0
        ? [document.createTextNode(part)]
        : [createElement("span", { className: "clock-colon", text: ":" }), document.createTextNode(part)]);
    element.replaceChildren(...parts);
}

function labelText(clock, now) {
    const name = clock.label.trim() || defaultClockLabel(clock.timezone);
    const offset = relativeOffset(clock.timezone, now);
    if (!offset) return name;
    const value = `${offset.sign}${offset.hours}${offset.minutes ? `:${String(offset.minutes).padStart(2, "0")}` : ""}`;
    return `${name} · ${t("clock_offset_hours", { value })}`;
}

function createClockElement(clock, theme) {
    const label = createElement("div", { className: "clock-label" });
    Object.assign(label.style, {
        fontFamily: `"${clock.dateFont}"`,
        fontSize: `${Math.max(10, Math.round(clock.dateSize * 0.7))}px`,
        color: clock.dateColor,
        textShadow: shadowToCss(clock.dateShadow)
    });
    label.hidden = !clock.showLabel;

    let time;
    let hands = null;
    if (clock.style === "analog") {
        ({ svg: time, hands } = createAnalogFace(clock));
    } else {
        time = createElement("div", { className: "time" });
        Object.assign(time.style, {
            fontFamily: `"${clock.timeFont}"`,
            fontWeight: REGULAR_WEIGHT_FONTS.has(clock.timeFont) ? "400" : "",
            fontSize: `${clock.timeSize}px`,
            color: clock.timeColor,
            textShadow: shadowToCss(clock.timeShadow)
        });
    }
    if (!theme.showTime) time.style.display = "none";

    const date = createElement("div", { className: "date" });
    Object.assign(date.style, {
        fontFamily: `"${clock.dateFont}"`,
        fontSize: `${clock.dateSize}px`,
        color: clock.dateColor,
        textShadow: shadowToCss(clock.dateShadow)
    });
    date.hidden = !theme.showDate;

    const element = createElement("div", {
        className: `time-and-date-element clock-${clock.style}`,
        children: [label, time, date]
    });
    return { clock, element, label, time, hands, date };
}

function updateClock({ clock, label, time, hands, date }, locale, now) {
    if (clock.showLabel) label.textContent = labelText(clock, now);

    if (hands) {
        const angles = getHandAngles(now, clock.timezone);
        for (const name of ["hour", "minute", "second"]) hands[name].setAttribute("transform", `rotate(${angles[name]} 50 50)`);
    } else {
        const text = formatClockTime(now, { format: clock.timeFormat, timeZone: clock.timezone, showSeconds: clock.showSeconds });
        setTimeText(time, text, clock.blinkColon);
    }

    date.textContent = formatClockDate(now, { format: clock.dateFormat, timeZone: clock.timezone, locale });
    date.dataset.tooltip = formatNumericDate(now, clock.timezone);
}

function updateClocks() {
    const now = new Date();
    const locale = getSettings().locale;
    for (const rendered of renderedClocks) updateClock(rendered, locale, now);
}

export function renderClocks() {
    const theme = getActiveTheme(getSettings());
    renderedClocks = theme.clocks.map(clock => createClockElement(clock, theme));
    clocksContainer.classList.toggle("column", theme.clocksLayout === "column");
    clocksContainer.replaceChildren(...renderedClocks.map(rendered => rendered.element));
    updateClocks();
    scheduleTick();
}

/**
 * Updates at the start of every minute, or every second when a clock shows seconds.
 * A chained timeout aligned to the clock does not drift like setInterval.
 */
function scheduleTick() {
    clearTimeout(tickTimer);
    const now = new Date();
    const everySecond = renderedClocks.some(({ clock }) => clock.showSeconds);
    const delay = everySecond
        ? 1000 - now.getMilliseconds()
        : (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    tickTimer = setTimeout(() => {
        updateClocks();
        scheduleTick();
    }, delay + 20);
}

export function initClocks() {
    renderClocks();
    subscribe(settings => getActiveTheme(settings), renderClocks);

    // Timers are throttled in background tabs, so refresh as soon as the tab is visible again.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            updateClocks();
            scheduleTick();
        }
    });
}
