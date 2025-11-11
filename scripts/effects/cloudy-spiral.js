function enableCloudySpiral(settings) {
    cleanupBeforeEnableBackground();
    const particles = settings.bg.cloudySpiral.numberOfParticles;
    const particleSize = settings.bg.cloudySpiral.particleSize;
    const radius = settings.bg.cloudySpiral.radius;
    const lapDuration = settings.bg.cloudySpiral.lapDuration;

    const wrapper = document.createElement("div");
    wrapper.classList.add("cloudy-spiral-wrapper");
    wrapper.style.position = "absolute";
    wrapper.style.top = "50%";
    wrapper.style.left = "50%";
    wrapper.style.zIndex = "2";
    wrapper.style.perspective = "500px";

    for (let i = 1; i <= particles; i++) {
        const particle = document.createElement("i");
        particle.style.position = "absolute";
        particle.style.width = `${particleSize}px`;
        particle.style.height = `${particleSize}px`;
        particle.style.borderRadius = "50%";
        particle.style.opacity = "0";
        particle.style.background = hexToRgba(settings.bg.cloudySpiral.particlesColor, 0.5);
        particle.style.boxShadow = `0px 0px 10px ${settings.bg.cloudySpiral.particlesColor}`;
        particle.style.animationName = "spin";
        particle.style.animationDuration = `${lapDuration}ms`;
        particle.style.animationIterationCount = "infinite";
        particle.style.animationTimingFunction = "ease-in-out";
        particle.style.animationDelay = `${(i * lapDuration) / particles}ms`;

        const angle = (i / particles) * 720;
        particle.style.transform = `rotate(${angle}deg) translate3d(${radius}px, 0, 0)`;

        wrapper.appendChild(particle);
    }

    backgroundLayer.appendChild(wrapper);
    backgroundLayer.style.background = settings.bg.cloudySpiral.backgroundColor;
}

async function enableCloudySpiralWithProceduralControls(proceduralControls) {
    const settings = getBackgroundSettings();
    const bgColor = await createColorInput("procedural_controls_background_color_input", "bg-color", settings.bg.cloudySpiral.backgroundColor, "cloudySpiral", "backgroundColor", enableCloudySpiral);
    const particlesColor = await createColorInput("procedural_controls_particles_color_input", "bg-particles-color", settings.bg.cloudySpiral.particlesColor, "cloudySpiral", "particlesColor", enableCloudySpiral);
    const count = await createRangeInput("procedural_controls_number_of_particles_input", "bg-cloudy-particles", "50", "100", "1", settings.bg.cloudySpiral.numberOfParticles, "cloudySpiral", "numberOfParticles", enableCloudySpiral);
    const size = await createRangeInput("procedural_controls_size_of_particles_input", "bg-cloudy-particles-size", "5", "15", "1", settings.bg.cloudySpiral.particleSize, "cloudySpiral", "particleSize", enableCloudySpiral);
    const radius = await createRangeInput("procedural_controls_radius_of_particles_input", "bg-cloudy-particles-radius", "50", "200", "1", settings.bg.cloudySpiral.radius, "cloudySpiral", "radius", enableCloudySpiral);
    const lap = await createRangeInput("procedural_controls_lap_duration_input", "bg-cloudy-particles-lap-duration", "3000", "6000", "10", settings.bg.cloudySpiral.lapDuration, "cloudySpiral", "lapDuration", enableCloudySpiral);

    proceduralControls?.append(bgColor, particlesColor, count, size, radius, lap);
    enableCloudySpiral(settings);
}

window.addEventListener('resize', throttle(() => {
    const settings = loadCustomSettings();
    if (settings.bg.bgMode === "cloudySpiral") {
        enableProceduralBackground(settings);
    }
}, 1500));
