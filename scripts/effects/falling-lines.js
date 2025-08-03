function enableFallingLinesBackground(settings) {
    cleanupBeforeEnableBackground();

    const wrapper = document.createElement("div");
    wrapper.className = "lines";

    for (let i = 0; i < settings.bg.fallingLines.numberOfLines; i++) {
        const line = document.createElement("div");
        line.className = "line";

        if (i === 0) {
            line.style.marginLeft = "-25%";
        } else if (i === 2) {
            line.style.marginLeft = "25%";
        } else if (i === 3) {
            line.style.marginLeft = "-50%";
        } else if (i === 4) {
            line.style.marginLeft = "50%";
        }
        line.style.background = hexToRgba(settings.bg.fallingLines.particlesColor, 0.1);

        const drop = document.createElement("div");
        drop.style.position = "absolute";
        drop.style.content = '""';
        drop.style.display = "block";
        drop.style.height = "15vh";
        drop.style.width = "100%";
        drop.style.top = "-50%";
        drop.style.left = "0";
        drop.style.background = `linear-gradient(to bottom, ${hexToRgba(settings.bg.fallingLines.particlesColor, 0)} 0%, ${hexToRgba(settings.bg.fallingLines.particlesColor, 0.9)} 75%, ${hexToRgba(settings.bg.fallingLines.particlesColor, 1)} 100%)`;
        drop.style.animation = "drop 7s infinite forwards";
        drop.style.animationTimingFunction = "cubic-bezier(0.4, 0.26, 0, 0.97)";

        if (i === 0) {
            drop.style.animationDelay = "2s";
        } else if (i === 2) {
            drop.style.animationDelay = "2.5s";
        }

        line.appendChild(drop);
        wrapper.appendChild(line);
    }

    backgroundLayer.appendChild(wrapper);
    backgroundLayer.style.backgroundColor = settings.bg.fallingLines.backgroundColor;
}
