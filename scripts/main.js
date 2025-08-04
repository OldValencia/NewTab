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
    const blur = settings.bg.bgBlur || 0;
    const brightness = settings.bg.bgBrightness || 100;

    backgroundLayer.style.filter = `blur(${blur}px) brightness(${brightness}%)`;
    const intensity = settings.bg.bgVignette;
    const alpha = intensity / 100 * 0.8;
    vignetteLayer.style.background = `radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,${alpha}) 100%)`;
}

function applyBackgroundFit(fit) {
    if (!fit) {
        fit = "cover";
        const settings = loadCustomSettings();
        settings.bg.bgFit = fit;
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

function adjustColor(hex, percent) {//percent positive - lightens the color, negative - darkens it
    const rgb = hex.replace("#", "").match(/.{2}/g).map(x => parseInt(x, 16));
    const adjusted = rgb.map(c => {
        const delta = Math.round(255 * percent);
        return Math.min(255, Math.max(0, c + delta));
    });
    return "#" + adjusted.map(x => x.toString(16).padStart(2, "0")).join("");
}

function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createColorInput(labelText, labelId, defaultColor, bgMode, bgModeVariable, onChangeCallback) {
    const colorLabel = document.createElement("label");
    colorLabel.setAttribute("for", labelId);
    colorLabel.textContent = labelText;
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = labelId;
    colorInput.value = defaultColor;
    const debounceColorHandler = debounce((e) => {
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = e.target.value;
        colorInput.value = e.target.value;
        saveCustomSettings(settings);

        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    }, 200);
    colorInput.addEventListener("input", debounceColorHandler);
    colorLabel.appendChild(colorInput);

    return colorLabel;
}

function createRangeInput(labelText, labelId, labelMin, labelMax, labelStep, defaultValue, bgMode, bgModeVariable, onChangeCallback) {
    const rangeLabel = document.createElement("label");
    rangeLabel.setAttribute("for", labelId);
    rangeLabel.textContent = labelText;
    const rangeInput = document.createElement("input");
    rangeInput.type = "range";
    rangeInput.id = labelId;
    rangeInput.min = labelMin;
    rangeInput.max = labelMax;
    rangeInput.step = labelStep;
    rangeInput.value = defaultValue;
    const debounceSizeHandler = debounce((e) => {
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = e.target.value;
        rangeInput.value = e.target.value;
        saveCustomSettings(settings);

        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    }, 200);
    rangeInput.addEventListener("input", debounceSizeHandler);
    rangeLabel.appendChild(rangeInput);

    return rangeLabel;
}

function createCheckbox(labelText, labelId, defaultValue, bgMode, bgModeVariable, onChangeCallback) {
    const rangeLabel = document.createElement("label");
    rangeLabel.setAttribute("for", labelId);
    rangeLabel.textContent = labelText;
    const checkboxInput = document.createElement("input");
    checkboxInput.type = "checkbox";
    checkboxInput.id = labelId;
    checkboxInput.checked = defaultValue;
    const debounceSizeHandler = debounce((e) => {
        const settings = loadCustomSettings();
        settings.bg[bgMode][bgModeVariable] = e.target.checked;
        checkboxInput.checked = e.target.checked;
        saveCustomSettings(settings);

        if (typeof onChangeCallback === "function") {
            onChangeCallback(settings);
        }
    }, 200);
    checkboxInput.addEventListener("change", debounceSizeHandler);
    rangeLabel.appendChild(checkboxInput);

    return rangeLabel;
}

