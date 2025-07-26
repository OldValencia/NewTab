const backgroundLayer = document.getElementById("background-layer");

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function saveCustomSettings(settings) {
    localStorage.setItem("custom_settings", JSON.stringify(settings));
}

function loadCustomSettings() {
    const json = localStorage.getItem("custom_settings");
    return json ? JSON.parse(json) : {};
}

function applyBackgroundEffects(settings) {
    const blur = settings.bgBlur || 0;
    const brightness = settings.bgBrightness || 100;

    backgroundLayer.style.filter = `blur(${blur}px) brightness(${brightness}%)`;
}

function applyBackgroundFit(fit) {
    if (!fit) {
        fit = "cover";
        const settings = loadCustomSettings();
        settings.bgFit = fit;
        saveCustomSettings(settings);
        document.getElementById("bg-fit").value = fit;
    }

    switch (fit) {
        case "cover":
            backgroundLayer.style.backgroundSize = "cover";
            backgroundLayer.style.backgroundRepeat = "no-repeat";
            backgroundLayer.style.backgroundPosition = "center";
            break;
        case "contain":
            backgroundLayer.style.backgroundSize = "contain";
            backgroundLayer.style.backgroundRepeat = "no-repeat";
            backgroundLayer.style.backgroundPosition = "center";
            break;
        case "repeat":
            backgroundLayer.style.backgroundSize = "auto";
            backgroundLayer.style.backgroundRepeat = "repeat";
            backgroundLayer.style.backgroundPosition = "top left";
            break;
        case "stretch":
            backgroundLayer.style.backgroundSize = "100% 100%";
            backgroundLayer.style.backgroundRepeat = "no-repeat";
            backgroundLayer.style.backgroundPosition = "center";
            break;
        case "center":
            backgroundLayer.style.backgroundSize = "auto";
            backgroundLayer.style.backgroundRepeat = "no-repeat";
            backgroundLayer.style.backgroundPosition = "center";
            break;
    }
}
