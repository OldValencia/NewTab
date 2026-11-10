/**
 * Shared helpers for canvas-based background effects.
 */

/** Creates a full-window canvas inside the background layer. */
export function createFullWindowCanvas(layer, { devicePixelRatio = 1 } = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    if (devicePixelRatio !== 1) {
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
    }
    layer.appendChild(canvas);
    return { canvas, ctx: canvas.getContext("2d") };
}

/** Runs `drawFrame` on every animation frame; returns a function that stops the loop. */
export function startAnimationLoop(drawFrame) {
    let frameId = null;

    const tick = () => {
        drawFrame();
        frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => cancelAnimationFrame(frameId);
}

export function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}
