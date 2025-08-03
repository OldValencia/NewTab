function enableParticleDrift(settings) {
    cleanupBeforeEnableBackground("particle-canvas");

    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement("canvas");
    canvas.id = "particle-canvas";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    backgroundLayer.appendChild(canvas);
    backgroundLayer.style.backgroundColor = settings.bg.particleDrift.backgroundColor;
    const ctx = canvas.getContext("2d");

    const particles = Array.from({ length: settings.bg.particleDrift.numberOfParticles }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
    }));
    const fillStyle = hexToRgba(settings.bg.particleDrift.particlesColor, 0.7);


    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = fillStyle;
            ctx.fill();

            particles.forEach(other => {
                const dx = p.x - other.x;
                const dy = p.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.strokeStyle = `${hexToRgba(settings.bg.particleDrift.particlesColor, 1 - dist / 100)}`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });
        window.dynamicLoop = requestAnimationFrame(draw);
    }

    draw();
}