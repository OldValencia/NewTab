/**
 * Animations drawn behind the weather widget's content: sun, stars, clouds, fog, rain, snow, hail,
 * thunder and wind. The list of effects comes from describeWeather() in weather-conditions.js.
 * Styles live in styles/weather.css.
 */
import { createElement } from "../core/utils.js";

const LEAVES = ["🍃", "🍂", "🌿"];

const random = (min, max) => min + Math.random() * (max - min);
const pick = items => items[Math.floor(Math.random() * items.length)];

/**
 * A negative delay starts each element somewhere in the middle of its animation,
 * so the widget is already full of rain/snow when it appears instead of filling up.
 */
function animationTiming(minSeconds, maxSeconds) {
    const duration = random(minSeconds, maxSeconds);
    return { animationDuration: `${duration}s`, animationDelay: `-${random(0, duration)}s` };
}

function effectContainer(name, children, style = {}) {
    return createElement("div", { className: `weather-effect weather-effect-${name}`, style, children });
}

/** CSS custom properties can't be set through `element.style.x = ...` (what createElement uses). */
function withCssVariables(element, variables) {
    for (const [name, value] of Object.entries(variables)) element.style.setProperty(name, value);
    return element;
}

function times(count, build) {
    return Array.from({ length: Math.max(1, Math.round(count)) }, build);
}

function sun({ intensity }) {
    return effectContainer("sun", [
        createElement("div", { className: "sun-glow" }),
        createElement("div", { className: "sun-rays" })
    ], { opacity: String(intensity) });
}

function stars({ intensity }) {
    return effectContainer("stars", times(14 * intensity, () => createElement("div", {
        className: "star",
        style: {
            left: `${random(2, 98)}%`,
            top: `${random(4, 90)}%`,
            width: `${random(1.5, 3)}px`,
            ...animationTiming(2, 5)
        }
    })));
}

function clouds({ intensity }) {
    return effectContainer("clouds", times(2 + 2 * intensity, () => createElement("div", {
        className: "cloud-puff",
        style: {
            top: `${random(-20, 45)}%`,
            width: `${random(120, 200)}px`,
            opacity: String(0.12 + 0.12 * intensity),
            ...animationTiming(35, 70)
        }
    })));
}

function fog() {
    return effectContainer("fog", times(5, () => createElement("div", {
        className: "fog-bank",
        style: { top: `${random(15, 85)}%`, ...animationTiming(25, 50) }
    })));
}

function rain({ intensity, windy }) {
    const length = 8 + 5 * Math.min(intensity, 1.6);
    const isDrizzle = intensity < 0.5;
    const container = effectContainer("rain", times(26 * intensity, () => createElement("div", {
        className: "rain-drop",
        style: {
            left: `${random(-10, 100)}%`,
            height: `${length}px`,
            ...animationTiming(isDrizzle ? 1.4 : 0.7, isDrizzle ? 2 : 1.1)
        }
    })));
    return withCssVariables(container, { "--drift": windy ? "60px" : "8px", "--angle": windy ? "-20deg" : "-4deg" });
}

function snow({ intensity }) {
    return effectContainer("snow", times(26 * intensity, () => {
        const size = random(2, 5);
        const flake = createElement("div", {
            className: "snow-flake",
            style: { left: `${random(0, 100)}%`, width: `${size}px`, height: `${size}px`, ...animationTiming(5, 10) }
        });
        return withCssVariables(flake, { "--sway": `${random(-14, 14)}px` });
    }));
}

function hail({ intensity }) {
    return effectContainer("hail", times(18 * intensity, () => createElement("div", {
        className: "hail-stone",
        style: { left: `${random(0, 100)}%`, ...animationTiming(0.7, 1.1) }
    })));
}

function thunder() {
    // Flash and bolt share the duration and delay, so the bolt shows exactly when the sky lights up.
    const timing = animationTiming(5, 8);
    return effectContainer("thunder", [
        createElement("div", { className: "lightning-flash", style: timing }),
        createElement("div", { className: "lightning-bolt", style: { left: `${random(20, 75)}%`, ...timing } })
    ]);
}

function wind({ leaves }) {
    const streaks = times(7, () => createElement("div", {
        className: "wind-streak",
        style: { top: `${random(5, 95)}%`, width: `${random(30, 70)}px`, ...animationTiming(1.2, 2.4) }
    }));
    const flyingLeaves = leaves ? times(5, () => createElement("div", {
        className: "wind-leaf",
        text: pick(LEAVES),
        style: { top: `${random(5, 80)}%`, fontSize: `${random(12, 20)}px`, ...animationTiming(4, 8) }
    })) : [];
    return effectContainer("wind", [...streaks, ...flyingLeaves]);
}

const EFFECT_BUILDERS = { sun, stars, clouds, fog, rain, snow, hail, thunder, wind };

/**
 * Replaces the animations inside `widget`.
 * @param {{ name: string, intensity: number }[]} effects
 */
export function showWeatherEffects(widget, effects) {
    widget.querySelectorAll(".weather-effect").forEach(element => element.remove());
    const layers = effects.map(effect => EFFECT_BUILDERS[effect.name]?.(effect)).filter(Boolean);
    widget.prepend(...layers);
}
