const linksContainer = "links-container"

function getLinksFromStorage() {
    const json = localStorage.getItem("custom_links");
    if (json) return JSON.parse(json);
    return [  // Значения по умолчанию
        { url: "https://youtube.com", label: "YouTube" },
        { url: "https://instagram.com", label: "Instagram" },
        { url: "https://translate.yandex.com/", label: "Translate" },
        { url: "https://twitch.com", label: "Twitch" },
        { url: "https://www.otomoto.pl/osobowe/od-2014?search[filter_enum_damaged]=0&search[filter_float_engine_power:from]=110&search[filter_float_mileage:to]=150000&search[filter_float_price:to]=65000&search[order]=created_at%3Adesc&search[private_business]=private&search[advanced_search_expanded]=true", label: "Otomoto" },
        { url: "https://www.google.com/maps", label: "Maps" },
    ];
}

function saveLinksToStorage(links) {
    localStorage.setItem("custom_links", JSON.stringify(links));
}

function renderLinks(links) {
    const container = document.getElementById(linksContainer);
    container.innerHTML = ""; // Очистить старое

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
        container.appendChild(a);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const linksData = getLinksFromStorage();
    renderLinks(linksData);
});