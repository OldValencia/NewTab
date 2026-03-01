const linksContainer = document.getElementById("links-container");
const defaultLinks = [
    {url: "https://youtube.com", label: "YouTube"},
    {url: "https://instagram.com", label: "Instagram"},
    {url: "https://www.firefox.com/en-US/", label: "Mozilla Firefox"}
];

async function getLinksFromStorage() {
    const settings = loadCustomSettings();
    if (!settings.links || !Array.isArray(settings.links.list)) {
        await saveLinksToStorage(defaultLinks);
        return defaultLinks;
    }

    try {
        return settings.links.list;
    } catch (e) {
        console.warn("Error while reading custom_settings.links.list:", e);
        await saveLinksToStorage(defaultLinks);
        return defaultLinks;
    }
}

async function saveLinksToStorage(links) {
    const settings = loadCustomSettings();
    if (!settings.links) {
        settings.links = {};
    }
    settings.links.list = links;
    await saveCustomSettings(settings);
}

function createLinkElement(link, settings, allLinks) {
    const a = document.createElement("a");
    a.className = "link";
    a.href = link.url;
    const linksColor = settings.bg[settings.bg.bgMode].customization.linksColor;
    a.style.setProperty("--link-color", adjustColor(linksColor, -0.2));
    a.style.setProperty("--link-hover-color", adjustColor(linksColor, 0.3));

    if (settings.links.openInNewTabState) {
        a.target = "_blank";
    }

    const img = document.createElement("img");
    img.className = "favicon";
    img.alt = "icon";

    const faviconFetchUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${link.url}&size=64`;

    if (link.cachedUrl === link.url && link.cachedFavicon) {
        img.src = link.cachedFavicon;
    } else {
        img.src = faviconFetchUrl;

        fetch(faviconFetchUrl)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64data = reader.result;

                    link.cachedUrl = link.url;
                    link.cachedFavicon = base64data;

                    await saveLinksToStorage(allLinks);
                };
                reader.readAsDataURL(blob);
            })
            .catch(err => {
                console.warn("Не удалось закэшировать иконку (возможно, CORS):", err);
            });
    }

    const span = document.createElement("span");
    span.textContent = link.label;

    a.appendChild(img);
    a.appendChild(span);

    return a;
}

function renderLinks(links) {
    const settings = loadCustomSettings();
    linksContainer.style.display = settings.links.showLinks ? "grid" : "none";

    const fragment = document.createDocumentFragment();
    links.forEach(link => {
        fragment.appendChild(createLinkElement(link, settings, links));
    });

    linksContainer.innerHTML = "";
    linksContainer.appendChild(fragment);
}

function setLinksColor(color) {
    const linkElements = linksContainer.querySelectorAll(".link");
    const adjustedColor = adjustColor(color, -0.2);
    const hoverColor = adjustColor(color, 0.3);

    linkElements.forEach(link => {
        link.style.setProperty("--link-color", adjustedColor);
        link.style.setProperty("--link-hover-color", hoverColor);
    });
}
