import { backgroundColorControl, particlesColorControl } from "../controls-presets.js";
import { hexToRgba } from "../../core/color.js";

const CIRCLES = [
    { left: "25%", size: 80, delay: "0s" },
    { left: "10%", size: 20, delay: "2s", duration: "12s" },
    { left: "70%", size: 20, delay: "4s" },
    { left: "40%", size: 60, delay: "0s", duration: "18s" },
    { left: "65%", size: 20, delay: "0s" },
    { left: "75%", size: 110, delay: "3s" },
    { left: "35%", size: 150, delay: "7s" },
    { left: "50%", size: 25, delay: "15s", duration: "45s" },
    { left: "20%", size: 15, delay: "2s", duration: "35s" },
    { left: "85%", size: 150, delay: "0s", duration: "11s" }
];

export const floatingCircles = {
    id: "floatingCircles",
    labelKey: "background_section_floating_circles",
    defaults: { backgroundColor: "#4e54c8", particlesColor: "#ffffff" },
    controls: [backgroundColorControl, particlesColorControl],
    restartOnResize: false,

    start(layer, params) {
        const area = document.createElement("div");
        area.className = "area";
        area.style.backgroundColor = params.backgroundColor;

        const list = document.createElement("ul");
        list.className = "circles";

        for (const circle of CIRCLES) {
            const item = document.createElement("li");
            Object.assign(item.style, {
                width: `${circle.size}px`,
                height: `${circle.size}px`,
                left: circle.left,
                animationDuration: circle.duration ?? "25s",
                animationDelay: circle.delay,
                background: hexToRgba(params.particlesColor, 0.2)
            });
            list.appendChild(item);
        }

        area.appendChild(list);
        layer.appendChild(area);
        return () => {};
    }
};
