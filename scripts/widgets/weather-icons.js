/**
 * Weather icons drawn as inline SVG (64×64 grid), so they look the same on every OS —
 * emoji differ a lot between Windows, macOS and Linux.
 * Names come from weather-conditions.js.
 */
const SVG_NS = "http://www.w3.org/2000/svg";

const COLORS = {
    sun: "#ffc83d",
    moon: "#f3e9c6",
    cloud: "#e9eef5",
    darkCloud: "#aeb9c7",
    rain: "#6fb7ff",
    snow: "#ffffff",
    hail: "#dde8f5",
    bolt: "#ffd54f",
    fog: "#cbd5e1"
};

// Three overlapping arcs; spans x 9–55, y 15–44 before any transform.
const CLOUD_PATH = "M18 44 H46 A9 9 0 0 0 46 26 A13 13 0 0 0 21 23 A11 11 0 0 0 18 44 Z";

function svgElement(tag, attrs, children = []) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
    element.append(...children);
    return element;
}

function sun(cx, cy, radius) {
    const rays = Array.from({ length: 8 }, (_, index) => {
        const angle = index * Math.PI / 4;
        const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
        return svgElement("line", {
            x1: cx + cos * (radius + 3.5), y1: cy + sin * (radius + 3.5),
            x2: cx + cos * (radius + 8), y2: cy + sin * (radius + 8),
            stroke: COLORS.sun, "stroke-width": 3, "stroke-linecap": "round"
        });
    });
    return svgElement("g", {}, [svgElement("circle", { cx, cy, r: radius, fill: COLORS.sun }), ...rays]);
}

// Crescents: an outer circle with a second circle cut out of its upper right.
// The points are where the two circles cross.
function bigMoon() {
    return svgElement("path", { d: "M30.71 17.06 A15 15 0 1 0 46.17 36.93 A13 13 0 0 1 30.71 17.06 Z", fill: COLORS.moon });
}

function smallMoon() {
    return svgElement("path", { d: "M23.1 14.04 A10 10 0 1 0 33.63 26.68 A8.5 8.5 0 0 1 23.1 14.04 Z", fill: COLORS.moon });
}

function cloud({ dark = false, transform = "" } = {}) {
    return svgElement("path", { d: CLOUD_PATH, fill: dark ? COLORS.darkCloud : COLORS.cloud, transform });
}

function strokes(color, segments) {
    return segments.map(([x1, y1, x2, y2]) => svgElement("line", {
        x1, y1, x2, y2, stroke: color, "stroke-width": 3, "stroke-linecap": "round"
    }));
}

function dots(color, radius, points) {
    return points.map(([cx, cy]) => svgElement("circle", { cx, cy, r: radius, fill: color }));
}

const rainDrops = () => strokes(COLORS.rain, [[24, 49, 20, 58], [33, 49, 29, 58], [42, 49, 38, 58]]);
const heavyRainDrops = () => strokes(COLORS.rain, [[20, 48, 15, 60], [28, 48, 23, 60], [36, 48, 31, 60], [44, 48, 39, 60]]);
const drizzleDrops = () => strokes(COLORS.rain, [
    [22, 50, 21, 53], [31, 50, 30, 53], [40, 50, 39, 53],
    [26, 57, 25, 60], [35, 57, 34, 60], [44, 57, 43, 60]
]);
const bolt = () => svgElement("polygon", { points: "34,40 25,53 32,53 28,63 41,48 34,48 38,40", fill: COLORS.bolt });

const partlyCloud = () => cloud({ transform: "translate(10 12) scale(0.8)" });
const showersCloud = () => cloud({ transform: "translate(10 4) scale(0.8)" });

const ICONS = {
    "clear-day": () => [sun(32, 32, 11)],
    "clear-night": () => [bigMoon()],
    "partly-day": () => [sun(23, 23, 8), partlyCloud()],
    "partly-night": () => [smallMoon(), partlyCloud()],
    "showers-day": () => [sun(21, 20, 7), showersCloud(), ...strokes(COLORS.rain, [[30, 45, 27, 52], [39, 45, 36, 52], [48, 45, 45, 52]])],
    "showers-night": () => [smallMoon(), showersCloud(), ...strokes(COLORS.rain, [[30, 45, 27, 52], [39, 45, 36, 52], [48, 45, 45, 52]])],
    cloudy: () => [cloud({ transform: "translate(0 5)" })],
    fog: () => [cloud({ transform: "translate(0 -3)" }), ...strokes(COLORS.fog, [[14, 50, 50, 50], [20, 57, 46, 57]])],
    drizzle: () => [cloud(), ...drizzleDrops()],
    rain: () => [cloud({ dark: true }), ...rainDrops()],
    "heavy-rain": () => [cloud({ dark: true }), ...heavyRainDrops()],
    sleet: () => [cloud(), ...strokes(COLORS.rain, [[22, 49, 19, 57], [44, 49, 41, 57]]), ...dots(COLORS.snow, 2.6, [[32, 55]])],
    snow: () => [cloud(), ...dots(COLORS.snow, 2.6, [[22, 52], [32, 57], [42, 52]])],
    "heavy-snow": () => [cloud(), ...dots(COLORS.snow, 2.4, [[19, 51], [29, 51], [39, 51], [24, 59], [34, 59], [44, 59]])],
    thunder: () => [cloud({ dark: true }), bolt()],
    "thunder-hail": () => [cloud({ dark: true }), bolt(), ...dots(COLORS.hail, 2.8, [[19, 55], [47, 55]])]
};

/** @returns {SVGSVGElement} */
export function createWeatherIcon(name, { className = "weather-icon", label = "" } = {}) {
    const draw = ICONS[name] ?? ICONS.cloudy;
    const attrs = { viewBox: "0 0 64 64", class: className };
    Object.assign(attrs, label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" });

    const svg = svgElement("svg", attrs, draw());
    if (label) svg.prepend(svgElement("title", {}, [label]));
    return svg;
}
