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
    const effectsPanel = document.getElementById("bg-effects-group");

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

async function loadBackground(settings) {
    if (!settings.bg) {
        resetBgSettings();
    }
    settings = loadCustomSettings();

    const modeInput = document.querySelector(`input[value="${settings.bg.bgMode}"]`);
    if (modeInput) {
        modeInput.checked = true;
    }

    const backgroundSearchInput = document.getElementById("bg-search");
    const dynamicConfig = document.getElementById("dynamic-search-config");

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
        "blobFlow": () => enableBlowFlowWithProceduralControls(proceduralControls),
        "nebulaDust": () => enableNebulaDustWithProceduralControls(proceduralControls),
        "glassGrid": () => enableGlassGridWithProceduralControls(proceduralControls),
        "orbitalRings": () => enableOrbitalRingsWithProceduralControls(proceduralControls),
        "particleDrift": () => enableParticleDriftWithProceduralControls(proceduralControls),
        "cloudySpiral": () => enableCloudySpiralWithProceduralControls(proceduralControls),
        "waves": () => enableWavesBackgroundWithProceduralControls(proceduralControls),
        "fallingLines": () => enableFallingLinesBackgroundWithProceduralControls(proceduralControls),
        "floatingCircles": () => enableFloatingCirclesBackgroundWithProceduralControls(proceduralControls)
    };

    if (modeHandlers[mode.toString()]) {
        modeHandlers[mode.toString()]();
    }
}

function enableBlowFlowWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.blobFlow.backgroundColor,
        "blobFlow",
        "backgroundColor",
        enableBlobFlow
    );

    const backgroundSizeLabel = createRangeInput(
        "Size: ",
        "bg-blob-size",
        "30",
        "150",
        "1",
        settings.bg.blobFlow.size,
        "blobFlow",
        "size",
        enableBlobFlow
    );
    const backgroundBlurLabel = createRangeInput(
        "Blur: ",
        "bg-blob-blur",
        "0",
        "50",
        "1",
        settings.bg.blobFlow.blur,
        "blobFlow",
        "blur",
        enableBlobFlow
    );

    proceduralControls.appendChild(backgroundBlurLabel);
    proceduralControls.appendChild(backgroundSizeLabel);
    proceduralControls.appendChild(backgroundColorLabel);

    enableBlobFlow(settings);
}

function enableNebulaDustWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.nebulaDust.backgroundColor,
        "nebulaDust",
        "backgroundColor",
        enableNebulaDust
    );
    const particlesColorLabel = createColorInput(
        "Particles color: ",
        "bg-particles-color",
        settings.bg.nebulaDust.particlesColor,
        "nebulaDust",
        "particlesColor",
        enableNebulaDust
    );

    const backgroundParticlesNumberLabel = createRangeInput(
        "Number of particles: ",
        "bg-number-of-particles",
        "30",
        "300",
        "1",
        settings.bg.nebulaDust.numberOfParticles,
        "nebulaDust",
        "numberOfParticles",
        enableNebulaDust
    );

    proceduralControls.appendChild(backgroundParticlesNumberLabel);
    proceduralControls.appendChild(backgroundColorLabel);
    proceduralControls.appendChild(particlesColorLabel);

    enableNebulaDust(settings);
}

function enableGlassGridWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.glassGrid.backgroundColor,
        "glassGrid",
        "backgroundColor",
        enableGlassGrid
    );
    const particlesColorLabel = createColorInput(
        "Particles color: ",
        "bg-particles-color",
        settings.bg.glassGrid.particlesColor,
        "glassGrid",
        "particlesColor",
        enableGlassGrid
    );


    const backgroundParticlesNumberLabel = createRangeInput(
        "Number of particles: ",
        "bg-glass-particles",
        "20",
        "100",
        "1",
        settings.bg.glassGrid.numberOfParticles,
        "glassGrid",
        "numberOfParticles",
        enableGlassGrid
    );
    const particlesTransparencyLabel = createRangeInput(
        "Particles transparency: ",
        "bg-glass-transparency",
        "0",
        "1",
        "0.01",
        settings.bg.glassGrid.particlesTransparency,
        "glassGrid",
        "particlesTransparency",
        enableGlassGrid
    );

    proceduralControls.appendChild(particlesTransparencyLabel);
    proceduralControls.appendChild(backgroundParticlesNumberLabel);
    proceduralControls.appendChild(backgroundColorLabel);
    proceduralControls.appendChild(particlesColorLabel);

    enableGlassGrid(settings);
}

function enableOrbitalRingsWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.orbitalRings.backgroundColor,
        "orbitalRings",
        "backgroundColor",
        enableOrbitalRings
    );
    const particlesColorLabel = createColorInput(
        "Particles color: ",
        "bg-particles-color",
        settings.bg.orbitalRings.particlesColor,
        "orbitalRings",
        "particlesColor",
        enableOrbitalRings
    );

    const backgroundParticlesNumberLabel = createRangeInput(
        "Number of particles: ",
        "bg-orbital-particles",
        "3",
        "30",
        "1",
        settings.bg.orbitalRings.numberOfParticles,
        "orbitalRings",
        "numberOfParticles",
        enableOrbitalRings
    );

    proceduralControls.appendChild(backgroundColorLabel);
    proceduralControls.appendChild(particlesColorLabel);
    proceduralControls.appendChild(backgroundParticlesNumberLabel);

    enableOrbitalRings(settings);
}

function enableParticleDriftWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.particleDrift.backgroundColor,
        "particleDrift",
        "backgroundColor",
        enableParticleDrift
    );
    const particlesColorLabel = createColorInput(
        "Particles color: ",
        "bg-particles-color",
        settings.bg.particleDrift.particlesColor,
        "particleDrift",
        "particlesColor",
        enableParticleDrift
    );

    const backgroundParticlesNumberLabel = createRangeInput(
        "Number of particles: ",
        "bg-drift-particles",
        "70",
        "250",
        "1",
        settings.bg.particleDrift.numberOfParticles,
        "particleDrift",
        "numberOfParticles",
        enableParticleDrift
    );

    proceduralControls.appendChild(backgroundColorLabel);
    proceduralControls.appendChild(particlesColorLabel);
    proceduralControls.appendChild(backgroundParticlesNumberLabel);

    enableParticleDrift(settings);
}

function enableCloudySpiralWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.cloudySpiral.backgroundColor,
        "cloudySpiral",
        "backgroundColor",
        enableCloudySpiral
    );
    const particlesColorLabel = createColorInput(
        "Particles color: ",
        "bg-particles-color",
        settings.bg.cloudySpiral.particlesColor,
        "cloudySpiral",
        "particlesColor",
        enableCloudySpiral
    );

    const backgroundParticlesNumberLabel = createRangeInput(
        "Number of particles: ",
        "bg-cloudy-particles",
        "50",
        "100",
        "1",
        settings.bg.cloudySpiral.numberOfParticles,
        "cloudySpiral",
        "numberOfParticles",
        enableCloudySpiral
    );

    const particleSizeNumberLabel = createRangeInput(
        "Size of particles: ",
        "bg-cloudy-particles-size",
        "5",
        "15",
        "1",
        settings.bg.cloudySpiral.particleSize,
        "cloudySpiral",
        "particleSize",
        enableCloudySpiral
    );

    const particleRadiusNumberLabel = createRangeInput(
        "Radius of particles: ",
        "bg-cloudy-particles-radius",
        "50",
        "200",
        "1",
        settings.bg.cloudySpiral.radius,
        "cloudySpiral",
        "radius",
        enableCloudySpiral
    );

    const lapDurationNumberLabel = createRangeInput(
        "Lap duration: ",
        "bg-cloudy-particles-lap-duration",
        "3000",
        "6000",
        "10",
        settings.bg.cloudySpiral.lapDuration,
        "cloudySpiral",
        "lapDuration",
        enableCloudySpiral
    );

    proceduralControls.appendChild(backgroundColorLabel);
    proceduralControls.appendChild(particlesColorLabel);
    proceduralControls.appendChild(backgroundParticlesNumberLabel);
    proceduralControls.appendChild(particleSizeNumberLabel);
    proceduralControls.appendChild(particleRadiusNumberLabel);
    proceduralControls.appendChild(lapDurationNumberLabel);

    enableCloudySpiral(settings);
}

function enableWavesBackgroundWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const leftBackgroundColorLabel = createColorInput(
        "Left Background color: ",
        "bg-left-color",
        settings.bg.waves.leftBackgroundColor,
        "waves",
        "leftBackgroundColor",
        enableWavesBackground
    );
    const rightBackgroundColorLabel = createColorInput(
        "Right Background color: ",
        "bg-right-color",
        settings.bg.waves.rightBackgroundColor,
        "waves",
        "rightBackgroundColor",
        enableWavesBackground
    );


    const firstWaveColorLabel = createColorInput(
        "First Wave color: ",
        "bg-first-wave-color",
        settings.bg.waves.firstWaveColor,
        "waves",
        "firstWaveColor",
        enableWavesBackground
    );
    const secondWaveColorLabel = createColorInput(
        "Second Wave color: ",
        "bg-second-wave-color",
        settings.bg.waves.secondWaveColor,
        "waves",
        "secondWaveColor",
        enableWavesBackground
    );
    const thirdWaveColorLabel = createColorInput(
        "Third Wave color: ",
        "bg-third-wave-color",
        settings.bg.waves.thirdWaveColor,
        "waves",
        "thirdWaveColor",
        enableWavesBackground
    );
    const fourthWaveColorLabel = createColorInput(
        "Fourth Wave color: ",
        "bg-fourth-wave-color",
        settings.bg.waves.fourthWaveColor,
        "waves",
        "fourthWaveColor",
        enableWavesBackground
    );

    const useOnlyFirstWaveLabel = createCheckbox(
        "Use only first wave color: ",
        "bg-use-only-first-wave-color",
        settings.bg.waves.useOnlyFirstWaveColor,
        "waves",
        "useOnlyFirstWaveColor",
        enableWavesBackground
    );

    proceduralControls.appendChild(leftBackgroundColorLabel);
    proceduralControls.appendChild(rightBackgroundColorLabel);

    proceduralControls.appendChild(firstWaveColorLabel);
    proceduralControls.appendChild(secondWaveColorLabel);
    proceduralControls.appendChild(thirdWaveColorLabel);
    proceduralControls.appendChild(fourthWaveColorLabel);

    proceduralControls.appendChild(useOnlyFirstWaveLabel);

    enableWavesBackground(settings);
}

function enableFallingLinesBackgroundWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.fallingLines.backgroundColor,
        "fallingLines",
        "backgroundColor",
        enableFallingLinesBackground
    );
    const particlesColorLabel = createColorInput(
        "Particles color: ",
        "bg-particles-color",
        settings.bg.fallingLines.particlesColor,
        "fallingLines",
        "particlesColor",
        enableFallingLinesBackground
    );

    const backgroundParticlesNumberLabel = createRangeInput(
        "Number of lines: ",
        "bg-fallingLines-particles",
        "3",
        "5",
        "1",
        settings.bg.fallingLines.numberOfLines,
        "fallingLines",
        "numberOfLines",
        enableFallingLinesBackground
    );

    proceduralControls.appendChild(backgroundColorLabel);
    proceduralControls.appendChild(particlesColorLabel);
    proceduralControls.appendChild(backgroundParticlesNumberLabel);

    enableFallingLinesBackground(settings);
}

function enableFloatingCirclesBackgroundWithProceduralControls(proceduralControls) {
    const settings = loadCustomSettings();

    const backgroundColorLabel = createColorInput(
        "Background color: ",
        "bg-color",
        settings.bg.floatingCircles.backgroundColor,
        "floatingCircles",
        "backgroundColor",
        enableFloatingCirclesBackground
    );
    const particlesColorLabel = createColorInput(
        "Particles color: ",
        "bg-particles-color",
        settings.bg.floatingCircles.particlesColor,
        "floatingCircles",
        "particlesColor",
        enableFloatingCirclesBackground
    );

    proceduralControls.appendChild(backgroundColorLabel);
    proceduralControls.appendChild(particlesColorLabel);

    enableFloatingCirclesBackground(settings);
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
    document.getElementById("bg-search").style.display = "none";
    document.getElementById("bg-results").innerHTML = "";
    document.getElementById("bg-effects-group").style.display = "none";

    applyProceduralBackground("stars");
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
        const backgroundSearchInput = document.getElementById("bg-search");
        const gallery = document.getElementById("bg-results");
        const fileInput = document.getElementById("bg-upload");
        const dynamicConfig = document.getElementById("dynamic-search-config");
        const settings = loadCustomSettings();
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
    const fileInput = document.getElementById("bg-upload");
    fileInput.value = ""; // сброс
    fileInput.click();
});


document.getElementById("bg-upload").addEventListener("change", (e) => {
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
    disableStarfield();
    cleanupBeforeEnableBackground();
    document.getElementById("bg-search").style.display = "block";
});

document.getElementById("bg-search").addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
});

addListenerForInputControl(blurControl, "bgBlur", 20);
addListenerForInputControl(brightnessControl, "bgBrightness", 100);
addListenerForInputControl(vignetteControl, "bgVignette", 5);

document.getElementById("reset-bg").addEventListener("click", resetBgSettings);

document.querySelector('input[value="dynamic-search"]').addEventListener("change", async () => {
    document.getElementById("dynamic-search-config").style.display = "flex";
    document.getElementById("bg-effects-group").style.display = "flex";
    document.getElementById("bg-search").style.display = "none";
    document.getElementById("bg-results").innerHTML = "";
    document.body.style.backgroundColor = "";
    disableStarfield();
    cleanupBeforeEnableBackground();

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
