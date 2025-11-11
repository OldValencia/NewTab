function enableBlobFlow(settings) {
    cleanupBeforeEnableBackground("blob-canvas");

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = "blob-canvas";
    backgroundLayer.appendChild(canvas);
    backgroundLayer.style.backgroundColor = settings.bg.blobFlow.backgroundColor;
    const ctx = canvas.getContext("2d");

    const blobs = Array.from({length: 8}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 80 + Math.random() * settings.bg.blobFlow.size,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: `hsla(${Math.random() * 360}, 70%, 80%, 0.4)`
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `blur(${settings.bg.blobFlow.blur}px)`;
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

async function enableBlowFlowWithProceduralControls(proceduralControls) {
    const settings = getBackgroundSettings();
    const bgColor = await createColorInput("procedural_controls_background_color_input", "bg-color", settings.bg.blobFlow.backgroundColor, "blobFlow", "backgroundColor", enableBlobFlow);
    const size = await createRangeInput("procedural_controls_size_input", "bg-blob-size", "30", "150", "1", settings.bg.blobFlow.size, "blobFlow", "size", enableBlobFlow);
    const blur = await createRangeInput("procedural_controls_blur_input", "bg-blob-blur", "0", "50", "1", settings.bg.blobFlow.blur, "blobFlow", "blur", enableBlobFlow);

    proceduralControls?.append(bgColor, size, blur);
    enableBlobFlow(settings);
}

window.addEventListener('resize', throttle(() => {
    const settings = loadCustomSettings();
    if (settings.bg.bgMode === "blobFlow") {
        enableProceduralBackground(settings);
    }
}, 1500));
