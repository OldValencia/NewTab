import { createFullWindowCanvas, startAnimationLoop } from "../canvas.js";
import { backgroundColorControl, particleCountControl, particlesColorControl } from "../controls-presets.js";
import { hexToRgba } from "../../core/color.js";

export const nebulaDust = {
    id: "nebulaDust",
    labelKey: "background_section_nebula_dust",
    defaults: { backgroundColor: "#000000", particlesColor: "#aa66ff", numberOfParticles: 150 },
    controls: [particleCountControl(30, 300), backgroundColorControl, particlesColorControl],
    restartOnResize: true,

    start(layer, params) {
        layer.style.backgroundColor = params.backgroundColor;
        const { canvas, ctx } = createFullWindowCanvas(layer);
        const color = hexToRgba(params.particlesColor, 0.6);

        const particles = Array.from({ length: params.numberOfParticles }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2
        }));

        return startAnimationLoop(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;

            for (const particle of particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
};
