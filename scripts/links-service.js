const linksContainer = document.getElementById("links-container")
const defaultLinks = [
    {url: "https://youtube.com", label: "YouTube"},
    {url: "https://instagram.com", label: "Instagram"},
    {url: "https://www.firefox.com/en-US/", label: "Mozilla Firefox"}
]

function getLinksFromStorage() {
    const json = localStorage.getItem("custom_links");
    if (!json) {
        saveLinksToStorage(defaultLinks);
        return defaultLinks;
    }

    try {
        return JSON.parse(json);
    } catch (e) {
        console.warn("Error while reading custom_links:", e);
        saveLinksToStorage(defaultLinks);
        return defaultLinks;
    }
}

function saveLinksToStorage(links) {
    localStorage.setItem("custom_links", JSON.stringify(links));
}

function renderLinks(links) {
    linksContainer.innerHTML = "";
    const linksState = getLinksState();
    linksContainer.style.display = linksState ? "grid" : "none";

    const fragment = document.createDocumentFragment();

    links.forEach(link => {
        const a = document.createElement("a");
        a.className = "link";
        a.href = link.url;
        a.target = "_blank";

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

function showLinks(value) {
    localStorage.setItem("showLinks", value);
}

function getLinksState() {
    const value = localStorage.getItem("showLinks");
    if (value === null) {
        showLinks(true);
        return true;
    }
    return value === "true";
}


function initLinks() {
    const linksData = getLinksFromStorage();
    renderLinks(linksData);

    const show = getLinksState();
    linksContainer.style.display = show ? "grid" : "none";

    const toggleLinksCheckbox = document.getElementById("toggle-links");
    if (toggleLinksCheckbox) {
        toggleLinksCheckbox.checked = show;
        toggleLinksCheckbox.addEventListener("change", () => {
            const show = toggleLinksCheckbox.checked;
            linksContainer.style.display = show ? "grid" : "none";
            showLinks(show);
        });
    }
}

document.addEventListener("DOMContentLoaded", initLinks);
