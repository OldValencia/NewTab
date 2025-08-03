function enableBlobFlow() {
    cleanupBeforeEnableBackground("blob-canvas");

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = "blob-canvas";
    backgroundLayer.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const blobs = Array.from({ length: 8 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 80 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: `hsla(${Math.random() * 360}, 70%, 80%, 0.4)`
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = "blur(40px)";
        blobs.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;

            if (b.x < -b.r || b.x > canvas.width + b.r) b.vx *= -1;
            if (b.y < -b.r || b.y > canvas.height + b.r) b.vy *= -1;

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.fill();
        });
        ctx.filter = "none";
        window.dynamicLoop = requestAnimationFrame(draw);
    }

    draw();
}
