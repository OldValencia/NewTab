const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA']);

function isEditableElement(target) {
    return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

async function handleDigitKey(digit) {
    const settings = loadCustomSettings();
    const links = settings.links?.list || [];
    const link = links[digit - 1];

    if (link && link.url) {
        if (settings.links.openInNewTabState) {
            window.open(link.url, '_blank');
        } else {
            window.location.href = link.url;
        }
    }
}

const keyHandlers = {
    'ArrowLeft': async (settings) => {
        const isBookmarksActive = settings.bookmarks?.show ?? false;
        if (isBookmarksActive) {
            openBookmarksSidebar();
        }
    },
    'ArrowRight': () => {
        openMainSidebar();
    },
    'ArrowUp': async () => {
        const isStickyNotesActive = await getStickyNotesVisibilityState();
        if (isStickyNotesActive) {
            await createStickyNote();
        }
    }
};

document.addEventListener("keydown", async (e) => {
    const target = e.target;

    if (isEditableElement(target)) return;

    const settings = loadCustomSettings();

    if (keyHandlers[e.code]) {
        e.preventDefault();
        await keyHandlers[e.code](settings);
        return;
    }

    if (e.code.startsWith('Digit')) {
        e.preventDefault();
        const digit = parseInt(e.code.replace('Digit', ''));
        await handleDigitKey(digit);
    }
});

document.addEventListener('paste', async (e) => {
    const target = e.target;

    if (isEditableElement(target)) return;
    if (!await getStickyNotesVisibilityState()) return;

    const pastedText = e.clipboardData.getData('text');
    const noteId = createStickyNote({ text: pastedText });
    saveNote(noteId);
});
