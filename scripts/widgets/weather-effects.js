/**
 * Small animations drawn inside the weather widget (rain, snow, fog, thunder, wind).
 * Styles live in styles/weather.css.
 */
import { createElement } from "../core/utils.js";

const LEAVES = ["🍃", "🍂", "🌿"];
const FOG_CLOUD_IMAGE = "url('data:image/svg+xml;utf8,<svg width=\"200\" height=\"120\" xmlns=\"http://www.w3.org/2000/svg\"><ellipse cx=\"100\" cy=\"60\" rx=\"90\" ry=\"50\" fill=\"white\" fill-opacity=\"0.15\"/></svg>')";

const random = (min, max) => min + Math.random() * (max - min);

function effectContainer(name, children) {
    return createElement("div", { className: `weather-effect ${name}`, children });
}

function rain(dropCount = 30) {
    return effectContainer("rain", Array.from({ length: dropCount }, () => createElement("div", {
        className: "rain-drop",
        style: { left: `${random(0, 100)}%`, top: `-${random(0, 20)}px`, animationDelay: `${random(0, 2)}s` }
    })));
}

function snow() {
    return effectContainer("snow", Array.from({ length: 40 }, () => createElement("div", {
        className: "snow-flake",
        text: "❄️",
        style: {
            left: `${random(0, 100)}%`,
            top: `-${random(0, 20)}px`,
            fontSize: `${random(12, 24)}px`,
            animationDuration: `${random(5, 10)}s`,
            animationDelay: `${random(0, 3)}s`
        }
    })));
}

function fog() {
    return effectContainer("fog", Array.from({ length: 3 }, (_, index) => createElement("div", {
        className: "fog-cloud",
        style: {
            top: `${20 + index * 20}%`,
            left: `${-30 + index * 20}%`,
            backgroundImage: FOG_CLOUD_IMAGE,
            animation: `fogFloat${index} ${40 + index * 10}s linear infinite`
        }
    })));
}

function thunder() {
    return [effectContainer("thunder", []), rain(5)];
}

function wind() {
    return effectContainer("wind", Array.from({ length: 20 }, () => createElement("div", {
        className: "wind-leaf",
        text: LEAVES[Math.floor(Math.random() * LEAVES.length)],
        style: {
            left: `${random(0, 100)}%`,
            top: `${random(0, 100)}px`,
            fontSize: `${random(16, 32)}px`,
            animationDuration: `${random(6, 12)}s`,
            animationDelay: `${random(0, 3)}s`
        }
    })));
}

const EFFECT_BUILDERS = { rain, snow, fog, thunder, wind };

/** Replaces the animations inside `widget` with the given effect names. */
export function showWeatherEffects(widget, effectNames) {
    widget.querySelectorAll(".weather-effect").forEach(element => element.remove());
    for (const name of effectNames) {
        widget.append(...[EFFECT_BUILDERS[name]?.()].flat().filter(Boolean));
    }
}
