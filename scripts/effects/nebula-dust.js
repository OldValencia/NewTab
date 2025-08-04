function enableNebulaDust(settings) {
    cleanupBeforeEnableBackground("nebula-canvas");
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = "nebula-canvas";
    backgroundLayer.appendChild(canvas);
    backgroundLayer.style.backgroundColor = settings.bg.nebulaDust.backgroundColor;
    const ctx = canvas.getContext("2d");

    const particles = Array.from({ length: settings.bg.nebulaDust.numberOfParticles }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        color: hexToRgba(settings.bg.nebulaDust.particlesColor || "#aa66ff", 0.6)
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fill();
        });
        window.dynamicLoop = requestAnimationFrame(draw);
    }

    draw();
}
