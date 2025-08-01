const toggleBookmarksWidget = document.getElementById("toggle-bookmarks-widget");

function loadBookmarksWidget(settings) {
    const isVisible = settings.bookmarks?.show ?? false;
    saveCustomSettings(settings);

    toggleBookmarksWidget.checked = isVisible;
    updateBookmarksWidgetVisibility(isVisible);

    toggleBookmarksWidget.addEventListener("change", () => {
        const newState = toggleBookmarksWidget.checked;
        setBookmarkSetting("show", newState);
        updateBookmarksWidgetVisibility(newState);
    });
}

function updateBookmarksWidgetVisibility(isVisible) {
    openBookmarksSidebarBtn.style.display = isVisible ? "block" : "none";
    openBookmarksSidebarBtn.classList.toggle("shifted", false);
    bookmarkSidebar.classList.toggle("hidden", true);
}
