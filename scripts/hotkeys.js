document.addEventListener("keydown", async (e) => {
    const settings = loadCustomSettings();
    const target = e.target;
    const isEditableElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

    if (e.ctrlKey && e.shiftKey) {
        switch (e.code) {
            case "ArrowLeft":
                if (isEditableElement) return;
                e.preventDefault();
                const isBookmarksActive = settings.bookmarks?.show ?? false;
                if (isBookmarksActive) {
                    openBookmarksSidebar();
                }
                break;
            case "ArrowRight":
                if (isEditableElement) return;
                e.preventDefault();
                openMainSidebar();
                break;
            case "ArrowUp":
                e.preventDefault();
                const isStickyNotesActive = await getStickyNotesVisibilityState();

                if (isStickyNotesActive) {
                    await createStickyNote();
                }
                break;
        }
    }

    switch(e.code) {
        case "Digit1":
        case "Digit2":
        case "Digit3":
        case "Digit4":
        case "Digit5":
        case "Digit6":
        case "Digit7":
        case "Digit8":
        case "Digit9": {
            if (isEditableElement) return;
            e.preventDefault();
            const digit = parseInt(e.code.replace('Digit', ''));
            const links = settings.links?.list || [];
            const link = links[digit - 1];
            if (link && link.url) {
                if (settings.links.openInNewTabState) {
                    window.open(link.url, '_blank');
                } else {
                    window.location.href = link.url;
                }
            }
            break;
        }
    }
});

document.addEventListener('paste', async (e) => {
    const target = e.target;

    const isEditableElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

    if (isEditableElement) return;
    if (!await getStickyNotesVisibilityState()) return;

    const pastedText = e.clipboardData.getData('text');
    const noteId = createStickyNote({ text: pastedText });
    saveNote(noteId);
});