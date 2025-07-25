function disableDynamicBackground() {
    backgroundLayer.innerHTML = "";
    backgroundLayer.style.backgroundImage = "";
    backgroundLayer.style.backgroundSize = "";
    backgroundLayer.style.backgroundRepeat = "";
    backgroundLayer.style.backgroundPosition = "";
    document.body.style.backgroundImage = "";
}