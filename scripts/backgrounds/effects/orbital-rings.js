import { createFullWindowCanvas, startAnimationLoop } from "../canvas.js";
import { backgroundColorControl, particleCountControl, particlesColorControl } from "../controls-presets.js";
import { hexToRgba } from "../../core/color.js";

export const orbitalRings = {
    id: "orbitalRings",
    labelKey: "background_section_orbital_rings",
    defaults: { backgroundColor: "#000000", particlesColor: "#ffffff", numberOfParticles: 5 },
    controls: [backgroundColorControl, particlesColorControl, particleCountControl(3, 30)],
    restartOnResize: true,

    start(layer, params) {
        layer.style.backgroundColor = params.backgroundColor;
        const pixelRatio = window.devicePixelRatio || 1;
        const { ctx } = createFullWindowCanvas(layer, { devicePixelRatio: pixelRatio });
        ctx.scale(pixelRatio, pixelRatio);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = width / 2;
        const centerY = height / 2;

        const rings = Array.from({ length: params.numberOfParticles }, (_, index) => ({
            radius: 50 + index * 40,
            speed: 0.001 + index * 0.0005,
            angle: Math.random() * Math.PI * 2
        }));

        const strokeColor = hexToRgba(params.particlesColor, 0.3);
        const fillColor = hexToRgba(params.particlesColor, 0.8);

        return startAnimationLoop(() => {
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            for (const ring of rings) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = params.particlesColor;
            ctx.fillStyle = fillColor;
            for (const ring of rings) {
                ring.angle += ring.speed;
                ctx.beginPath();
                ctx.arc(centerX + Math.cos(ring.angle) * ring.radius, centerY + Math.sin(ring.angle) * ring.radius, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }
};
