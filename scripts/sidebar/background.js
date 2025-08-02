const brightnessControl = document.getElementById("bg-brightness");
const blurControl = document.getElementById("bg-blur");
const vignetteControl = document.getElementById("bg-vignette");
const vignetteLayer = document.getElementById("vignette-layer");

async function applyDynamicBackground(settings, force = false) {
    const now = Date.now();
    const lastChange = parseInt(settings.bg.dynamicBgLast || "0");
    const interval = settings.bg.dynamicInterval;

    const shouldChange = force ||
        interval === "onload" ||
        (interval !== "onload" && now - lastChange > interval * 60 * 1000);

    if (!shouldChange && settings.bg.bgImage) {
        backgroundLayer.style.backgroundImage = `url(${settings.bg.bgImage})`;
        applyBackgroundFit(settings.bg.bgFit);
        return;
    }

    const imageUrl = await fetchRandomImageByTag(settings.bg.dynamicTag);
    if (imageUrl) {
        backgroundLayer.style.backgroundImage = `url(${imageUrl})`;
        settings.bg.bgImage = imageUrl;
        settings.bg.bgSource = "dynamic";
        settings.bg.dynamicBgLast = now.toString();
        applyBackgroundFit(settings.bg.bgFit);
        saveCustomSettings(settings);
    }
}

async function fetchSearchResults(tag) {
    const loading = document.getElementById("bg-loading");
    const gallery = document.getElementById("bg-results");

    loading.style.display = "block";
    gallery.innerHTML = "";

    try {
        const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(tag)}&image_type=photo`);
        const data = await response.json();

        data.hits.slice(0, 6).forEach(img => {
            const image = document.createElement("img");
            image.src = img.webformatURL;
            image.alt = img.tags;
            image.addEventListener("click", () => {
                backgroundLayer.style.backgroundImage = `url(${img.largeImageURL})`;
                document.body.style.backgroundColor = "";

                const settings = loadCustomSettings();
                settings.bg.bgImage = img.largeImageURL;
                settings.bg.bgSource = "search";
                applyBackgroundFit(settings.bg.bgFit);
                saveCustomSettings(settings);
            });
            gallery.appendChild(image);
        });
    } catch (err) {
        gallery.innerHTML = "<div style='color: #f88;'>Error loading images</div>";
    } finally {
        loading.style.display = "none";
    }
}

async function fetchRandomImageByTag(tag) {
    const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(tag)}&image_type=photo`);
    const data = await response.json();
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

function applyBackgroundMode(mode, settings) {
    const effectsPanel = document.getElementById("bg-effects-group");
    switch (mode) {
        case "stars":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableStarfield();
            break;
        case "blobFlow":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableBlobFlow();
            break;
        case "nebulaDust":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableNebulaDust();
            break;
        case "glassGrid":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableGlassGrid();
            break;
        case "orbitalRings":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableOrbitalRings();
            break;
        case "particleDrift":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableParticleDrift();
            break;
        default:
            effectsPanel.style.display = "flex";
            document.body.style.backgroundColor = "";
            disableStarfield();
            disableDynamicBackground(backgroundLayer);
            applyBackgroundEffects(settings);
            break;
    }
}

async function loadBackground(settings) {
    if (!settings.bg) {
        settings.bg = {
            bgMode: "stars",
            bgImage: "",
            bgSource: "",
            bgBlur: 20,
            bgBrightness: 100,
            bgVignette: 5,
            bgFit: "cover",
            dynamicTag: "",
            dynamicInterval: ""
        }
        saveCustomSettings(settings);
        enableStarfield();
    }

    const modeInput = document.querySelector(`input[value="${settings.bg.bgMode}"]`);
    if (modeInput) {
        modeInput.checked = true;
    }

    const effectsPanel = document.getElementById("bg-effects-group");
    const backgroundSearchInput = document.getElementById("bg-search");
    const dynamicConfig = document.getElementById("dynamic-search-config");

    switch (settings.bg.bgMode) {
        case "stars":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableStarfield();
            break;
        case "blobFlow":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableBlobFlow();
            break;
        case "nebulaDust":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableNebulaDust();
            break;
        case "glassGrid":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableGlassGrid();
            break;
        case "orbitalRings":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableOrbitalRings();
            break;
        case "particleDrift":
            effectsPanel.style.display = "none";
            backgroundLayer.style.backgroundImage = "";
            backgroundLayer.style.filter = "";
            document.body.style.backgroundColor = "#000";
            enableParticleDrift();
            break;
        default:
            effectsPanel.style.display = "flex";
            document.body.style.backgroundColor = "";
            disableStarfield();
            disableDynamicBackground(backgroundLayer)
            applyBackgroundEffects(settings);
            break;
    }

    blurControl.value = settings.bg.bgBlur;
    brightnessControl.value = settings.bg.bgBrightness;
    vignetteControl.value = settings.bg.bgVignette;

    document.getElementById("bg-fit").value = settings.bg.bgFit;
    applyBackgroundFit(settings.bg.bgFit);

    if (settings.bg.bgMode === "search-image") {
        backgroundSearchInput.style.display = "block";
        const tag = backgroundSearchInput.value.trim();
        if (tag) await fetchSearchResults(tag);
    }

    if (settings.bg.bgMode === "dynamic-search") {
        dynamicConfig.style.display = "flex";
        if (settings.bg.dynamicTag) {
            document.getElementById("dynamic-tag").value = settings.bg.dynamicTag;
            await applyDynamicBackground(settings);
        }
        if (settings.bg.dynamicInterval) {
            document.getElementById("dynamic-interval").value = settings.bg.dynamicInterval;
        }
    }

    if (settings.bg.bgImage &&
        ((settings.bg.bgMode === "custom-image" && settings.bg.bgSource === "custom") ||
            (settings.bg.bgMode === "search-image" && settings.bg.bgSource === "search") ||
            (settings.bg.bgMode === "dynamic-search" && settings.bg.bgSource === "dynamic"))
    ) {
        backgroundLayer.style.backgroundImage = `url(${settings.bg.bgImage})`;
        applyBackgroundFit(settings.bg.bgFit);
    }
}

const debouncedSearch = debounce(async (query) => {
    if (query.trim()) {
        await fetchSearchResults(query.trim());
    }
}, 500);

document.querySelectorAll('input[name="bg-mode"]').forEach(radio => {
    radio.addEventListener("change", async (e) => {
        const mode = e.target.value;
        const backgroundSearchInput = document.getElementById("bg-search");
        const gallery = document.getElementById("bg-results");
        const fileInput = document.getElementById("bg-upload");
        const dynamicConfig = document.getElementById("dynamic-search-config");
        const settings = loadCustomSettings();
        settings.bg.bgMode = mode;
        if (mode !== "dynamic-search") localStorage.removeItem("dynamic_bg_last");
        setDisplay(backgroundSearchInput, "none");
        gallery.innerHTML = "";
        dynamicConfig.style.display = "none";
        applyBackgroundMode(mode, settings);
        if (mode === "custom-image") {
            fileInput.value = "";
            fileInput.click();
        }
        if (mode === "search-image") {
            setDisplay(backgroundSearchInput, "block");
            if (settings.bg.bgImage && settings.bg.bgSource === "search") {
                backgroundLayer.style.backgroundImage = `url(${settings.bg.bgImage})`;
                applyBackgroundFit(settings.bg.bgFit);
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
    const fileInput = document.getElementById("bg-upload");
    fileInput.value = ""; // сброс
    fileInput.click();
});


document.getElementById("bg-upload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        backgroundLayer.style.backgroundImage = `url(${event.target.result})`;
        document.body.style.backgroundColor = "";

        const settings = loadCustomSettings();
        settings.bg.bgImage = event.target.result;
        settings.bg.bgSource = "custom";
        applyBackgroundFit(settings.bg.bgFit);
        saveCustomSettings(settings);
    };

    reader.readAsDataURL(file);
});

document.querySelector('input[value="search-image"]').addEventListener("change", () => {
    disableStarfield();
    document.getElementById("bg-search").style.display = "block";
});

document.getElementById("bg-search").addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
});

blurControl.addEventListener("input", (e) => {
    const blur = parseInt(e.target.value);
    const settings = loadCustomSettings();
    settings.bg.bgBlur = blur;
    saveCustomSettings(settings);
    applyBackgroundEffects(settings);
});

brightnessControl.addEventListener("input", (e) => {
    const brightness = parseInt(e.target.value);
    const settings = loadCustomSettings();
    settings.bg.bgBrightness = brightness;
    saveCustomSettings(settings);
    applyBackgroundEffects(settings);
});

vignetteControl.addEventListener("input", (e) => {
    const vignette = parseInt(e.target.value);
    const settings = loadCustomSettings();
    settings.bg.bgVignette = vignette;
    saveCustomSettings(settings);
    applyBackgroundEffects(settings);
});

document.getElementById("reset-bg").addEventListener("click", () => {
    const settings = loadCustomSettings();
    settings.bg.bgMode = "stars";
    settings.bg.bgBlur = 0;
    settings.bg.bgBrightness = 100;
    settings.bg.bgVignette = 0;
    saveCustomSettings(settings);

    backgroundLayer.style.backgroundImage = "";
    backgroundLayer.style.filter = "";
    vignetteLayer.style.background = "";
    resetBackgroundControls();
    document.body.style.backgroundColor = "#000";

    document.querySelector('input[value="stars"]').checked = true;
    document.getElementById("bg-search").style.display = "none";
    document.getElementById("bg-results").innerHTML = "";
    document.getElementById("bg-effects-group").style.display = "none";

    enableStarfield();
});

document.querySelector('input[value="dynamic-search"]').addEventListener("change", async () => {
    document.getElementById("dynamic-search-config").style.display = "flex";
    document.getElementById("bg-effects-group").style.display = "flex";
    document.getElementById("bg-search").style.display = "none";
    document.getElementById("bg-results").innerHTML = "";
    document.body.style.backgroundColor = "";
    disableStarfield();

    const settings = loadCustomSettings();
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

document.getElementById("dynamic-tag").addEventListener("input", async (e) => {
    const tag = e.target.value.trim();
    const settings = loadCustomSettings();
    settings.bg.dynamicTag = tag;
    saveCustomSettings(settings);

    if (tag) {
        await applyDynamicBackground(settings);
    }
});

document.getElementById("dynamic-interval").addEventListener("change", async (e) => {
    const settings = loadCustomSettings();
    settings.bg.dynamicInterval = e.target.value;
    saveCustomSettings(settings);
    await applyDynamicBackground(settings);
});

document.getElementById("bg-fit").addEventListener("change", (e) => {
    const fit = e.target.value;
    const settings = loadCustomSettings();
    settings.bg.bgFit = fit;
    saveCustomSettings(settings);
    applyBackgroundFit(fit);
});
