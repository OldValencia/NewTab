const colsValue = document.getElementById("cols-value");
const linksEditor = document.getElementById("links-editor");
const addLinkBtn = document.getElementById("add-link");
const toggleLinksCheckbox = document.getElementById("toggle-links");
const toggleOpenInNewTab = document.getElementById("toggle-open-in-new-tab");
const toggleUnderlineLinksOnHover = document.getElementById("toggle-links-underline");
const linksColorInput = document.getElementById("links-color");

function createLinkEditElement(link, index) {
    const div = document.createElement("div");
    div.className = "link-edit";
    div.draggable = true;
    div.dataset.index = index;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "delete-link";

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.value = link.label;
    labelInput.placeholder = "Название";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = link.url;
    urlInput.placeholder = "URL";

    div.appendChild(deleteBtn);
    div.appendChild(labelInput);
    div.appendChild(urlInput);

    return { div, deleteBtn, labelInput, urlInput };
}

function renderEditor(links) {
    const fragment = document.createDocumentFragment();

    links.forEach((link, index) => {
        const { div, deleteBtn, labelInput, urlInput } = createLinkEditElement(link, index);

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

        div.addEventListener("drop", async (e) => {
            e.preventDefault();
            div.classList.remove("drag-over");
            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
            const toIndex = parseInt(div.dataset.index);

            if (fromIndex !== toIndex) {
                const moved = links.splice(fromIndex, 1)[0];
                links.splice(toIndex, 0, moved);
                await saveLinksToStorage(links);
                renderLinks(links);
                renderEditor(links);
            }
        });

        div.addEventListener("dragend", () => {
            div.classList.remove("dragging");
        });

        deleteBtn.addEventListener("click", async () => {
            links.splice(index, 1);
            await saveLinksToStorage(links);
            renderLinks(links);
            renderEditor(links);
        });

        labelInput.addEventListener("input", debounce(async () => {
            link.label = labelInput.value;
            await saveLinksToStorage(links);
            renderLinks(links);
        }, 300));

        urlInput.addEventListener("input", debounce(async () => {
            if (validateUrlInput(urlInput)) {
                link.url = urlInput.value;
                await saveLinksToStorage(links);
                renderLinks(links);
            }
        }, 300));

        fragment.appendChild(div);
    });

    linksEditor.innerHTML = "";
    linksEditor.appendChild(fragment);
}

function validateUrlInput(input) {
    const value = input.value.trim();
    const isValid = value.startsWith("https://") || value.startsWith("http://");
    input.style.border = (!isValid && value !== "") ? "2px solid red" : "";
    return isValid;
}

async function loadLinks() {
    const settings = loadCustomSettings();
    const links = await getLinksFromStorage();

    if (!settings.links) {
        settings.links = {
            underlineLinksOnHover: false,
            showLinks: true,
            openInNewTabState: false,
            list: links
        };
        await saveCustomSettings(settings);
    }

    renderLinks(links);
    renderEditor(links);

    linksContainer.style.display = settings.links.showLinks ? "grid" : "none";
    linksColorInput.value = settings.bg[settings.bg.bgMode].customization.linksColor;

    let cols = settings.cols || 3;
    colsValue.textContent = cols;
    linksContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    const updateCols = async (delta) => {
        const newCols = cols + delta;
        if (newCols >= 1 && newCols <= 10) {
            cols = newCols;
            colsValue.textContent = cols;
            linksContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            settings.cols = cols;
            await saveCustomSettings(settings);
        }
    };

    document.getElementById("cols-plus").addEventListener("click", () => updateCols(1));
    document.getElementById("cols-minus").addEventListener("click", () => updateCols(-1));

    toggleUnderlineLinksOnHover.checked = settings.links.underlineLinksOnHover;
    document.querySelectorAll(".link").forEach(link => {
        link.classList.toggle("underline", settings.links.underlineLinksOnHover);
    });

    toggleLinksCheckbox.checked = settings.links.showLinks;
    toggleOpenInNewTab.checked = settings.links.openInNewTabState;
}

toggleOpenInNewTab.addEventListener("change", async () => {
    const settings = loadCustomSettings();
    settings.links.openInNewTabState = toggleOpenInNewTab.checked;
    await saveCustomSettings(settings);
    const linksFromStorage = await getLinksFromStorage();
    renderLinks(linksFromStorage);
});

toggleLinksCheckbox.addEventListener("change", async () => {
    const settings = loadCustomSettings();
    const visible = toggleLinksCheckbox.checked;
    linksContainer.style.display = visible ? "grid" : "none";
    settings.links.showLinks = visible.toString();
    await saveCustomSettings(settings);
});

addLinkBtn.addEventListener("click", async () => {
    const links = await getLinksFromStorage();
    const settings = loadCustomSettings();
    if (links.length >= 30) {
        const message = await getLocalizationByKey("links_alert_message_maximum_links", settings.locale);
        return alert(message);
    }
    links.push({url: "", label: ""});
    await saveLinksToStorage(links);
    renderLinks(links);
    renderEditor(links);
});

linksColorInput.addEventListener("input", debounce(async () => {
    const settings = loadCustomSettings();
    settings.bg[settings.bg.bgMode].customization.linksColor = linksColorInput.value;
    await saveCustomSettings(settings);
    const links = await getLinksFromStorage();
    renderLinks(links);
}, 300));

linksColorInput.addEventListener("contextmenu", async (e) => {
    e.preventDefault();
    linksColorInput.value = "#dbdbdb";
    const settings = loadCustomSettings();
    settings.bg[settings.bg.bgMode].customization.linksColor = linksColorInput.value;
    await saveCustomSettings(settings);
    const links = await getLinksFromStorage();
    renderLinks(links);
});

toggleUnderlineLinksOnHover.addEventListener("click", async () => {
    const settings = loadCustomSettings();
    settings.links.underlineLinksOnHover = toggleUnderlineLinksOnHover.checked;
    await saveCustomSettings(settings);
    document.querySelectorAll(".link").forEach(link => {
        link.classList.toggle("underline", settings.links.underlineLinksOnHover);
    });
});
