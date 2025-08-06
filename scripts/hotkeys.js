document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey) {
        const settings = loadCustomSettings();
        switch (e.code) {
            case "ArrowLeft":
                e.preventDefault();
                const isBookmarksActive = settings.bookmarks?.show ?? false;
                if (isBookmarksActive) {
                    openBookmarksSidebar();
                }
                break;
            case "ArrowRight":
                e.preventDefault();
                openMainSidebar();
                break;
            case "ArrowUp":
                e.preventDefault();
                const isStickyNotesActive = getStickyNotesVisibilityState();

                if (isStickyNotesActive) {
                    createStickyNote();
                }
                break;
        }
    }
});

document.addEventListener('paste', (e) => {
    const pastedText = e.clipboardData.getData('text');
    const noteId = createStickyNote({ text: pastedText });
    saveNote(noteId);
});