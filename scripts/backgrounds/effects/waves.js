import { hexToRgba } from "../../core/color.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const WAVE_PATH = "M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z";

function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
}

function waveColorControl(param, labelKey) {
    return { type: "color", param, labelKey };
}

export const waves = {
    id: "waves",
    labelKey: "background_section_waves",
    defaults: {
        leftBackgroundColor: "#543ab7",
        rightBackgroundColor: "#00acc1",
        firstWaveColor: "#ffffff",
        secondWaveColor: "#ffffff",
        thirdWaveColor: "#ffffff",
        fourthWaveColor: "#ffffff",
        useOnlyFirstWaveColor: false
    },
    controls: [
        waveColorControl("leftBackgroundColor", "procedural_controls_left_background_color_input"),
        waveColorControl("rightBackgroundColor", "procedural_controls_right_background_color_input"),
        waveColorControl("firstWaveColor", "procedural_controls_first_wave_color_input"),
        waveColorControl("secondWaveColor", "procedural_controls_second_wave_color_input"),
        waveColorControl("thirdWaveColor", "procedural_controls_third_wave_color_input"),
        waveColorControl("fourthWaveColor", "procedural_controls_fourth_wave_color_input"),
        { type: "checkbox", param: "useOnlyFirstWaveColor", labelKey: "procedural_controls_use_only_first_wave_color_input" }
    ],
    restartOnResize: false,

    start(layer, params) {
        layer.style.background = `linear-gradient(60deg, ${params.leftBackgroundColor} 0%, ${params.rightBackgroundColor} 100%)`;

        const spacer = document.createElement("div");
        spacer.className = "inner-header flex";

        const svg = svgElement("svg", {
            class: "waves",
            viewBox: "0 24 150 28",
            preserveAspectRatio: "none",
            "shape-rendering": "auto"
        });
        const defs = svgElement("defs");
        defs.appendChild(svgElement("path", { id: "gentle-wave", d: WAVE_PATH }));
        svg.appendChild(defs);

        const colorOf = param => params.useOnlyFirstWaveColor ? params.firstWaveColor : params[param];
        const layers = [
            { y: "0", fill: hexToRgba(params.firstWaveColor, 0.7) },
            { y: "3", fill: hexToRgba(colorOf("secondWaveColor"), 0.5) },
            { y: "5", fill: hexToRgba(colorOf("thirdWaveColor"), 0.3) },
            { y: "7", fill: colorOf("fourthWaveColor") }
        ];

        const group = svgElement("g", { class: "parallax" });
        for (const { y, fill } of layers) {
            const use = svgElement("use", { x: "48", y, fill });
            use.setAttributeNS(XLINK_NS, "xlink:href", "#gentle-wave");
            group.appendChild(use);
        }
        svg.appendChild(group);

        layer.append(spacer, svg);
        return () => {};
    }
};
