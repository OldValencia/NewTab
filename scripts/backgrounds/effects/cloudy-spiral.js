import { backgroundColorControl, particleCountControl, particlesColorControl } from "../controls-presets.js";
import { hexToRgba } from "../../core/color.js";

export const cloudySpiral = {
    id: "cloudySpiral",
    labelKey: "background_section_cloudy_spiral",
    defaults: {
        backgroundColor: "#6593c5",
        particlesColor: "#ffffff",
        numberOfParticles: 62,
        particleSize: 8,
        radius: 80,
        lapDuration: 3000
    },
    controls: [
        backgroundColorControl,
        particlesColorControl,
        particleCountControl(50, 100),
        { type: "range", param: "particleSize", labelKey: "procedural_controls_size_of_particles_input", min: 5, max: 15, step: 1 },
        { type: "range", param: "radius", labelKey: "procedural_controls_radius_of_particles_input", min: 50, max: 200, step: 1 },
        { type: "range", param: "lapDuration", labelKey: "procedural_controls_lap_duration_input", min: 3000, max: 6000, step: 10 }
    ],
    restartOnResize: false,

    start(layer, params) {
        layer.style.background = params.backgroundColor;
        const { numberOfParticles: count, particleSize, radius, lapDuration } = params;

        const wrapper = document.createElement("div");
        wrapper.className = "cloudy-spiral-wrapper";

        for (let i = 1; i <= count; i++) {
            const particle = document.createElement("i");
            const angle = (i / count) * 720;
            Object.assign(particle.style, {
                width: `${particleSize}px`,
                height: `${particleSize}px`,
                background: hexToRgba(params.particlesColor, 0.5),
                boxShadow: `0px 0px 10px ${params.particlesColor}`,
                animationDuration: `${lapDuration}ms`,
                animationDelay: `${(i * lapDuration) / count}ms`,
                transform: `rotate(${angle}deg) translate3d(${radius}px, 0, 0)`
            });
            wrapper.appendChild(particle);
        }

        layer.appendChild(wrapper);
        return () => {};
    }
};
