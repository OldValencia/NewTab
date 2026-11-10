import { backgroundColorControl, particlesColorControl } from "../controls-presets.js";
import { hexToRgba } from "../../core/color.js";

/** Horizontal offset and animation delay for each line, from the center outwards. */
const LINE_LAYOUT = [
    { marginLeft: "-25%", delay: "2s" },
    { marginLeft: "0", delay: "0s" },
    { marginLeft: "25%", delay: "2.5s" },
    { marginLeft: "-50%", delay: "0s" },
    { marginLeft: "50%", delay: "0s" }
];

export const fallingLines = {
    id: "fallingLines",
    labelKey: "background_section_falling_lines",
    defaults: { backgroundColor: "#171717", particlesColor: "#ffffff", numberOfLines: 3 },
    controls: [
        backgroundColorControl,
        particlesColorControl,
        { type: "range", param: "numberOfLines", labelKey: "procedural_controls_number_of_lines_input", min: 3, max: 5, step: 1 }
    ],
    restartOnResize: false,

    start(layer, params) {
        layer.style.backgroundColor = params.backgroundColor;
        const color = params.particlesColor;

        const wrapper = document.createElement("div");
        wrapper.className = "lines";

        for (const { marginLeft, delay } of LINE_LAYOUT.slice(0, params.numberOfLines)) {
            const line = document.createElement("div");
            line.className = "line";
            line.style.marginLeft = marginLeft;
            line.style.background = hexToRgba(color, 0.1);

            const drop = document.createElement("div");
            drop.className = "line-drop";
            drop.style.background = `linear-gradient(to bottom, ${hexToRgba(color, 0)} 0%, ${hexToRgba(color, 0.9)} 75%, ${hexToRgba(color, 1)} 100%)`;
            drop.style.animationDelay = delay;

            line.appendChild(drop);
            wrapper.appendChild(line);
        }

        layer.appendChild(wrapper);
        return () => {};
    }
};
