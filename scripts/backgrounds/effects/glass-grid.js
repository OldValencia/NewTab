import { createFullWindowCanvas, startAnimationLoop } from "../canvas.js";
import { backgroundColorControl, particleCountControl, particlesColorControl } from "../controls-presets.js";
import { hexToRgba } from "../../core/color.js";

export const glassGrid = {
    id: "glassGrid",
    labelKey: "background_section_glass_grid",
    defaults: { backgroundColor: "#000000", particlesColor: "#ffffff", numberOfParticles: 40, particlesTransparency: 0.05 },
    controls: [
        {
            type: "range",
            param: "particlesTransparency",
            labelKey: "procedural_controls_particles_transparency_input",
            min: 0,
            max: 1,
            step: 0.01
        },
        particleCountControl(20, 100),
        backgroundColorControl,
        particlesColorControl
    ],
    restartOnResize: true,

    start(layer, params) {
        layer.style.backgroundColor = params.backgroundColor;
        const { canvas, ctx } = createFullWindowCanvas(layer);

        const squares = Array.from({ length: params.numberOfParticles }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 40 + Math.random() * 20,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            fill: hexToRgba(params.particlesColor, params.particlesTransparency + Math.random() * 0.1)
        }));

        return startAnimationLoop(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const square of squares) {
                square.x += square.vx;
                square.y += square.vy;
                if (square.x < -square.size || square.x > canvas.width + square.size) square.vx *= -1;
                if (square.y < -square.size || square.y > canvas.height + square.size) square.vy *= -1;

                ctx.fillStyle = square.fill;
                ctx.fillRect(square.x, square.y, square.size, square.size);
            }
        });
    }
};
