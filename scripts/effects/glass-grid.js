function enableGlassGrid() {
    cleanupBeforeEnableBackground("glass-canvas");
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = "glass-canvas";
    backgroundLayer.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const squares = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 40 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: 0.05 + Math.random() * 0.1
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        squares.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;

            if (s.x < -s.size || s.x > canvas.width + s.size) s.vx *= -1;
            if (s.y < -s.size || s.y > canvas.height + s.size) s.vy *= -1;

            ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        window.dynamicLoop = requestAnimationFrame(draw);
    }

    draw();
}
