/**
 * Line icons for the sidebars (24×24 grid, drawn with currentColor), so they look the same on every OS
 * and follow the text color. Weather has its own colored icons in widgets/weather-icons.js.
 *
 * In markup: <span data-icon="clock"></span> — filled by applyIcons() at startup.
 */
const SVG_NS = "http://www.w3.org/2000/svg";

/** Each icon is a list of [tag, attributes]. */
const ICONS = {
    clock: [["circle", { cx: 12, cy: 12, r: 9 }], ["path", { d: "M12 7v5l3 2" }]],
    link: [
        ["path", { d: "M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" }],
        ["path", { d: "M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" }]
    ],
    image: [
        ["rect", { x: 3, y: 4, width: 18, height: 16, rx: 2.5 }],
        ["circle", { cx: 9, cy: 9.5, r: 1.5 }],
        ["path", { d: "M21 15.5l-5-5L5.5 20" }]
    ],
    cloud: [["path", { d: "M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.3 4.6 4.6 0 0 0 7 18.5z" }]],
    keyboard: [
        ["rect", { x: 2.5, y: 6, width: 19, height: 12, rx: 2.5 }],
        ["path", { d: "M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" }]
    ],
    globe: [
        ["circle", { cx: 12, cy: 12, r: 9 }],
        ["path", { d: "M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" }]
    ],
    backup: [["path", { d: "M12 3.5v11m0 0l-4-4m4 4l4-4M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" }]],
    bookmark: [["path", { d: "M6.5 3.5h11v17l-5.5-4-5.5 4z" }]],
    star: [["path", { d: "M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" }]],
    folder: [["path", { d: "M3.5 7.5a2 2 0 0 1 2-2h3.8l2 2h7.2a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" }]],
    chevron: [["path", { d: "M9 6l6 6-6 6" }]],
    search: [["circle", { cx: 11, cy: 11, r: 6.5 }], ["path", { d: "M20 20l-4.4-4.4" }]],
    pencil: [["path", { d: "M4.5 19.5h4l10-10-4-4-10 10z" }], ["path", { d: "M13 7l4 4" }]],
    trash: [["path", { d: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" }]],
    check: [["path", { d: "M5 12.5l4.5 4.5L19 7.5" }]],
    close: [["path", { d: "M6.5 6.5l11 11M17.5 6.5l-11 11" }]],
    plus: [["path", { d: "M12 5v14M5 12h14" }]],
    minus: [["path", { d: "M5 12h14" }]],
    menu: [["path", { d: "M4 7h16M4 12h16M4 17h16" }]],
    reset: [["path", { d: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" }]],
    "collapse-all": [["path", { d: "M8 10.5l4-4 4 4M8 17.5l4-4 4 4" }]]
};

function svgElement(tag, attrs) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
    return element;
}

/** @returns {SVGSVGElement} a decorative icon (hidden from screen readers; label the button instead) */
export function createIcon(name, { className = "", filled = false } = {}) {
    const svg = svgElement("svg", {
        viewBox: "0 0 24 24",
        class: `ui-icon ${className}`.trim(),
        fill: filled ? "currentColor" : "none",
        stroke: "currentColor",
        "stroke-width": 1.8,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true",
        "data-icon-name": name
    });
    for (const [tag, attrs] of ICONS[name] ?? []) svg.append(svgElement(tag, attrs));
    return svg;
}

/** Puts the icon named in data-icon into each element (once; text and other children are kept). */
export function applyIcons(root = document) {
    for (const element of root.querySelectorAll("[data-icon]")) {
        if (element.querySelector(":scope > .ui-icon")) continue;
        element.prepend(createIcon(element.dataset.icon));
    }
}
