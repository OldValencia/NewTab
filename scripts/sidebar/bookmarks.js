const toggleBookmarksWidget = document.getElementById("toggle-bookmarks-widget");
const toggleBookmarksWidgetAlwaysOpen = document.getElementById("toggle-bookmarks-widget-always-open");

function loadBookmarksWidget(settings) {
    const isVisible = settings.bookmarks?.show ?? false;
    saveCustomSettings(settings);
    toggleBookmarksWidget.checked = isVisible;
    updateBookmarksWidgetVisibility(isVisible);

    const isAlwaysOpen = settings.bookmarks?.alwaysOpen ?? false;
    saveCustomSettings(settings)
    toggleBookmarksWidgetAlwaysOpen.checked = isAlwaysOpen;
    if (isAlwaysOpen && isVisible) {
        openBookmarksSidebarBtn.classList.toggle("shifted", true);
        bookmarkSidebar.classList.toggle("hidden", false);
    }

    toggleBookmarksWidget.addEventListener("change", () => {
        const newState = toggleBookmarksWidget.checked;
        setBookmarkSetting("show", newState);
        updateBookmarksWidgetVisibility(newState);

        const isAlwaysOpen = getBookmarkSetting("alwaysOpen");
        if (newState && isAlwaysOpen) {
            openBookmarksSidebarBtn.classList.toggle("shifted", true);
            bookmarkSidebar.classList.toggle("hidden", false);
        }
    });

    toggleBookmarksWidgetAlwaysOpen.addEventListener("change", () => {
        const newState = toggleBookmarksWidgetAlwaysOpen.checked;
        setBookmarkSetting("alwaysOpen", newState);
        const isVisible = getBookmarkSetting("show");
        if (newState && isVisible) {
            openBookmarksSidebarBtn.classList.toggle("shifted", true);
            bookmarkSidebar.classList.toggle("hidden", false);
        }
    })
}

function updateBookmarksWidgetVisibility(isVisible) {
    openBookmarksSidebarBtn.style.display = isVisible ? "block" : "none";
    openBookmarksSidebarBtn.classList.toggle("shifted", false);
    bookmarkSidebar.classList.toggle("hidden", true);
}
