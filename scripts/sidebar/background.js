let backgroundTimeoutState = {};
Object.values(backgroundLayerNames).forEach(mode => {
    backgroundTimeoutState[mode] = { timeout: null };
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

const updateBackgroundSettings = async (mutator) => {
    const s = getBackgroundSettings();
    mutator(s);
    await saveCustomSettings(s);
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
        await saveCustomSettings(settings);
    }
}

async function fetchSearchResults(tag) {
    const settings = loadCustomSettings();
    loading.style.display = "block";
    gallery.innerHTML = "";

    try {
        const response = await fetch(`https://pixabay.com/api/?key=${settings.bg.bgApiKey}&q=${encodeURIComponent(tag)}&image_type=photo`);
        const data = await response.json();

        const fragment = document.createDocumentFragment();
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
                await applyBackgroundFit(settings.bg.bgFit);
                await saveCustomSettings(settings);
            });
            fragment.appendChild(image);
        });
        gallery.appendChild(fragment);
    } catch (err) {
        gallery.innerHTML = "<div style='color: #f88;'>Error loading images</div>";
        console.error("Error fetching images from Pixabay:", err);
        switchToStars();
    } finally {
        loading.style.display = "none";
    }
}

async function fetchRandomImageByTag(tag) {
    const settings = loadCustomSettings();
    try {
        const response = await fetch(`https://pixabay.com/api/?key=${settings.bg.bgApiKey}&q=${encodeURIComponent(tag)}&image_type=photo`);
        const data = await response.json();

        if (!data || !data.hits || data.hits.length === 0) {
            console.error("No images found");
            switchToStars();
            return null;
        }

        const random = data.hits[Math.floor(Math.random() * data.hits.length)];
        return random.largeImageURL;
    } catch (err) {
        console.error("Error fetching image:", err);
        switchToStars();
        return null;
    }
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

async function setBackgroundImageWithFade(url, fit, useFade = true) {
    if (!useFade) {
        backgroundLayer.style.opacity = "1";
        backgroundLayer.style.backgroundImage = `url(${url})`;
        await applyBackgroundFit(fit);
        return;
    }
    fadeBackground(async () => {
        backgroundLayer.style.backgroundImage = `url(${url})`;
        await applyBackgroundFit(fit);
    });
}

function applyProceduralBackground(settings, useFade) {
    const apply = () => {
        enableProceduralBackground(settings);
    };

    if (useFade) {
        fadeBackground(apply);
    } else {
        apply();
    }
}

function applyBackgroundMode(settings, useFade = true) {
    if (Object.values(backgroundLayerNames).includes(settings.bg.bgMode)) {
        applyProceduralBackground(settings, useFade);
    } else {
        effectsPanel.style.display = "flex";
        document.body.style.backgroundColor = "";
        disableStarfield();
        cleanupBeforeEnableBackground();
        if (useFade) {
            fadeBackground(() => applyBackgroundEffects(settings));
        } else {
            applyBackgroundEffects(settings);
        }
    }
}

async function loadBackground() {
    let settings = loadCustomSettings();

    if (!settings.bg) {
        settings = await resetBgSettings();
    }
    await saveCustomSettings(settings);

    backgroundApiKeyInput.value = settings.bg.bgApiKey || "";

    const modeInput = document.querySelector(`input[value="${settings.bg.bgMode}"]`);
    if (modeInput) {
        modeInput.checked = true;
    }

    if (Object.values(backgroundLayerNames).includes(settings.bg.bgMode)) {
        enableProceduralBackground(settings);
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

    await applyBackgroundFit(settings.bg.bgFit);

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
        await setBackgroundImageWithFade(settings.bg.bgImage, settings.bg.bgFit, false);
    }
}

function enableProceduralBackground(settings) {
    effectsPanel.style.display = "none";
    backgroundLayer.style.backgroundImage = "";
    backgroundLayer.style.filter = "";
    document.body.style.backgroundColor = "#000";

    document.querySelectorAll(".procedural-controls-element").forEach(control => {
        control.style.display = "none";
    });

    const proceduralControls = document.getElementById(`procedural-controls--${settings.bg.bgMode}`);
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

    if (modeHandlers[settings.bg.bgMode]) {
        modeHandlers[settings.bg.bgMode]();
        setLinksColor(settings.bg[settings.bg.bgMode].customization.linksColor || "#ffffff");
        (async () => {
            await Promise.all([loadTimeAndDate(), loadLinks()]);
        })();
    }
}

async function resetBgSettings() {
    const settings = loadCustomSettings();
    const customizations = await Promise.all(
        Object.keys(backgroundLayerNames).map(key => getDefaultCustomizationByKey(key))
    );

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
        bgApiKey: ""
    };

    Object.keys(backgroundLayerNames).forEach((key, index) => {
        settings.bg[key] = { customization: customizations[index] };
    });

    settings.bg.blobFlow = { ...settings.bg.blobFlow, backgroundColor: "rgb(0, 0, 0)", blur: 0, size: 60 };
    settings.bg.nebulaDust = { ...settings.bg.nebulaDust, backgroundColor: "rgb(0, 0, 0)", numberOfParticles: 150, particlesColor: "#aa66ff" };
    settings.bg.glassGrid = { ...settings.bg.glassGrid, backgroundColor: "rgb(0, 0, 0)", particlesColor: "#ffffff", numberOfParticles: 40, particlesTransparency: 0.05 };
    settings.bg.orbitalRings = { ...settings.bg.orbitalRings, backgroundColor: "rgb(0, 0, 0)", particlesColor: "#ffffff", numberOfParticles: 5 };
    settings.bg.particleDrift = { ...settings.bg.particleDrift, backgroundColor: "rgb(0, 0, 0)", particlesColor: "#ffffff", numberOfParticles: 100 };
    settings.bg.cloudySpiral = { ...settings.bg.cloudySpiral, backgroundColor: "#6593c5", particlesColor: "#ffffff", radius: 80, particleSize: 8, lapDuration: 3000, numberOfParticles: 62 };
    settings.bg.waves = { ...settings.bg.waves, firstWaveColor: "#ffffff", secondWaveColor: "#ffffff", thirdWaveColor: "#ffffff", fourthWaveColor: "#ffffff", leftBackgroundColor: "#543ab7", rightBackgroundColor: "#00acc1", useOnlyFirstWaveColor: false };
    settings.bg.fallingLines = { ...settings.bg.fallingLines, backgroundColor: "#171717", particlesColor: "#ffffff", numberOfLines: 3 };
    settings.bg.floatingCircles = { ...settings.bg.floatingCircles, backgroundColor: "#4e54c8", particlesColor: "#ffffff" };

    await saveCustomSettings(settings);

    backgroundLayer.style.backgroundImage = "";
    backgroundLayer.style.filter = "";
    vignetteLayer.style.background = "";
    resetBackgroundControls();
    document.body.style.backgroundColor = "#000";

    document.querySelector('input[value="stars"]').checked = true;
    backgroundSearchInput.style.display = "none";
    gallery.innerHTML = "";
    effectsPanel.style.display = "none";

    applyProceduralBackground(settings);
    return settings;
}

function addListenerForInputControl(control, jsonVariable, defaultValue) {
    const handleInput = debounce(async (e) => {
        const settings = loadCustomSettings();
        settings.bg[jsonVariable] = parseInt(e.target.value);
        await saveCustomSettings(settings);
        applyBackgroundEffects(settings);
    }, 200);

    control.addEventListener("input", handleInput);
    control.addEventListener("contextmenu", async (e) => {
        e.preventDefault();
        const settings = loadCustomSettings();
        settings.bg[jsonVariable] = defaultValue;
        control.value = defaultValue;
        await saveCustomSettings(settings);
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
            await saveCustomSettings(settings);
        }

        setDisplay(backgroundSearchInput, "none");
        gallery.innerHTML = "";
        dynamicConfig.style.display = "none";
        applyBackgroundMode(settings, true);

        if (mode === "custom-image") {
            fileInput.value = "";
            fileInput.click();
            setLinksColor(settings.bg[settings.bg.bgMode].customization.linksColor || "#ffffff");
            await Promise.all([loadTimeAndDate(), loadLinks()]);
        }

        if (mode === "search-image") {
            setDisplay(backgroundSearchInput, "block");
            if (settings.bg.bgImage && settings.bg.bgSource === "search") {
                await setBackgroundImageWithFade(settings.bg.bgImage, settings.bg.bgFit);
            }
            const tag = backgroundSearchInput.value.trim();
            if (tag) await fetchSearchResults(tag);
            setLinksColor(settings.bg[settings.bg.bgMode].customization.linksColor || "#ffffff");
            await Promise.all([loadTimeAndDate(), loadLinks()]);
        }

        if (mode === "dynamic-search") {
            setDisplay(dynamicConfig, "flex");
            if (settings.bg.dynamicTag) await applyDynamicBackground(settings);
            setLinksColor(settings.bg[settings.bg.bgMode].customization.linksColor || "#ffffff");
            await Promise.all([loadTimeAndDate(), loadLinks()]);
        }

        await saveCustomSettings(settings);
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
    reader.onload = async function (event) {
        const settings = loadCustomSettings();
        await setBackgroundImageWithFade(event.target.result, settings.bg.bgFit);
        document.body.style.backgroundColor = "";
        settings.bg.bgImage = event.target.result;
        settings.bg.bgSource = "custom";
        await applyBackgroundFit(settings.bg.bgFit);
        await saveCustomSettings(settings);
    };
    reader.readAsDataURL(file);
});

document.querySelector('input[value="search-image"]').addEventListener("change", () => {
    const settings = loadCustomSettings();
    if (!settings.bg.bgApiKey) {
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
    await saveCustomSettings(settings);
    await applyDynamicBackground(settings, true);
});

dynamicTag.addEventListener("input", debounce(async (e) => {
    const tag = e.target.value.trim();
    const settings = loadCustomSettings();
    settings.bg.dynamicTag = tag;
    await saveCustomSettings(settings);
    if (tag) {
        await applyDynamicBackground(settings);
    }
}, 500));

dynamicInterval.addEventListener("change", async (e) => {
    const settings = loadCustomSettings();
    settings.bg.dynamicInterval = e.target.value;
    await saveCustomSettings(settings);
    await applyDynamicBackground(settings);
});

bgFit.addEventListener("change", async (e) => {
    const fit = e.target.value;
    const settings = loadCustomSettings();
    settings.bg.bgFit = fit;
    await saveCustomSettings(settings);
    await applyBackgroundFit(fit);
});

backgroundApiKeyInput?.addEventListener("change", debounce(async () => {
    const key = backgroundApiKeyInput.value.trim();
    await updateBackgroundSettings((s) => {
        s.bg.bgApiKey = key;
    });
    if (!key) {
        switchToStars();
    }
}, 500));

function switchToStars() {
    const starsRadio = document.querySelector('input[name="bg-mode"][value="stars"]');
    if (starsRadio) {
        starsRadio.checked = true;
        starsRadio.dispatchEvent(new Event("change", {bubbles: true}));
    }
}
