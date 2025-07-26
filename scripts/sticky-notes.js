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

    const note = document.createElement("div");
    note.className = "sticky-note";
    note.id = noteId;
    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
    note.style.backgroundColor = data.bgColor || "#fff8b3";
    note.style.fontFamily = data.font || "sans-serif";
    note.style.fontSize = data.fontSize || "14px";
    note.style.color = data.textColor || "#333";
    note.style.display = getStickyNotesVisibilityState() ? "block" : "none";

    // Controls
    const controls = document.createElement("div");
    controls.className = "controls";

    const customizeBtn = document.createElement("button");
    customizeBtn.className = "customize-toggle";
    customizeBtn.textContent = "⚙️";

    const clearBtn = document.createElement("button");
    clearBtn.className = "sticky-note-clear-btn";
    clearBtn.textContent = "🗑️";

    const hideBtn = document.createElement("button");
    hideBtn.className = "sticky-note-hide-btn";
    hideBtn.textContent = "✖";

    controls.appendChild(customizeBtn);
    controls.appendChild(clearBtn);
    controls.appendChild(hideBtn);

    // Customize Menu
    const customizeMenu = document.createElement("div");
    customizeMenu.className = "customize-menu hidden";

    const bgLabel = document.createElement("label");
    bgLabel.textContent = "BG Color ";
    const bgInput = document.createElement("input");
    bgInput.type = "color";
    bgInput.className = "bg-color";
    bgLabel.appendChild(bgInput);

    const fontLabel = document.createElement("label");
    fontLabel.textContent = "Font ";
    const fontSelect = document.createElement("select");
    fontSelect.className = "font-family";
    const fonts = [
        "sans-serif",
        "serif",
        "monospace",
        "Arial",
        "Courier New",
        "Segoe UI",
        "Georgia",
        "Roboto",
        "Helvetica",
        "Verdana",
        "Tahoma",
        "Trebuchet MS",
        "Lucida Sans",
        "Times New Roman",
        "Fira Sans",
        "Open Sans",
        "Lato",
        "Quicksand",
        "Monaco"
    ];
    fonts.forEach(font => {
        const option = document.createElement("option");
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
    });
    fontLabel.appendChild(fontSelect);

    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Size ";
    const sizeInput = document.createElement("input");
    sizeInput.type = "number";
    sizeInput.className = "font-size";
    sizeInput.min = "10";
    sizeInput.max = "32";
    sizeLabel.appendChild(sizeInput);

    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Text Color ";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "text-color";
    colorLabel.appendChild(colorInput);

    const resetBtn = document.createElement("button");
    resetBtn.className = "reset-note";
    resetBtn.textContent = "Reset";

    customizeMenu.appendChild(bgLabel);
    customizeMenu.appendChild(fontLabel);
    customizeMenu.appendChild(sizeLabel);
    customizeMenu.appendChild(colorLabel);
    customizeMenu.appendChild(resetBtn);

    // Textarea
    const textarea = document.createElement("textarea");
    textarea.value = data.text || "";

    // Assemble note
    note.appendChild(controls);
    note.appendChild(customizeMenu);
    note.appendChild(textarea);

    document.getElementById("sticky-notes-container").appendChild(note);
    stickyNoteOffset += 10;

    makeDraggable(note);

    textarea.addEventListener("input", () => {
        saveNote(noteId);
    });

    note.addEventListener("mouseenter", () => note.classList.remove("inactive"));
    note.addEventListener("mouseleave", () => note.classList.add("inactive"));
    customizeBtn.addEventListener("click", () => {
        customizeMenu.classList.toggle("hidden");
    });
    clearBtn.addEventListener("click", () => clearNote(noteId));
    hideBtn.addEventListener("click", () => hideNote(noteId));

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
