const toggleSearchBarWidget = document.getElementById("toggle-search-bar");
const resetSearchBarBtn = document.getElementById("reset-search-bar-widget");
const searchBarWidget = document.getElementById("search-bar");
const toggleSearchBarOpenInNewTab = document.getElementById("toggle-search-open-in-new-tab");

function loadSearchBarWidget() {
    const settings = loadCustomSettings();
    if (!settings.searchBar) {
        settings.searchBar = {
            openInNewTab: false,
            showSearchBar: false,
            engine: "google",
            history: "[]"
        };
        saveCustomSettings(settings);
    }

    const savedHistory = JSON.parse(settings.searchBar.history);
    savedHistory.forEach(term => {
        const option = document.createElement("option");
        option.value = term;
        searchHistoryList.appendChild(option);
    });
    toggleSearchBarWidget.checked = settings.searchBar.showSearchBar;
    searchBarWidget.style.display = toggleSearchBarWidget.checked ? "flex" : "none";
    toggleSearchBarOpenInNewTab.checked = settings.searchBar.openInNewTab;
    searchSelect.value = settings.searchBar.engine;


    toggleSearchBarWidget.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.searchBar.showSearchBar = toggleSearchBarWidget.checked;
        saveCustomSettings(settings);
        searchBarWidget.style.display = toggleSearchBarWidget.checked ? "flex" : "none";
    });

    toggleSearchBarOpenInNewTab.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.searchBar.openInNewTab = toggleSearchBarOpenInNewTab.checked;
        console.log(settings.searchBar.openInNewTab);
        saveCustomSettings(settings);
    });

    resetSearchBarBtn.addEventListener("click", () => {
        const settings = loadCustomSettings();
        settings.searchBar.openInNewTab = false;
        settings.searchBar.engine = "google";
        settings.searchBar.history = "[]";
        saveCustomSettings(settings);

        searchSelect.value = settings.searchBar.engine;
        toggleSearchBarOpenInNewTab.checked = settings.searchBar.openInNewTab;
        searchInput.value = "";
        searchHistoryList.childNodes.forEach(node => {
            searchHistoryList.removeChild(node);
        })
    });
}