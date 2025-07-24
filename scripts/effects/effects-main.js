function disableDynamicBackground(container) {
    container.innerHTML = "";
    container.style.backgroundImage = "";
    container.style.backgroundSize = "";
    container.style.backgroundRepeat = "";
    container.style.backgroundPosition = "";
    document.body.style.backgroundImage = "";
}