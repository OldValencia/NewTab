let noteCounter = 0;
let stickyNoteOffset = 0;

function getStickyNotesVisibilityState() {
    const settings = loadCustomSettings();
    if (settings.stickyNotesVisibilityState === null) {
        settings.stickyNotesVisibilityState = false;
        saveCustomSettings(settings);
        return false;
    }
    return settings.stickyNotesVisibilityState;
}

function setStickyNotesVisibilityState(value) {
    const settings = loadCustomSettings();
    settings.stickyNotesVisibilityState = value;
    saveCustomSettings(settings);
}

function createStickyNote(data = {}) {
    const noteId = `sticky-note-${noteCounter++}`;
    const note = document.createElement("div");
    const noteWidth = 200;
    const noteHeight = 200;
    const margin = 20;

    let left = data.left ? parseInt(data.left) : 100 + stickyNoteOffset;
    let top = data.top ? parseInt(data.top) : 100 + stickyNoteOffset;

    const maxLeft = window.innerWidth - noteWidth - margin;
    const maxTop = window.innerHeight - noteHeight - margin;

    if (left > maxLeft || top > maxTop) {
        stickyNoteOffset = 0;
        left = 100;
        top = 100;
    }

    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
    note.className = "sticky-note";
    note.id = noteId;
    note.style.backgroundColor = data.bgColor || "#fff8b3";
    note.style.fontFamily = data.font || "sans-serif";
    note.style.fontSize = data.fontSize || "14px";
    note.style.color = data.textColor || "#333";
    note.style.display = getStickyNotesVisibilityState() ? "block" : "none";

    note.innerHTML = `
        <div class="controls">
            <button class="customize-toggle">⚙️</button>
            <button class="sticky-note-clear-btn">🗑️</button>
            <button class="sticky-note-hide-btn">✖</button>
        </div>
       
        <div class="customize-menu hidden">
            <label>BG Color <input type="color" class="bg-color"></label>
            <label>Font 
                <select class="font-family">
                    <option value="sans-serif">Sans</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                </select>
            </label>
            <label>Size <input type="number" class="font-size" min="10" max="32"></label>
            <label>Text Color <input type="color" class="text-color"></label>
            <button class="reset-note">Reset</button>
        </div>
        
        <textarea>${data.text || ""}</textarea>
    `;

    document.getElementById("sticky-notes-container").appendChild(note);
    stickyNoteOffset += 10;

    makeDraggable(note);

    const textarea = note.querySelector("textarea");
    textarea.addEventListener("input", () => {
        saveNote(noteId);
    });

    note.addEventListener("mouseenter", () => note.classList.remove("inactive"));
    note.addEventListener("mouseleave", () => note.classList.add("inactive"));
    note.querySelector(".customize-toggle").addEventListener("click", () => {
        const menu = note.querySelector(".customize-menu");
        menu.classList.toggle("hidden");
    });
    note.querySelector(".sticky-note-clear-btn").addEventListener("click", () => clearNote(noteId));
    note.querySelector(".sticky-note-hide-btn").addEventListener("click", () => hideNote(noteId));

    loadNote(noteId);
    setupCustomization(note, noteId);
}

function setupCustomization(note, noteId) {
    const bgInput = note.querySelector(".bg-color");
    const fontSelect = note.querySelector(".font-family");
    const sizeInput = note.querySelector(".font-size");
    const textColorInput = note.querySelector(".text-color");
    const resetBtn = note.querySelector(".reset-note");

    // Установка начальных значений
    bgInput.value = rgbToHex(note.style.backgroundColor);
    fontSelect.value = note.style.fontFamily;
    sizeInput.value = parseInt(note.style.fontSize);
    textColorInput.value = rgbToHex(note.style.color);

    // Обработчики изменений
    bgInput.addEventListener("input", () => {
        note.style.backgroundColor = bgInput.value;
        saveNote(noteId);
    });

    fontSelect.addEventListener("change", () => {
        note.style.fontFamily = fontSelect.value;
        saveNote(noteId);
    });

    sizeInput.addEventListener("input", () => {
        note.style.fontSize = `${sizeInput.value}px`;
        saveNote(noteId);
    });

    textColorInput.addEventListener("input", () => {
        note.style.color = textColorInput.value;
        saveNote(noteId);
    });

    // Reset
    resetBtn.addEventListener("click", () => {
        note.style.backgroundColor = "#fff8b3";
        note.style.fontFamily = "sans-serif";
        note.style.fontSize = "14px";
        note.style.color = "#333";

        bgInput.value = "#fff8b3";
        fontSelect.value = "sans-serif";
        sizeInput.value = 14;
        textColorInput.value = "#333";

        note.querySelector("textarea").value = "";
        saveNote(noteId);
    });
}

function makeDraggable(el) {
    let offsetX, offsetY, isDragging = false;

    const header = el.querySelector(".controls");

    header.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
        isDragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        el.style.zIndex = 10001;
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            saveNote(el.id);
        }
    });
}

function saveNote(id) {
    const el = document.getElementById(id);
    const data = {
        text: el.querySelector("textarea").value,
        left: el.style.left,
        top: el.style.top,
        bgColor: el.style.backgroundColor,
        font: el.style.fontFamily,
        fontSize: el.style.fontSize,
        textColor: el.style.color
    };
    localStorage.setItem(id, JSON.stringify(data));
}

function loadNote(id) {
    const data = localStorage.getItem(id);
    if (data) {
        const parsed = JSON.parse(data);
        const el = document.getElementById(id);
        el.querySelector("textarea").value = parsed.text;
        el.style.left = parsed.left;
        el.style.top = parsed.top;
        el.style.backgroundColor = parsed.bgColor;
        el.style.fontFamily = parsed.font;
        el.style.fontSize = parsed.fontSize;
        el.style.color = parsed.textColor;
    }
}

function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (!result) return "#fff8b3";
    return "#" + result.map(x => (+x).toString(16).padStart(2, "0")).join("");
}

function clearNote(id) {
    if (confirm("Are you sure you want to clear this note?")) {
        const el = document.getElementById(id);
        el.querySelector("textarea").value = "";
        saveNote(id);
    }
}

function hideNote(id) {
    const el = document.getElementById(id);
    el.style.display = "none";
    localStorage.removeItem(id);
}

document.getElementById("add-sticky-note").addEventListener("click", () => {
    createStickyNote();
});


// Load existing notes on page load
window.addEventListener("DOMContentLoaded", () => {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("sticky-note-")) {
            const data = JSON.parse(localStorage.getItem(key));
            createStickyNote(data);
        }
    });
});
