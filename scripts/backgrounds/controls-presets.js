/** Control descriptors shared by several effects (rendered by sidebar/background-section.js). */

export const backgroundColorControl = {
    type: "color",
    param: "backgroundColor",
    labelKey: "procedural_controls_background_color_input"
};

export const particlesColorControl = {
    type: "color",
    param: "particlesColor",
    labelKey: "procedural_controls_particles_color_input"
};

export function particleCountControl(min, max) {
    return {
        type: "range",
        param: "numberOfParticles",
        labelKey: "procedural_controls_number_of_particles_input",
        min,
        max,
        step: 1
    };
}
