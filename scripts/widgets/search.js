const searchInput = document.getElementById("universal-search");
const searchSelect = document.getElementById("search-engine-select");
const searchButton = document.getElementById("search-button");
const searchHistoryList = document.getElementById("search-history");

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchButton.click();
    }
});

searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    const engine = searchSelect.value;

    if (!query) return;

    const settings = loadCustomSettings();
    settings.searchBar.engine = engine;

    const savedHistory = JSON.parse(settings.searchBar.history || "[]");
    if (!savedHistory.includes(query)) {
        savedHistory.unshift(query);
        if (savedHistory.length > 10) savedHistory.pop();
        settings.searchBar.history = JSON.stringify(savedHistory);
    }
    saveCustomSettings(settings);

    let url = "";
    switch (engine) {
        case "google":
            url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            break;
        case "duckduckgo":
            url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
            break;
        case "bing":
            url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
            break;
        case "brave":
            url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
            break;
        case "yandex":
            url = `https://yandex.com/search/?text=${encodeURIComponent(query)}`;
            break;
        case "ecosia":
            url = `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`;
            break;
        case "startpage":
            url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(query)}`;
            break;
        case "qwant":
            url = `https://www.qwant.com/?q=${encodeURIComponent(query)}`;
            break;
    }

    if (settings.searchBar.openInNewTab === "true" || settings.searchBar.openInNewTab === true) {
        window.open(url, "_blank");
    } else {
        window.location.href = url;
    }
});
