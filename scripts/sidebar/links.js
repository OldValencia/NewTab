const colsValue = document.getElementById("cols-value");
const linksEditor = document.getElementById("links-editor");
const addLinkBtn = document.getElementById("add-link");
const toggleLinksCheckbox = document.getElementById("toggle-links");
const toggleOpenInNewTab = document.getElementById("toggle-open-in-new-tab");
const toggleUnderlineLinksOnHover = document.getElementById("toggle-links-underline");

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

function loadLinks(settings) {
    const links = getLinksFromStorage();
    if(!settings.links) {
        settings.links = {
            underlineLinksOnHover: false
        };
        saveCustomSettings(settings);
    }
    renderLinks(links);
    renderEditor(links);
    let cols = settings.cols || 3;
    colsValue.textContent = cols;
    linksContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    toggleUnderlineLinksOnHover.checked = settings.links.underlineLinksOnHover;
    document.querySelectorAll(".link").forEach(link => {
        link.classList.toggle("underline", settings.links.underlineLinksOnHover);
    });

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

    toggleLinksCheckbox.checked = getLinksState();

    if (settings.openInNewTabState === undefined) {
        settings.openInNewTabState = false;
        saveCustomSettings(settings);
    }
    toggleOpenInNewTab.checked = settings.openInNewTabState;
    toggleOpenInNewTab.addEventListener("change", () => {
        setOpenInNewTabState(toggleOpenInNewTab.checked);
    });
}

toggleLinksCheckbox.addEventListener("change", () => {
    const visible = toggleLinksCheckbox.checked;
    linksContainer.style.display = visible ? "grid" : "none";
    showLinks(visible);
});

addLinkBtn.addEventListener("click", () => {
    const links = getLinksFromStorage();
    if (links.length >= 30) return alert("Maximum 30 links!");
    links.push({url: "", label: ""});
    saveLinksToStorage(links);
    renderLinks(links);
    renderEditor(links);
});

toggleUnderlineLinksOnHover.addEventListener("click", () => {
    const settings = loadCustomSettings();
    settings.links.underlineLinksOnHover = toggleUnderlineLinksOnHover.checked;
    saveCustomSettings(settings);
    document.querySelectorAll(".link").forEach(link => {
        link.classList.toggle("underline", settings.links.underlineLinksOnHover);
    });
})
