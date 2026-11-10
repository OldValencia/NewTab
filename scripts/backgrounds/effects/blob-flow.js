import { createFullWindowCanvas, startAnimationLoop } from "../canvas.js";
import { backgroundColorControl } from "../controls-presets.js";

const BLOB_COUNT = 8;

export const blobFlow = {
    id: "blobFlow",
    labelKey: "background_section_blob_flow",
    defaults: { backgroundColor: "#000000", size: 60, blur: 0 },
    controls: [
        backgroundColorControl,
        { type: "range", param: "size", labelKey: "procedural_controls_size_input", min: 30, max: 150, step: 1 },
        { type: "range", param: "blur", labelKey: "procedural_controls_blur_input", min: 0, max: 50, step: 1 }
    ],
    restartOnResize: true,

    start(layer, params) {
        layer.style.backgroundColor = params.backgroundColor;
        const { canvas, ctx } = createFullWindowCanvas(layer);

        const blobs = Array.from({ length: BLOB_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 80 + Math.random() * params.size,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: `hsla(${Math.random() * 360}, 70%, 80%, 0.4)`
        }));

        return startAnimationLoop(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = `blur(${params.blur}px)`;

            for (const blob of blobs) {
                blob.x += blob.vx;
                blob.y += blob.vy;
                if (blob.x < -blob.radius || blob.x > canvas.width + blob.radius) blob.vx *= -1;
                if (blob.y < -blob.radius || blob.y > canvas.height + blob.radius) blob.vy *= -1;

                ctx.beginPath();
                ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
                ctx.fillStyle = blob.color;
                ctx.fill();
            }

            ctx.filter = "none";
        });
    }
};
