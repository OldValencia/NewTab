const linksContainer = document.getElementById("links-container")
const defaultLinks = [
    {url: "https://youtube.com", label: "YouTube"},
    {url: "https://instagram.com", label: "Instagram"},
    {url: "https://www.firefox.com/en-US/", label: "Mozilla Firefox"}
]

function getLinksFromStorage() {
    const settings = loadCustomSettings();
    if (!settings.links || !Array.isArray(settings.links.list)) {
        saveLinksToStorage(defaultLinks);
        return defaultLinks;
    }

    try {
        return settings.links.list;
    } catch (e) {
        console.warn("Error while reading custom_settings.links.list:", e);
        saveLinksToStorage(defaultLinks);
        return defaultLinks;
    }
}

function saveLinksToStorage(links) {
    const settings = loadCustomSettings();
    settings.links.list = links;
    saveCustomSettings(settings);
}

function renderLinks(links) {
    const settings = loadCustomSettings();
    linksContainer.innerHTML = "";
    linksContainer.style.display = settings.links.showLinks ? "grid" : "none";

    const fragment = document.createDocumentFragment();

    links.forEach(link => {
        const a = document.createElement("a");
        a.className = "link";
        a.href = link.url;
        a.style.color = adjustColor(settings.links.linkColor, -0.2);
        a.style.setProperty("--link-hover-color", adjustColor(settings.links.linkColor, 0.3));
        if (settings.links.openInNewTabState) {
            a.target = "_blank";
        }

        const img = document.createElement("img");
        img.className = "favicon";
        img.dataset.url = link.url;
        img.alt = "icon";
        img.src = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${link.url}&size=64`;

        const span = document.createElement("span");
        span.textContent = link.label;

        a.appendChild(img);
        a.appendChild(span);
        fragment.appendChild(a);
    });

    linksContainer.appendChild(fragment);
}
