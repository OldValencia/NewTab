function enableOrbitalRings(settings) {
    cleanupBeforeEnableBackground("orbital-canvas");

    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement("canvas");
    canvas.id = "orbital-canvas";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    backgroundLayer.appendChild(canvas);
    backgroundLayer.style.backgroundColor = settings.bg.orbitalRings.backgroundColor;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const rings = Array.from({ length: settings.bg.orbitalRings.numberOfParticles }, (_, i) => ({
        radius: 50 + i * 40,
        speed: 0.001 + i * 0.0005,
        angle: Math.random() * Math.PI * 2
    }));

    const strokeColor = hexToRgba(settings.bg.orbitalRings.particlesColor, 0.3);
    const fillColor = hexToRgba(settings.bg.orbitalRings.particlesColor, 0.8);
    const shadowColor = settings.bg.orbitalRings.particlesColor;

    function drawStaticRings() {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        rings.forEach(ring => {
            ctx.beginPath();
            ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.restore();
    }

    drawStaticRings();

    function draw(timestamp) {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        drawStaticRings();

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = shadowColor;

        rings.forEach(ring => {
            ring.angle += ring.speed;
            const x = cx + Math.cos(ring.angle) * ring.radius;
            const y = cy + Math.sin(ring.angle) * ring.radius;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
        });

        ctx.restore();
        window.dynamicLoop = requestAnimationFrame(draw);
    }

    draw();
}
