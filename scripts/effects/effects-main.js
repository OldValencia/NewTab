function disableDynamicBackground() {
    backgroundLayer.innerHTML = "";
    backgroundLayer.style.backgroundImage = "";
    backgroundLayer.style.backgroundSize = "";
    backgroundLayer.style.backgroundRepeat = "";
    backgroundLayer.style.backgroundPosition = "";
    backgroundLayer.style.background = "#000";
    document.body.style.backgroundImage = "";
    vignetteLayer.style.background = "";
}

function cleanupBeforeEnableBackground(elementId = null) {
    if (window.dynamicLoop) {
        cancelAnimationFrame(window.dynamicLoop);
        window.dynamicLoop = null;
    }

    disableDynamicBackground();

    if (elementId !== null) {
        const oldCanvas = document.getElementById(elementId);
        if (oldCanvas) oldCanvas.remove();
    }

    if (window.dynamicLoop) {
        cancelAnimationFrame(window.dynamicLoop);
        window.dynamicLoop = null;
    }
}