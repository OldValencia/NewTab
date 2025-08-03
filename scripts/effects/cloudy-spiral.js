/*
* lapDuration (1500-5000)
* particleSize (5-10)
* radius (50-140)
* backgroundColor
* */

function enableCloudySpiral() {
    cleanupBeforeEnableBackground();
    const particles = 62;
    const particleSize = 8;
    const radius = 80;
    const lapDuration = 3000;

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
        particle.style.background = "rgba(255,255,255,0.5)";
        particle.style.boxShadow = "0px 0px 10px rgba(255,255,255,1)";
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
    backgroundLayer.style.background = "#3e6fa3";
}
