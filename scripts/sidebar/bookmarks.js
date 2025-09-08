const toggleBookmarksWidget = document.getElementById("toggle-bookmarks-widget");
const toggleBookmarksWidgetAlwaysOpen = document.getElementById("toggle-bookmarks-widget-always-open");

async function loadBookmarksWidget() {
    const settings = loadCustomSettings();
    const isVisible = settings.bookmarks?.show ?? false;
    await saveCustomSettings(settings);
    toggleBookmarksWidget.checked = isVisible;
    updateBookmarksWidgetVisibility(isVisible);

    const isAlwaysOpen = settings.bookmarks?.alwaysOpen ?? false;
    await saveCustomSettings(settings)
    toggleBookmarksWidgetAlwaysOpen.checked = isAlwaysOpen;
    if (isAlwaysOpen && isVisible) {
        openBookmarksSidebarBtn.classList.toggle("shifted", true);
        bookmarkSidebar.classList.toggle("hidden", false);
    }

    toggleBookmarksWidget.addEventListener("change", async () => {
        const newState = toggleBookmarksWidget.checked;
        await setBookmarkSetting("show", newState);
        updateBookmarksWidgetVisibility(newState);

        const isAlwaysOpen = getBookmarkSetting("alwaysOpen");
        if (newState && isAlwaysOpen) {
            openBookmarksSidebarBtn.classList.toggle("shifted", true);
            bookmarkSidebar.classList.toggle("hidden", false);
        }
    });

    toggleBookmarksWidgetAlwaysOpen.addEventListener("change", async () => {
        const newState = toggleBookmarksWidgetAlwaysOpen.checked;
        await setBookmarkSetting("alwaysOpen", newState);
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
