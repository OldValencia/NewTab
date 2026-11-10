import { startAnimationLoop } from "../canvas.js";
import { backgroundColorControl, particleCountControl, particlesColorControl } from "../controls-presets.js";
import { hexToRgba } from "../../core/color.js";

const LINK_DISTANCE = 100;

export const particleDrift = {
    id: "particleDrift",
    labelKey: "background_section_particle_drift",
    defaults: { backgroundColor: "#000000", particlesColor: "#ffffff", numberOfParticles: 100 },
    controls: [backgroundColorControl, particlesColorControl, particleCountControl(70, 250)],
    restartOnResize: true,

    start(layer, params) {
        layer.style.backgroundColor = params.backgroundColor;

        // The canvas covers the window in device pixels but the context is not scaled:
        // particles and link distances are measured in device pixels (kept from v1.0 for the same look).
        const pixelRatio = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = window.innerWidth * pixelRatio;
        canvas.height = window.innerHeight * pixelRatio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        layer.appendChild(canvas);
        const ctx = canvas.getContext("2d");

        const particles = Array.from({ length: params.numberOfParticles }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        }));
        const dotColor = hexToRgba(params.particlesColor, 0.7);

        return startAnimationLoop(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const particle of particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
            }

            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distanceSquared = dx * dx + dy * dy;
                    if (distanceSquared >= LINK_DISTANCE * LINK_DISTANCE) continue;

                    // Each pair used to be drawn twice; this alpha reproduces that look with one stroke.
                    const singleAlpha = 1 - Math.sqrt(distanceSquared) / LINK_DISTANCE;
                    const alpha = 1 - (1 - singleAlpha) ** 2;
                    ctx.strokeStyle = hexToRgba(params.particlesColor, alpha);
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }

            ctx.fillStyle = dotColor;
            for (const particle of particles) {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
};
