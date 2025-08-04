const resetSettingsBtn = document.getElementById("reset-sticky-notes");
const clearContentBtn = document.getElementById("clear-sticky-notes");
const removeAllBtn = document.getElementById("remove-sticky-notes");
const toggleStickyNotes = document.getElementById("toggle-sticky-notes");

function loadStickyNotes() {
    // Reset sticky note styles to default
    resetSettingsBtn.addEventListener("click", () => {
        const notes = document.querySelectorAll(".sticky-note");
        notes.forEach(note => {
            note.style.fontFamily = "Arial";
            note.style.background = `linear-gradient(135deg, ${adjustColor("#fff8b3", 0.2)} 60%, ${adjustColor("#fff8b3", -0.2)} 100%)`;
            note.style.border = "1px solid #fff8b3";
            note.style.setProperty("--hover-box-shadow", `0 2px 6px 0 ${adjustColor("#fff8b3", -0.2)}, 0 2px 12px 0 rgba(0,0,0,0.13)`);
            note.style.setProperty("--hover-background", `linear-gradient(135deg, ${adjustColor("#fff8b3", 0.2)} 70%, ${adjustColor("#fff8b3", -0.2)} 100%)`);
            note.setAttribute("data-bg-color", "#fff8b3");
            note.style.backgroundColor = "#fff8b3";
            note.style.color = "#333333";
            note.style.fontSize = "14px";
            saveNote(note.id);
        });
    });

    // Clear sticky note content
    clearContentBtn.addEventListener("click", () => {
        if (confirm("Clear all sticky note content?")) {
            const notes = document.querySelectorAll(".sticky-note");
            notes.forEach(note => {
                const textarea = note.querySelector("textarea");
                if (textarea) {
                    textarea.value = "";
                    saveNote(note.id);
                    const renderedDiv = note.querySelector(".sticky-note-rendered-duplicate");
                    renderedDiv.textContent = "";
                    renderedDiv.innerHTML = parseTextTags(textarea.value);
                    renderedDiv.style.fontFamily = note.style.fontFamily;
                    renderedDiv.style.fontSize = note.style.fontSize;
                    renderedDiv.style.color = note.style.color;
                }
            });
        }
    });

    // Remove all sticky notes
    removeAllBtn.addEventListener("click", () => {
        if (confirm("Remove all sticky notes?")) {
            const notes = document.querySelectorAll(".sticky-note");
            notes.forEach(note => {
                localStorage.removeItem(note.id);
                note.remove();
            });
            const foundNotesInLocalStorage = Object.keys(localStorage).filter(key => key.startsWith("sticky-note-"));
            foundNotesInLocalStorage.forEach(foundNoteInLocalStorage => {
                localStorage.removeItem(foundNoteInLocalStorage);
            });

            noteCounter = 0;
            stickyNoteOffset = 0;
        }
    });

    // Toggle visibility of sticky notes
    toggleStickyNotes.addEventListener("change", () => {
        setStickyNotesVisibilityState(toggleStickyNotes.checked);
        const notes = document.querySelectorAll(".sticky-note, #add-sticky-note");
        notes.forEach(note => {
            note.style.display = toggleStickyNotes.checked ? "block" : "none";
        });
    });

    const stickyNotesVisibilityState = getStickyNotesVisibilityState();
    toggleStickyNotes.checked = stickyNotesVisibilityState;
    const notes = document.querySelectorAll(".sticky-note, #add-sticky-note");
    notes.forEach(note => {
        note.style.display = stickyNotesVisibilityState ? "block" : "none";
    });
}