function enableGlassGrid(settings) {
    cleanupBeforeEnableBackground("glass-canvas");
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = "glass-canvas";
    backgroundLayer.appendChild(canvas);
    backgroundLayer.style.backgroundColor = settings.bg.glassGrid.backgroundColor;
    const ctx = canvas.getContext("2d");

    const squares = Array.from({ length: settings.bg.glassGrid.numberOfParticles }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 40 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: settings.bg.glassGrid.particlesTransparency + Math.random() * 0.1
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = hexToRgba(settings.bg.glassGrid.particlesColor, settings.bg.glassGrid.particlesTransparency);
        squares.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;

            if (s.x < -s.size || s.x > canvas.width + s.size) s.vx *= -1;
            if (s.y < -s.size || s.y > canvas.height + s.size) s.vy *= -1;

            ctx.fillStyle = hexToRgba(settings.bg.glassGrid.particlesColor, s.opacity);
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        window.dynamicLoop = requestAnimationFrame(draw);
    }

    draw();
}
