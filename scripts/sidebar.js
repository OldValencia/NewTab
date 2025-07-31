const colsValue = document.getElementById("cols-value");
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("menu-toggle");
const linksEditor = document.getElementById("links-editor");
const addLinkBtn = document.getElementById("add-link");
const toggleLinksCheckbox = document.getElementById("toggle-links");
const toggleOpenInNewTab = document.getElementById("toggle-open-in-new-tab");
const resetSettingsBtn = document.getElementById("reset-sticky-notes");
const clearContentBtn = document.getElementById("clear-sticky-notes");
const removeAllBtn = document.getElementById("remove-sticky-notes");
const toggleStickyNotes = document.getElementById("toggle-sticky-notes");
const timeFormatSelect = document.getElementById("time-format");
const dateFormatSelect = document.getElementById("date-format");
const timeFontSelect = document.getElementById("time-font");
const timeColorInput = document.getElementById("time-color");
const dateFontSelect = document.getElementById("date-font");
const dateColorInput = document.getElementById("date-color");
const toggleWeatherWidget = document.getElementById("toggle-weather-widget");
const weatherWidget = document.getElementById("weather-widget");
const resetWeatherBtn = document.getElementById("reset-weather-settings");
const brightnessControl = document.getElementById("bg-brightness");
const blurControl = document.getElementById("bg-blur");
const vignetteControl = document.getElementById("bg-vignette");
const vignetteLayer = document.getElementById("vignette-layer");

async function applyDynamicBackground(settings) {
    const now = Date.now();
    const lastChange = parseInt(localStorage.getItem("dynamic_bg_last") || "0");
    const interval = settings.dynamicInterval;
    const force = settings.force || false;

    const shouldChange =
        force ||
        interval === "onload" ||
        (interval !== "onload" && now - lastChange > interval * 60 * 1000);

    if (!shouldChange && settings.bgImage) {
        backgroundLayer.style.backgroundImage = `url(${settings.bgImage})`;
        applyBackgroundFit(settings.bgFit);
        return;
    }

    const imageUrl = await fetchRandomImageByTag(settings.dynamicTag);
    if (imageUrl) {
        backgroundLayer.style.backgroundImage = `url(${imageUrl})`;
        settings.bgImage = imageUrl;
        settings.bgSource = "dynamic";
        localStorage.setItem("dynamic_bg_last", now.toString());
        applyBackgroundFit(settings.bgFit);
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
                settings.bgImage = img.largeImageURL;
                settings.bgSource = "search";
                applyBackgroundFit(settings.bgFit);
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

function getOpenInNewTabState() {
    const settings = loadCustomSettings();
    if (settings.openInNewTabState === null) {
        settings.openInNewTabState = false;
        saveCustomSettings(settings);
        return false;
    }
    return settings.openInNewTabState;
}

function setOpenInNewTabState(value) {
    const settings = loadCustomSettings();
    settings.openInNewTabState = value;
    saveCustomSettings(settings);
    const linksFromStorage = getLinksFromStorage();
    renderLinks(linksFromStorage);
}

function renderEditor(links) {
    linksEditor.innerHTML = "";

    links.forEach((link, index) => {
        const div = document.createElement("div");
        div.className = "link-edit";
        div.draggable = true;
        div.dataset.index = index;

        // Drag events
        div.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            div.classList.add("dragging");
        });

        div.addEventListener("dragover", (e) => {
            e.preventDefault();
            div.classList.add("drag-over");
        });

        div.addEventListener("dragleave", () => {
            div.classList.remove("drag-over");
        });

        div.addEventListener("drop", (e) => {
            e.preventDefault();
            div.classList.remove("drag-over");
            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
            const toIndex = parseInt(div.dataset.index);

            if (fromIndex !== toIndex) {
                const moved = links.splice(fromIndex, 1)[0];
                links.splice(toIndex, 0, moved);
                saveLinksToStorage(links);
                renderLinks(links);
                renderEditor(links);
            }
        });

        div.addEventListener("dragend", () => {
            div.classList.remove("dragging");
        });

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.className = "delete-link";
        deleteBtn.addEventListener("click", () => {
            links.splice(index, 1);
            saveLinksToStorage(links);
            renderLinks(links);
            renderEditor(links);
        });

        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = link.label;
        labelInput.placeholder = "Название";

        const urlInput = document.createElement("input");
        urlInput.type = "text";
        urlInput.value = link.url;
        urlInput.placeholder = "URL";

        labelInput.addEventListener("input", () => {
            link.label = labelInput.value;
            saveLinksToStorage(links);
            renderLinks(links);
        });

        urlInput.addEventListener("input", () => {
            link.url = urlInput.value;
            saveLinksToStorage(links);
            renderLinks(links);
        });

        div.appendChild(deleteBtn);
        div.appendChild(labelInput);
        div.appendChild(urlInput);
        linksEditor.appendChild(div);
    });
}

toggleLinksCheckbox.addEventListener("change", () => {
    const visible = toggleLinksCheckbox.checked;
    linksContainer.style.display = visible ? "grid" : "none";
    showLinks(visible);
});

addLinkBtn.addEventListener("click", () => {
    const links = getLinksFromStorage();
    if (links.length >= 50) return alert("Maximum 50 links!");
    links.push({url: "", label: ""});
    saveLinksToStorage(links);
    renderLinks(links);
    renderEditor(links);
});

toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    toggleBtn.classList.toggle("shifted");
});

document.getElementById("reset-time-date").addEventListener("click", () => {
    const settings = loadCustomSettings();
    settings.timeFont = defaultTimeAndDateFont;
    settings.timeColor = defaultTimeColor;
    settings.dateFont = defaultTimeAndDateFont;
    settings.dateColor = defaultDateColor;
    settings.showTime = true;
    settings.showDate = true;
    settings.timeFormat = defaultTimeFormat;
    settings.dateFormat = defaultDateFormat;
    saveCustomSettings(settings);

    timeFontSelect.value = settings.timeFont;
    timeColorInput.value = settings.timeColor;
    dateFontSelect.value = settings.dateFont;
    dateColorInput.value = settings.dateColor;
    toggleTime.checked = true;
    toggleDate.checked = true;
    timeElement.style.display = "block";
    dateElement.style.display = "block";
    dateElement.style.fontFamily = settings.dateFont;
    dateElement.style.color = settings.dateColor;
    timeElement.style.fontFamily = settings.timeFont;
    timeElement.style.color = settings.timeColor;
    timeFormatSelect.value = settings.timeFormat;
    dateFormatSelect.value = settings.dateFormat;

    updateTime();
});

// Utility: Set element display
function setDisplay(element, value) {
    if (element) element.style.display = value;
}

// Utility: Reset background controls
function resetBackgroundControls() {
    blurControl.value = 0;
    brightnessControl.value = 0;
    vignetteControl.value = 0;
}

// Utility: Apply background mode
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

// Background
document.querySelectorAll('input[name="bg-mode"]').forEach(radio => {
    radio.addEventListener("change", async (e) => {
        const mode = e.target.value;
        const searchInput = document.getElementById("bg-search");
        const gallery = document.getElementById("bg-results");
        const fileInput = document.getElementById("bg-upload");
        const dynamicConfig = document.getElementById("dynamic-search-config");
        const settings = loadCustomSettings();
        settings.bgMode = mode;
        if (mode !== "dynamic-search") localStorage.removeItem("dynamic_bg_last");
        setDisplay(searchInput, "none");
        gallery.innerHTML = "";
        dynamicConfig.style.display = "none";
        applyBackgroundMode(mode, settings);
        if (mode === "custom-image") {
            fileInput.value = "";
            fileInput.click();
        }
        if (mode === "search-image") {
            setDisplay(searchInput, "block");
            if (settings.bgImage && settings.bgSource === "search") {
                backgroundLayer.style.backgroundImage = `url(${settings.bgImage})`;
                applyBackgroundFit(settings.bgFit);
            }
            const tag = searchInput.value.trim();
            if (tag) await fetchSearchResults(tag);
        }
        if (mode === "dynamic-search") {
            setDisplay(dynamicConfig, "flex");
            if (settings.dynamicTag) await applyDynamicBackground(settings);
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
        settings.bgImage = event.target.result;
        settings.bgSource = "custom";
        applyBackgroundFit(settings.bgFit);
        saveCustomSettings(settings);
    };

    reader.readAsDataURL(file);
});

document.querySelector('input[value="search-image"]').addEventListener("change", () => {
    disableStarfield();
    document.getElementById("bg-search").style.display = "block";
});

const debouncedSearch = debounce(async (query) => {
    if (query.trim()) {
        await fetchSearchResults(query.trim());
    }
}, 500);

document.getElementById("bg-search").addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
});

blurControl.addEventListener("input", (e) => {
    const blur = parseInt(e.target.value);
    const settings = loadCustomSettings();
    settings.bgBlur = blur;
    saveCustomSettings(settings);
    applyBackgroundEffects(settings);
});

brightnessControl.addEventListener("input", (e) => {
    const brightness = parseInt(e.target.value);
    const settings = loadCustomSettings();
    settings.bgBrightness = brightness;
    saveCustomSettings(settings);
    applyBackgroundEffects(settings);
});

vignetteControl.addEventListener("input", (e) => {
    const vignette = parseInt(e.target.value);
    const settings = loadCustomSettings();
    settings.bgVignette = vignette;
    saveCustomSettings(settings);
    applyBackgroundEffects(settings);
});

document.getElementById("reset-bg").addEventListener("click", () => {
    const settings = loadCustomSettings();

    delete settings.bgMode;
    delete settings.bgImage;
    delete settings.bgBlur;
    delete settings.bgBrightness;
    delete settings.bgVignette;
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
    if (settings.bgSource !== "dynamic") {
        delete settings.bgImage;
    }
    settings.bgSource = "dynamic";
    settings.bgMode = "dynamic-search";

    if (!settings.dynamicInterval) {
        settings.dynamicInterval = "onload";
    }
    saveCustomSettings(settings);

    await applyDynamicBackground({...settings, force: true});
});

document.getElementById("dynamic-tag").addEventListener("input", async (e) => {
    const tag = e.target.value.trim();
    const settings = loadCustomSettings();
    settings.dynamicTag = tag;
    saveCustomSettings(settings);

    if (tag) {
        await applyDynamicBackground(settings);
    }
});

document.getElementById("dynamic-interval").addEventListener("change", async (e) => {
    const settings = loadCustomSettings();
    settings.dynamicInterval = e.target.value;
    saveCustomSettings(settings);
    await applyDynamicBackground(settings);
});

document.getElementById("bg-fit").addEventListener("change", (e) => {
    const fit = e.target.value;
    const settings = loadCustomSettings();
    settings.bgFit = fit;
    saveCustomSettings(settings);
    applyBackgroundFit(fit);
});

document.addEventListener("DOMContentLoaded", async () => {
    const settings = loadCustomSettings();
    const links = getLinksFromStorage();
    renderLinks(links);
    renderEditor(links);

    let cols = settings.cols || 3;
    colsValue.textContent = cols;
    linksContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    toggleLinksCheckbox.checked = getLinksState();

    document.getElementById("cols-plus").addEventListener("click", () => {
        if (cols < 10) {
            cols++;
            colsValue.textContent = cols;
            linksContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            settings.cols = cols;
            saveCustomSettings(settings);
        }
    });

    document.getElementById("cols-minus").addEventListener("click", () => {
        if (cols > 1) {
            cols--;
            colsValue.textContent = cols;
            linksContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            settings.cols = cols;
            saveCustomSettings(settings);
        }
    });

    if (!settings.timeFont) {
        settings.timeFont = defaultTimeAndDateFont;
        saveCustomSettings(settings);
    }
    timeFontSelect.value = settings.timeFont;
    timeElement.style.fontFamily = settings.timeFont;

    if (!settings.timeColor) {
        settings.timeColor = defaultTimeColor;
        saveCustomSettings(settings);
    }
    timeColorInput.value = settings.timeColor;
    timeElement.style.color = settings.timeColor;

    if (!settings.dateFont) {
        settings.dateFont = defaultTimeAndDateFont;
        saveCustomSettings(settings);
    }
    dateFontSelect.value = settings.dateFont;
    dateElement.style.fontFamily = settings.dateFont;

    if (!settings.dateColor) {
        settings.dateColor = defaultDateColor;
        saveCustomSettings(settings);
    }
    dateColorInput.value = settings.dateColor;
    dateElement.style.color = settings.dateColor;

    timeFontSelect.addEventListener("change", (e) => {
        settings.timeFont = e.target.value;
        timeElement.style.fontFamily = settings.timeFont;
        saveCustomSettings(settings);
    });

    timeColorInput.addEventListener("input", (e) => {
        settings.timeColor = e.target.value;
        timeElement.style.color = settings.timeColor;
        saveCustomSettings(settings);
    });

    dateFontSelect.addEventListener("change", (e) => {
        settings.dateFont = e.target.value;
        dateElement.style.fontFamily = settings.dateFont;
        saveCustomSettings(settings);
    });

    dateColorInput.addEventListener("input", (e) => {
        settings.dateColor = e.target.value;
        dateElement.style.color = settings.dateColor;
        saveCustomSettings(settings);
    });

    if (!settings.bgMode) {
        settings.bgMode = "stars";
        enableStarfield();
        saveCustomSettings(settings);
    }

    if (settings.bgMode) {
        const modeInput = document.querySelector(`input[value="${settings.bgMode}"]`);
        if (modeInput) {
            modeInput.checked = true;
        }

        const effectsPanel = document.getElementById("bg-effects-group");
        const searchInput = document.getElementById("bg-search");
        const dynamicConfig = document.getElementById("dynamic-search-config");

        switch (settings.bgMode) {
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

        if (settings.bgBlur !== undefined) {
            blurControl.value = settings.bgBlur;
        }

        if (settings.bgBrightness !== undefined) {
            brightnessControl.value = settings.bgBrightness;
        }

        if (settings.bgVignette !== undefined) {
            vignetteControl.value = settings.bgVignette;
        }

        if (settings.bgFit) {
            document.getElementById("bg-fit").value = settings.bgFit;
            applyBackgroundFit(settings.bgFit);
        }

        if (settings.bgMode === "search-image") {
            searchInput.style.display = "block";
            const tag = searchInput.value.trim();
            if (tag) await fetchSearchResults(tag);
        }

        if (settings.bgMode === "dynamic-search") {
            dynamicConfig.style.display = "flex";
            if (settings.dynamicTag) {
                document.getElementById("dynamic-tag").value = settings.dynamicTag;
                await applyDynamicBackground(settings);
            }
            if (settings.dynamicInterval) {
                document.getElementById("dynamic-interval").value = settings.dynamicInterval;
            }
        }

        if (
            settings.bgImage &&
            ((settings.bgMode === "custom-image" && settings.bgSource === "custom") ||
                (settings.bgMode === "search-image" && settings.bgSource === "search") ||
                (settings.bgMode === "dynamic-search" && settings.bgSource === "dynamic"))
        ) {
            backgroundLayer.style.backgroundImage = `url(${settings.bgImage})`;
            applyBackgroundFit(settings.bgFit);
        }
    }

    if (settings.openInNewTabState === undefined) {
        settings.openInNewTabState = false;
        saveCustomSettings(settings);
    }
    toggleOpenInNewTab.checked = settings.openInNewTabState;
    toggleOpenInNewTab.addEventListener("change", () => {
        setOpenInNewTabState(toggleOpenInNewTab.checked);
    });

    document.querySelectorAll(".toggle-section").forEach(toggleBtn => {
        const section = toggleBtn.closest("section");
        const content = section.querySelector(".section-content");
        const key = "section_" + section.dataset.section;

        const isOpen = localStorage.getItem(key) === "true";
        if (isOpen) {
            content.classList.add("open");
            toggleBtn.textContent = "−";
        }

        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            content.classList.toggle("open");
            const nowOpen = content.classList.contains("open");
            toggleBtn.textContent = nowOpen ? "−" : "+";
            localStorage.setItem(key, nowOpen);
        });
    });

    document.getElementById("customization-title").addEventListener("click", () => {
        document.querySelectorAll("section").forEach(section => {
            const content = section.querySelector(".section-content");
            const toggleBtn = section.querySelector(".toggle-section");
            const key = "section_" + section.dataset.section;

            if (content.classList.contains("open")) {
                content.classList.remove("open");
                toggleBtn.textContent = "+";
                localStorage.setItem(key, false);
            }
        });
    });

    // Reset sticky note styles to default
    resetSettingsBtn.addEventListener("click", () => {
        const notes = document.querySelectorAll(".sticky-note");
        notes.forEach(note => {
            note.style.fontFamily = "Arial";
            note.style.background = `linear-gradient(135deg, ${adjustColor("#fff8b3", 0.2)} 60%, ${adjustColor("#fff8b3", -0.2)} 100%)`;
            note.style.border = "1px solid #fff8b3";
            note.style.setProperty("--hover-box-shadow", `0 2px 6px 0 ${adjustColor("#fff8b3", -0.2)}, 0 2px 12px 0 rgba(0,0,0,0.13)`);
            note.style.setProperty("--hover-background", `linear-gradient(135deg, ${adjustColor("#fff8b3", 0.2)} 70%, ${adjustColor("#fff8b3", -0.2)} 100%)`);
            note.setAttribute("data-bg-color", "#fff8b3");
            note.style.backgroundColor = "#fff8b3";
            note.style.color = "#333333";
            note.style.fontSize = "14px";
            saveNote(note.id);
        });
    });

    // Clear sticky note content
    clearContentBtn.addEventListener("click", () => {
        if (confirm("Clear all sticky note content?")) {
            const notes = document.querySelectorAll(".sticky-note");
            notes.forEach(note => {
                const textarea = note.querySelector("textarea");
                if (textarea) {
                    textarea.value = "";
                    saveNote(note.id);
                }
            });
        }
    });

    // Remove all sticky notes
    removeAllBtn.addEventListener("click", () => {
        if (confirm("Remove all sticky notes?")) {
            const notes = document.querySelectorAll(".sticky-note");
            notes.forEach(note => {
                localStorage.removeItem(note.id);
                note.remove();
            });
        }
    });

    // Toggle visibility of sticky notes
    toggleStickyNotes.addEventListener("change", () => {
        setStickyNotesVisibilityState(toggleStickyNotes.checked);
        const notes = document.querySelectorAll(".sticky-note, #add-sticky-note");
        notes.forEach(note => {
            note.style.display = toggleStickyNotes.checked ? "block" : "none";
        });
    });

    const stickyNotesVisibilityState = getStickyNotesVisibilityState();
    toggleStickyNotes.checked = stickyNotesVisibilityState;
    const notes = document.querySelectorAll(".sticky-note, #add-sticky-note");
    notes.forEach(note => {
        note.style.display = stickyNotesVisibilityState ? "block" : "none";
    });

    if (!settings.timeFormat) {
        settings.timeFormat = "24";
    }
    timeFormatSelect.value = settings.timeFormat;
    if (!settings.dateFormat) {
        settings.dateFormat = "day-month-year";
    }
    dateFormatSelect.value = settings.dateFormat;

    timeFormatSelect.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.timeFormat = timeFormatSelect.value;
        saveCustomSettings(settings);
        updateTime();
    });

    dateFormatSelect.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.dateFormat = dateFormatSelect.value;
        saveCustomSettings(settings);
        updateTime();
    });


    toggleWeatherWidget.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.showWeather = toggleWeatherWidget.checked;
        saveCustomSettings(settings);
        weatherWidget.style.display = toggleWeatherWidget.checked ? "block" : "none";
    });

    resetWeatherBtn.addEventListener("click", () => {
        const settings = loadCustomSettings();
        settings.weatherCity = "";
        settings.cachedWeather = "";
        settings.showWeather = true;
        saveCustomSettings(settings);

        weatherInput.value = "";
        weatherSummary.textContent = DEFAULT_WEATHER_SUMMARY_VALUE;
        weatherWidget.style.display = "block";
        toggleWeatherWidget.checked = true;
    });
});
