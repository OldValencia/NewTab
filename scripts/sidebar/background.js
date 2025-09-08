const proceduralModes = [
    "stars",
    "blobFlow",
    "nebulaDust",
    "glassGrid",
    "orbitalRings",
    "particleDrift",
    "cloudySpiral",
    "solarSystem",
    "waves",
    "fallingLines",
    "floatingCircles"
];
let backgroundTimeoutState = {};
proceduralModes.forEach(mode => {
    backgroundTimeoutState[mode] = {
        timeout: null
    };
});
const brightnessControl = document.getElementById("bg-brightness");
const blurControl = document.getElementById("bg-blur");
const vignetteControl = document.getElementById("bg-vignette");
const vignetteLayer = document.getElementById("vignette-layer");
const effectsPanel = document.getElementById("bg-effects-group");
const backgroundApiKeyInput = document.getElementById("background-api-key");
const backgroundSearchInput = document.getElementById("bg-search");
const gallery = document.getElementById("bg-results");
const loading = document.getElementById("bg-loading");
const fileInput = document.getElementById("bg-upload");
const dynamicConfig = document.getElementById("dynamic-search-config");
const dynamicTag = document.getElementById("dynamic-tag");
const bgFit = document.getElementById("bg-fit");
const dynamicInterval = document.getElementById("dynamic-interval");

const getBackgroundSettings = () => {
    const s = loadCustomSettings() || {};
    if (!s.bg) s.bg = {};
    return s;
};

const updateBackgroundSettings = (mutator) => {
    const s = getBackgroundSettings();
    mutator(s);
    saveCustomSettings(s);
    return s;
};

async function applyDynamicBackground(settings, force = false) {
    const now = Date.now();
    const lastChange = parseInt(settings.bg.dynamicBgLast || "0");
    const interval = settings.bg.dynamicInterval;

    const shouldChange = force ||
        interval === "onload" ||
        (interval !== "onload" && now - lastChange > interval * 60 * 1000);

    if (!shouldChange && settings.bg.bgImage) {
        await setBackgroundImageWithFade(settings.bg.bgImage, settings.bg.bgFit);
        return;
    }

    const imageUrl = await fetchRandomImageByTag(settings.bg.dynamicTag);
    if (imageUrl) {
        await setBackgroundImageWithFade(imageUrl, settings.bg.bgFit);
        settings.bg.bgImage = imageUrl;
        settings.bg.bgSource = "dynamic";
        settings.bg.dynamicBgLast = now.toString();
        saveCustomSettings(settings);
    }
}

async function fetchSearchResults(tag) {
    const settings = loadCustomSettings();

    loading.style.display = "block";
    gallery.innerHTML = "";

    try {
        const response = await fetch(`https://pixabay.com/api/?key=${settings.bg.bgApiKey}&q=${encodeURIComponent(tag)}&image_type=photo`);
        const data = await response.json();

        data.hits.slice(0, 6).forEach(img => {
            const image = document.createElement("img");
            image.src = img.webformatURL;
            image.alt = img.tags;
            image.addEventListener("click", async () => {
                const settings = loadCustomSettings();

                await setBackgroundImageWithFade(img.largeImageURL, settings.bg.bgFit);
                document.body.style.backgroundColor = "";

                settings.bg.bgImage = img.largeImageURL;
                settings.bg.bgSource = "search";
                applyBackgroundFit(settings.bg.bgFit);
                saveCustomSettings(settings);
            });
            gallery.appendChild(image);
        });
    } catch (err) {
        gallery.innerHTML = "<div style='color: #f88;'>Error loading images</div>";

        console.error("Error fetching images from Pixabay:", err);
        showNotification("error", "Error fetching images from Pixabay. Please check the API key and your network connection.");
        switchToStars();
    } finally {
        loading.style.display = "none";
    }
}

async function fetchRandomImageByTag(tag) {
    const settings = loadCustomSettings();
    const response = await fetch(`https://pixabay.com/api/?key=${settings.bg.bgApiKey}&q=${encodeURIComponent(tag)}&image_type=photo`);
    const data = await response.json();

    if (!data) {
        console.error("Error fetching images from Pixabay: No data returned");
        showNotification("error", "Error fetching images from Pixabay. Please check the API key and your network connection.");
        switchToStars();
        return;
    }

    const images = data.hits;
    if (images.length === 0) return null;
    const random = images[Math.floor(Math.random() * images.length)];
    return random.largeImageURL;
}

function setDisplay(element, value) {
    if (element) element.style.display = value;
}

function resetBackgroundControls() {
    blurControl.value = 0;
    brightnessControl.value = 0;
    vignetteControl.value = 0;
}

function fadeBackground(callback) {
    backgroundLayer.style.opacity = "0";
    setTimeout(() => {
        callback();
        setTimeout(() => {
            backgroundLayer.style.opacity = "1";
        }, 50);
    }, 600);
}

function setBackgroundImageWithFade(url, fit, useFade = true) {
    if (!useFade) {
        backgroundLayer.style.opacity = "1";
        backgroundLayer.style.backgroundImage = `url(${url})`;
        applyBackgroundFit(fit);
        return;
    }
    fadeBackground(() => {
        backgroundLayer.style.backgroundImage = `url(${url})`;
        applyBackgroundFit(fit);
    });
}

function applyProceduralBackground(mode, useFade) {
    const apply = () => {
        enableProceduralBackground(mode);
    };

    if (useFade) fadeBackground(apply);
    else apply();
}

function applyBackgroundMode(mode, settings, useFade = true) {
    if (proceduralModes.includes(mode)) {
        applyProceduralBackground(settings.bg.bgMode, useFade);
    } else {
        effectsPanel.style.display = "flex";
        document.body.style.backgroundColor = "";
        disableStarfield();
        cleanupBeforeEnableBackground();
        if (useFade) fadeBackground(() => applyBackgroundEffects(settings));
        else applyBackgroundEffects(settings);
    }
}

async function loadBackground() {
    let settings = loadCustomSettings();

    if (!settings.bg) {
        settings = resetBgSettings();
    }

    backgroundApiKeyInput.value = settings.bg.bgApiKey || "";

    const modeInput = document.querySelector(`input[value="${settings.bg.bgMode}"]`);
    if (modeInput) {
        modeInput.checked = true;
    }

    if (proceduralModes.includes(settings.bg.bgMode)) {
        enableProceduralBackground(settings.bg.bgMode);
    } else {
        effectsPanel.style.display = "flex";
        document.body.style.backgroundColor = "";
        disableStarfield();
        cleanupBeforeEnableBackground();
        applyBackgroundEffects(settings);
    }

    blurControl.value = settings.bg.bgBlur;
    brightnessControl.value = settings.bg.bgBrightness;
    vignetteControl.value = settings.bg.bgVignette;
    bgFit.value = settings.bg.bgFit;

    applyBackgroundFit(settings.bg.bgFit);

    if (settings.bg.bgMode === "search-image") {
        backgroundSearchInput.style.display = "block";
        const tag = backgroundSearchInput.value.trim();
        if (tag) await fetchSearchResults(tag);
    }

    if (settings.bg.bgMode === "dynamic-search") {
        dynamicConfig.style.display = "flex";
        if (settings.bg.dynamicTag) {
            dynamicTag.value = settings.bg.dynamicTag;
            await applyDynamicBackground(settings);
        }
        if (settings.bg.dynamicInterval) {
            dynamicInterval.value = settings.bg.dynamicInterval;
        }
    }

    if (settings.bg.bgImage &&
        ((settings.bg.bgMode === "custom-image" && settings.bg.bgSource === "custom") ||
            (settings.bg.bgMode === "search-image" && settings.bg.bgSource === "search") ||
            (settings.bg.bgMode === "dynamic-search" && settings.bg.bgSource === "dynamic"))
    ) {
        setBackgroundImageWithFade(settings.bg.bgImage, settings.bg.bgFit, false); // no fade on DOMContentLoaded
    }
}

function enableProceduralBackground(mode) {
    effectsPanel.style.display = "none";
    backgroundLayer.style.backgroundImage = "";
    backgroundLayer.style.filter = "";
    document.body.style.backgroundColor = "#000";

    const allProceduralControls = document.querySelectorAll(".procedural-controls-element");
    allProceduralControls.forEach(control => {
        control.style.display = "none";
    });

    const proceduralControls = document.getElementById(`procedural-controls--${mode}`);
    if (proceduralControls) {
        proceduralControls.innerHTML = "";
        proceduralControls.style.display = "block";
    }

    const modeHandlers = {
        "stars": () => enableStarfield(),
        "solarSystem": () => enableSolarSystem(),
        "blobFlow": async () => await enableBlowFlowWithProceduralControls(proceduralControls),
        "nebulaDust": async () => await enableNebulaDustWithProceduralControls(proceduralControls),
        "glassGrid": async () => await enableGlassGridWithProceduralControls(proceduralControls),
        "orbitalRings": async () => await enableOrbitalRingsWithProceduralControls(proceduralControls),
        "particleDrift": async () => await enableParticleDriftWithProceduralControls(proceduralControls),
        "cloudySpiral": async () => await enableCloudySpiralWithProceduralControls(proceduralControls),
        "waves": async () => await enableWavesBackgroundWithProceduralControls(proceduralControls),
        "fallingLines": async () => await enableFallingLinesBackgroundWithProceduralControls(proceduralControls),
        "floatingCircles": async () => await enableFloatingCirclesBackgroundWithProceduralControls(proceduralControls)
    };

    if (modeHandlers[mode.toString()]) {
        modeHandlers[mode.toString()]();
    }
}

function resetBgSettings() {
    const settings = loadCustomSettings();
    settings.bg = {
        bgMode: "stars",
        bgImage: "",
        bgSource: "",
        bgBlur: 20,
        bgBrightness: 100,
        bgVignette: 5,
        bgFit: "cover",
        dynamicTag: "",
        dynamicInterval: "",
        nightMode: true,
        bgApiKey: "",
        blobFlow: {
            backgroundColor: "rgb(0, 0, 0)",
            blur: 0,
            size: 60
        },
        nebulaDust: {
            backgroundColor: "rgb(0, 0, 0)",
            numberOfParticles: 150,
            particlesColor: "#aa66ff"
        },
        glassGrid: {
            backgroundColor: "rgb(0, 0, 0)",
            particlesColor: "#ffffff",
            numberOfParticles: 40,
            particlesTransparency: 0.05
        },
        orbitalRings: {
            backgroundColor: "rgb(0, 0, 0)",
            particlesColor: "#ffffff",
            numberOfParticles: 5
        },
        particleDrift: {
            backgroundColor: "rgb(0, 0, 0)",
            particlesColor: "#ffffff",
            numberOfParticles: 100
        },
        cloudySpiral: {
            backgroundColor: "#6593c5",
            particlesColor: "#ffffff",
            radius: 80,
            particleSize: 8,
            lapDuration: 3000,
            numberOfParticles: 62
        },
        waves: {
            firstWaveColor: "#ffffff",
            secondWaveColor: "#ffffff",
            thirdWaveColor: "#ffffff",
            fourthWaveColor: "#ffffff",
            leftBackgroundColor: "#543ab7",
            rightBackgroundColor: "#00acc1",
            useOnlyFirstWaveColor: false
        },
        fallingLines: {
            backgroundColor: "#171717",
            particlesColor: "#ffffff",
            numberOfLines: 3
        },
        floatingCircles: {
            backgroundColor: "#4e54c8",
            particlesColor: "#ffffff"
        }
    }
    saveCustomSettings(settings);

    backgroundLayer.style.backgroundImage = "";
    backgroundLayer.style.filter = "";
    vignetteLayer.style.background = "";
    resetBackgroundControls();
    document.body.style.backgroundColor = "#000";

    document.querySelector('input[value="stars"]').checked = true;
    backgroundSearchInput.style.display = "none";
    gallery.innerHTML = "";
    effectsPanel.style.display = "none";

    applyProceduralBackground("stars");

    return settings;
}

function addListenerForInputControl(control, jsonVariable, defaultValue) {
    control.addEventListener("input", (e) => {
        const blur = parseInt(e.target.value);
        const settings = loadCustomSettings();
        settings.bg[jsonVariable] = blur;
        saveCustomSettings(settings);
        applyBackgroundEffects(settings);
    });

    control.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const settings = loadCustomSettings();
        settings.bg[jsonVariable] = defaultValue;
        control.value = settings.bg[jsonVariable];
        saveCustomSettings(settings);
        applyBackgroundEffects(settings);
    });
}

const debouncedSearch = debounce(async (query) => {
    if (query.trim()) {
        await fetchSearchResults(query.trim());
    }
}, 500);

document.querySelectorAll('input[name="bg-mode"]').forEach(radio => {
    radio.addEventListener("change", async (e) => {
        const mode = e.target.value;
        const settings = loadCustomSettings();

        if (["search-image", "dynamic-search"].includes(mode) && !settings.bg.bgApiKey) {
            return;
        }

        settings.bg.bgMode = mode;
        if (mode !== "dynamic-search") {
            delete settings.bg.dynamicBgLast;
            saveCustomSettings(settings);
        }
        setDisplay(backgroundSearchInput, "none");
        gallery.innerHTML = "";
        dynamicConfig.style.display = "none";
        applyBackgroundMode(mode, settings, true);
        if (mode === "custom-image") {
            fileInput.value = "";
            fileInput.click();
        }
        if (mode === "search-image") {
            setDisplay(backgroundSearchInput, "block");
            if (settings.bg.bgImage && settings.bg.bgSource === "search") {
                setBackgroundImageWithFade(settings.bg.bgImage, settings.bg.bgFit);
            }
            const tag = backgroundSearchInput.value.trim();
            if (tag) await fetchSearchResults(tag);
        }
        if (mode === "dynamic-search") {
            setDisplay(dynamicConfig, "flex");
            if (settings.bg.dynamicTag) await applyDynamicBackground(settings);
        }

        saveCustomSettings(settings);
    });
});

document.querySelector('input[value="custom-image"]').addEventListener("click", () => {
    fileInput.value = "";
    fileInput.click();
});


fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        const settings = loadCustomSettings();

        setBackgroundImageWithFade(event.target.result, settings.bg.bgFit);
        document.body.style.backgroundColor = "";

        settings.bg.bgImage = event.target.result;
        settings.bg.bgSource = "custom";
        applyBackgroundFit(settings.bg.bgFit);
        saveCustomSettings(settings);
    };

    reader.readAsDataURL(file);
});

document.querySelector('input[value="search-image"]').addEventListener("change", () => {
    const settings = loadCustomSettings();
    if (!settings.bg.bgApiKey) {
        showNotification("warning", "Please set a valid Pixabay API key to use image search features.");
        switchToStars();
        return;
    }

    disableStarfield();
    cleanupBeforeEnableBackground();
    backgroundSearchInput.style.display = "block";
});

backgroundSearchInput.addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
});

addListenerForInputControl(blurControl, "bgBlur", 20);
addListenerForInputControl(brightnessControl, "bgBrightness", 100);
addListenerForInputControl(vignetteControl, "bgVignette", 5);

document.getElementById("reset-bg").addEventListener("click", resetBgSettings);

document.querySelector('input[value="dynamic-search"]').addEventListener("change", async () => {
    const settings = loadCustomSettings();
    if (!settings.bg.bgApiKey) {
        showNotification("warning", "Please set a valid Pixabay API key to use image search features.");
        switchToStars();
        return;
    }

    dynamicConfig.style.display = "flex";
    effectsPanel.style.display = "flex";
    backgroundSearchInput.style.display = "none";
    gallery.innerHTML = "";
    document.body.style.backgroundColor = "";
    disableStarfield();
    cleanupBeforeEnableBackground();

    if (settings.bg.bgSource !== "dynamic") {
        delete settings.bg.bgImage;
    }
    settings.bg.bgSource = "dynamic";
    settings.bg.bgMode = "dynamic-search";

    if (!settings.bg.dynamicInterval) {
        settings.bg.dynamicInterval = "onload";
    }
    saveCustomSettings(settings);

    await applyDynamicBackground(settings, true);
});

dynamicTag.addEventListener("input", async (e) => {
    const tag = e.target.value.trim();
    const settings = loadCustomSettings();
    settings.bg.dynamicTag = tag;
    saveCustomSettings(settings);

    if (tag) {
        await applyDynamicBackground(settings);
    }
});

dynamicInterval.addEventListener("change", async (e) => {
    const settings = loadCustomSettings();
    settings.bg.dynamicInterval = e.target.value;
    saveCustomSettings(settings);
    await applyDynamicBackground(settings);
});

bgFit.addEventListener("change", (e) => {
    const fit = e.target.value;
    const settings = loadCustomSettings();
    settings.bg.bgFit = fit;
    saveCustomSettings(settings);
    applyBackgroundFit(fit);
});

backgroundApiKeyInput?.addEventListener("change", () => {
    const key = backgroundApiKeyInput.value.trim();
    updateBackgroundSettings((s) => {
        s.bg.bgApiKey = key;
    });

    if (!key) {
        showNotification("warning", "Please set a valid Pixabay API key to use image search features.");
        switchToStars();
    }
});

function switchToStars() {
    const starsRadio = document.querySelector('input[name="bg-mode"][value="stars"]');

    if (starsRadio) {
        starsRadio.checked = true;

        starsRadio.dispatchEvent(new Event("change", {bubbles: true}));
    }
}
