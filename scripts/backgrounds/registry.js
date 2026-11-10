import { stars } from "./effects/stars.js";
import { blobFlow } from "./effects/blob-flow.js";
import { nebulaDust } from "./effects/nebula-dust.js";
import { glassGrid } from "./effects/glass-grid.js";
import { orbitalRings } from "./effects/orbital-rings.js";
import { particleDrift } from "./effects/particle-drift.js";
import { cloudySpiral } from "./effects/cloudy-spiral.js";
import { solarSystem } from "./effects/solar-system.js";
import { waves } from "./effects/waves.js";
import { fallingLines } from "./effects/falling-lines.js";
import { floatingCircles } from "./effects/floating-circles.js";

/**
 * Procedural background effects, in the order they appear in the sidebar.
 *
 * Each effect is { id, labelKey, defaults, controls, restartOnResize, start(layer, params) → stop() }.
 * `controls` describe the sidebar inputs ({ type: "color" | "range" | "checkbox", param, labelKey, min, max, step }).
 */
export const EFFECTS = [
    stars,
    blobFlow,
    nebulaDust,
    glassGrid,
    orbitalRings,
    particleDrift,
    cloudySpiral,
    solarSystem,
    waves,
    fallingLines,
    floatingCircles
];

/** Background modes that show a picture instead of an effect. */
export const IMAGE_MODES = ["customImage", "onlinePhoto"];

export function getEffect(mode) {
    return EFFECTS.find(effect => effect.id === mode) ?? null;
}

export function isImageMode(mode) {
    return IMAGE_MODES.includes(mode);
}
