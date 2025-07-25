function enableOrbitalRings() {
    disableDynamicBackground();

    const canvas = document.createElement("canvas");
    canvas.id = "orbital-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    backgroundLayer.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const rings = Array.from({ length: 5 }, (_, i) => ({
        radius: 50 + i * 40,
        speed: 0.001 + i * 0.0005,
        angle: Math.random() * Math.PI * 2
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        rings.forEach(ring => {
            ring.angle += ring.speed;
            const x = cx + Math.cos(ring.angle) * ring.radius;
            const y = cy + Math.sin(ring.angle) * ring.radius;

            ctx.beginPath();
            ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.shadowColor = "white";
            ctx.shadowBlur = 8;
            ctx.fill();
        });

        window.dynamicLoop = requestAnimationFrame(draw);
    }

    draw();
}