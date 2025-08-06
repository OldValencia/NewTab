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

function getContrastYIQ(hexcolor) {
    hexcolor = hexcolor.replace('#', '');
    if (hexcolor.length === 3) {
        hexcolor = hexcolor[0] + hexcolor[0] + hexcolor[1] + hexcolor[1] + hexcolor[2] + hexcolor[2];
    }
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 180) ? '#222' : '#fff';
}

function createStickyNote(data = {}, key) {
    const existingIds = new Set(
        Array.from(document.querySelectorAll(".sticky-note")).map(note => note.id)
    );

    let noteId = key || `sticky-note-${noteCounter++}`;
    let shouldMoveData = false;
    if (key && existingIds.has(key)) {
        shouldMoveData = true;
    }

    while (existingIds.has(noteId)) {
        noteId = `sticky-note-${noteCounter++}`;
    }

    if (shouldMoveData) {
        const oldData = localStorage.getItem(key);
        if (oldData) {
            localStorage.removeItem(key);
            localStorage.setItem(noteId, data);
        }
    }

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
    note.style.background = `linear-gradient(135deg, ${adjustColor(data.bgColor || "#fff8b3", 0.2)} 60%, ${adjustColor(data.bgColor || "#fff8b3", -0.2)} 100%)`;
    note.style.border = `1px solid ${data.bgColor || "#fff8b3"}`
    note.style.setProperty("--hover-box-shadow", `0 2px 6px 0 ${adjustColor(data.bgColor || "#fff8b3", -0.2)}, 0 2px 12px 0 rgba(0,0,0,0.13)`);
    note.style.setProperty("--hover-background", `linear-gradient(135deg, ${adjustColor(data.bgColor || "#fff8b3", 0.2)} 70%, ${adjustColor(data.bgColor || "#fff8b3", -0.2)} 100%)`);
    note.style.setProperty("--background-main-color-darken", adjustColor(data.bgColor || "#fff8b3", -0.1));
    note.setAttribute("data-bg-color", data.bgColor || "#fff8b3");
    note.style.setProperty('--todo-bg', adjustColor(data.bgColor || "#fff8b3", 0.3));
    note.style.setProperty('--todo-bg-hover', adjustColor(data.bgColor || "#fff8b3", 0.5));
    note.style.setProperty('--todo-checkbox', adjustColor(data.bgColor || "#fff8b3", -0.05));
    note.style.setProperty('--todo-checkbox-checked', adjustColor(data.bgColor || "#fff8b3", -0.1));
    note.style.setProperty('--notes-text-color', getContrastYIQ(data.bgColor || "#fff8b3"));
    note.style.fontFamily = data.font || "sans-serif";
    note.style.fontSize = data.fontSize || "14px";
    note.style.color = data.textColor || "#333";
    note.style.display = getStickyNotesVisibilityState() ? "block" : "none";

    // Controls
    const controls = document.createElement("div");
    controls.className = "controls";

    // Content controls
    const createBtn = (className, textContent) => {
        const btn = document.createElement("button");
        btn.className = className;
        btn.textContent = textContent;
        return btn;
    }

    const templateBtn = createBtn("create-template-btn", "📄");
    const todoBtn = createBtn("create-todo-btn", "📝");
    const boldBtn = createBtn("create-bold-btn", "B");
    const italicBtn = createBtn("create-italic-btn", "I");
    const underlineBtn = createBtn("create-underline-btn", "U");
    const strikethroughBtn = createBtn("create-strikethrough-btn", "S");

    // Template selection popup
    const templatePopup = document.createElement("div");
    templatePopup.className = "template-popup hidden";
    templatePopup.style.position = "absolute";
    templatePopup.style.top = "40px";
    templatePopup.style.left = "0";
    templatePopup.style.background = "#fff";
    templatePopup.style.border = "1px solid #ccc";
    templatePopup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    templatePopup.style.zIndex = "10002";
    templatePopup.style.padding = "8px";
    templatePopup.style.minWidth = "180px";

    const templates = [
        {
            name: "To-Do List",
            value: '[bold]To-Do List[/bold]\n' + Array.from({length: 10}, (_, i) => `${i + 1}. [todo type="unchecked"] [/todo]`).join("\n")
        },
        {
            name: "Article Link",
            value: '[bold]Article Title[/bold]\n[italic]Link:[/italic] https://'
        },
        {
            name: "Meeting Notes",
            value: `[bold]Meeting Notes[/bold]\n[italic]Date:[/italic] \n[italic]Attendees:[/italic] \n- \n[italic]Summary:[/italic] `
        },
        {
            name: "Shopping List",
            value: '[bold]Shopping List[/bold]\n' + Array.from({length: 5}, (_, i) => `${i + 1}. [todo type="unchecked"][/todo]`).join("\n")
        },
        {
            name: "Quick Reminder",
            value: '[bold]Reminder[/bold]\n[italic]Don\'t forget to:[/italic] '
        },
        {
            name: "Project Plan",
            value: `[bold]Project Plan[/bold]\n[italic]Goal:[/italic] \n[italic]Steps:[/italic] \n- `
        }
    ];

    templates.forEach(t => {
        const btn = createBtn("template-option-btn", t.name);
        btn.style.display = "block";
        btn.style.width = "100%";
        btn.style.margin = "2px 0";
        btn.addEventListener("click", () => {
            textarea.value = t.value;
            syncRenderedDiv();
            saveNote(noteId);
            templatePopup.classList.add("hidden");
            textarea.classList.remove("hidden");
            renderedDiv.classList.add("hidden");
            note.classList.add("editing");
            textarea.focus();
        });
        templatePopup.appendChild(btn);
    });

    const closeBtn = createBtn("template-option-btn", "Close templates");
    closeBtn.style.display = "block";
    closeBtn.style.width = "100%";
    closeBtn.style.marginTop = "10px";
    closeBtn.addEventListener("click", () => {
        syncRenderedDiv();
        templatePopup.classList.add("hidden");
        textarea.classList.remove("hidden");
        renderedDiv.classList.add("hidden");
        note.classList.add("editing");
        textarea.focus();
    });
    templatePopup.appendChild(closeBtn);


    controls.appendChild(templateBtn);
    controls.appendChild(todoBtn);
    controls.appendChild(boldBtn);
    controls.appendChild(italicBtn);
    controls.appendChild(underlineBtn);
    controls.appendChild(strikethroughBtn);
    controls.appendChild(templatePopup);

    // Top right buttons
    const customizeBtn = document.createElement("button");
    customizeBtn.className = "customize-toggle";
    customizeBtn.textContent = "⚙️";
    const clearBtn = document.createElement("button");
    clearBtn.className = "sticky-note-clear-btn";
    clearBtn.textContent = "🗑️";
    const removeBtn = document.createElement("button");
    removeBtn.className = "sticky-note-remove-btn";
    removeBtn.textContent = "✖";
    controls.appendChild(customizeBtn);
    controls.appendChild(clearBtn);
    controls.appendChild(removeBtn);

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

    // Rendered div-duplicate of textarea
    const renderedDiv = document.createElement("div");
    renderedDiv.className = "sticky-note-rendered-duplicate hidden";
    renderedDiv.tabIndex = 0;

    renderedDiv.addEventListener("mouseup", () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        textarea.classList.remove("hidden");
        renderedDiv.classList.add("hidden");
        note.classList.add("editing");
        textarea.focus();
    });

    // Assemble note
    note.appendChild(controls);
    note.appendChild(customizeMenu);
    note.appendChild(textarea);
    note.appendChild(renderedDiv);

    document.getElementById("sticky-notes-container").appendChild(note);
    stickyNoteOffset += 10;

    makeDraggable(note);

    function syncRenderedDiv() {
        renderedDiv.innerHTML = parseTextTags(textarea.value);
        renderedDiv.style.fontFamily = note.style.fontFamily;
        renderedDiv.style.fontSize = note.style.fontSize;
        renderedDiv.style.color = note.style.color;
    }

    textarea.addEventListener("input", () => {
        syncRenderedDiv();
        saveNote(noteId);
    });
    note.addEventListener("input", syncRenderedDiv, true);
    note.addEventListener("change", syncRenderedDiv, true);

    renderedDiv.addEventListener("dblclick", (e) => {
        if (e.target === renderedDiv) {
            textarea.classList.remove("hidden");
            renderedDiv.classList.add("hidden");
            note.classList.toggle("editing");
            textarea.focus();
        }
    });
    customizeBtn.addEventListener("click", () => {
        customizeMenu.classList.toggle("hidden");
    });
    clearBtn.addEventListener("click", () => {
        clearNote(noteId)
        syncRenderedDiv();
    });
    removeBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeNote(noteId);
    });
    textarea.addEventListener("focusout", () => {
        textarea.classList.add("hidden");
        note.classList.toggle("editing");
        renderedDiv.classList.remove("hidden");
        syncRenderedDiv();
    });

    templateBtn.addEventListener("click", () => {
        templatePopup.classList.toggle("hidden");
    });

    todoBtn.addEventListener("click", () => {
        const tag = '[todo type="unchecked"][/todo]';
        const openTag = '[todo';
        const closeTag = '[/todo]';

        toggleTextStyle(tag, openTag, closeTag);
    });

    boldBtn.addEventListener("click", () => {
        const tag = '[bold][/bold]';
        const openTag = '[bold';
        const closeTag = '[/bold]';

        toggleTextStyle(tag, openTag, closeTag);
    });

    italicBtn.addEventListener("click", () => {
        const tag = '[italic][/italic]';
        const openTag = '[italic';
        const closeTag = '[/italic]';

        toggleTextStyle(tag, openTag, closeTag);
    });

    underlineBtn.addEventListener("click", () => {
        const tag = '[underline][/underline]';
        const openTag = '[underline';
        const closeTag = '[/underline]';

        toggleTextStyle(tag, openTag, closeTag);
    });

    strikethroughBtn.addEventListener("click", () => {
        const tag = '[strikethrough][/strikethrough]';
        const openTag = '[strikethrough';
        const closeTag = '[/strikethrough]';

        toggleTextStyle(tag, openTag, closeTag);
    });

    function toggleTextStyle(tag, openTag, closeTag) {
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        let value = textarea.value;
        const before = value.substring(0, start);
        const selected = value.substring(start, end);
        const after = value.substring(end);

        if (tag.startsWith('[todo')) {
            let insertText = (before.endsWith('\n') || before.length === 0) ? tag : '\n' + tag;
            textarea.value = before + insertText + after;
            const cursorPos = before.length + insertText.length - 7;
            textarea.setSelectionRange(cursorPos, cursorPos);
        } else {
            if (selected.length > 0) {
                textarea.value = before + openTag + ']' + selected + closeTag + after;
                textarea.setSelectionRange(before.length + openTag.length + 1, before.length + openTag.length + 1 + selected.length);
            } else {
                textarea.value = before + openTag + ']' + closeTag + after;
                textarea.setSelectionRange(before.length + openTag.length + 1, before.length + openTag.length + 1);
            }
        }
        syncRenderedDiv();
        saveNote(noteId);
        textarea.focus();
    }


    renderedDiv.addEventListener("click", (e) => {
        const todoEl = e.target.closest('.todo-element');
        if (todoEl) {
            const type = todoEl.getAttribute('data-type');
            const newType = type === 'checked' ? 'unchecked' : 'checked';
            const todos = Array.from(renderedDiv.querySelectorAll('.todo-element'));
            const idx = todos.indexOf(todoEl);
            if (idx !== -1) {
                let n = -1;
                textarea.value = textarea.value.replace(/\[todo type="(checked|unchecked)"\](.*?)\[\/todo\]/gs, (match, t, c) => {
                    n++;
                    if (n === idx) {
                        return `[todo type="${newType}"]${c}[/todo]`;
                    }
                    return match;
                });
                syncRenderedDiv();
                saveNote(noteId);
            }
        }
    });

    loadNote(noteId);
    setupCustomization(note, noteId);

    textarea.classList.add("hidden");
    renderedDiv.classList.remove("hidden");
    syncRenderedDiv();
    return noteId;
}

function parseTextTags(text) {
    text = text.replace(/\[todo type="(checked|unchecked)"\](.*?)\[\/todo\]/gs, (match, type, content) => {
        const checked = type === 'checked';
        return `<span class="todo-element" data-type="${type}"><span class="todo-checkbox${checked ? ' checked' : ''}"></span><span class="todo-text">${content || ''}</span></span>`;
    });

    text = text.replace(/\[bold\](.*?)\[\/bold\]/gs, '<strong>$1</strong>');
    text = text.replace(/\[italic\](.*?)\[\/italic\]/gs, '<em>$1</em>');
    text = text.replace(/\[underline\](.*?)\[\/underline\]/gs, '<u>$1</u>');
    text = text.replace(/\[strikethrough\](.*?)\[\/strikethrough\]/gs, '<s>$1</s>');
    return text;
}

function setupCustomization(note, noteId) {
    const bgInput = note.querySelector(".bg-color");
    const fontSelect = note.querySelector(".font-family");
    const sizeInput = note.querySelector(".font-size");
    const textColorInput = note.querySelector(".text-color");
    const resetBtn = note.querySelector(".reset-note");
    const noteBackgroundColor = note.getAttribute("data-bg-color");

    // Установка начальных значений
    bgInput.value = noteBackgroundColor ? noteBackgroundColor : "#fff8b3";
    fontSelect.value = note.style.fontFamily;
    sizeInput.value = parseInt(note.style.fontSize);
    textColorInput.value = note.style.color ? rgbToHex(note.style.color) : "#333";

    // Event Listeners
    bgInput.addEventListener("input", () => {
        note.style.background = `linear-gradient(135deg, ${adjustColor(bgInput.value || "#fff8b3", 0.2)} 60%, ${adjustColor(bgInput.value || "#fff8b3", -0.2)} 100%)`;
        note.style.border = `1px solid ${bgInput.value || "#fff8b3"}`
        note.style.setProperty("--hover-box-shadow", `0 2px 6px 0 ${adjustColor(bgInput.value || "#fff8b3", -0.2)}, 0 2px 12px 0 rgba(0,0,0,0.13)`);
        note.style.setProperty("--hover-background", `linear-gradient(135deg, ${adjustColor(bgInput.value || "#fff8b3", 0.2)} 70%, ${adjustColor(bgInput.value || "#fff8b3", -0.2)} 100%)`);
        note.style.setProperty("--background-main-color-darken", adjustColor(bgInput.value || "#fff8b3", -0.1));
        note.setAttribute("data-bg-color", bgInput.value || "#fff8b3");
        note.style.setProperty('--todo-bg', adjustColor(bgInput.value || "#fff8b3", 0.3));
        note.style.setProperty('--todo-bg-hover', adjustColor(bgInput.value || "#fff8b3", 0.5));
        note.style.setProperty('--todo-checkbox', adjustColor(bgInput.value || "#fff8b3", -0.05));
        note.style.setProperty('--todo-checkbox-checked', adjustColor(bgInput.value || "#fff8b3", -0.1));
        note.style.setProperty('--notes-text-color', getContrastYIQ(bgInput.value || "#fff8b3"));
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

    resetBtn.addEventListener("click", () => {
        note.style.backgroundColor = "#fff8b3";
        note.style.border = `1px solid #fff8b3`
        note.style.fontFamily = "sans-serif";
        note.style.fontSize = "14px";
        note.style.color = "#333";

        bgInput.value = "#fff8b3";
        fontSelect.value = "sans-serif";
        sizeInput.value = 14;
        textColorInput.value = "#333";

        note.style.background = `linear-gradient(135deg, ${adjustColor("#fff8b3", 0.2)} 60%, ${adjustColor("#fff8b3", -0.2)} 100%)`;
        note.style.border = `1px solid ${"#fff8b3"}`
        note.style.setProperty("--hover-box-shadow", `0 2px 6px 0 ${adjustColor("#fff8b3", -0.2)}, 0 2px 12px 0 rgba(0,0,0,0.13)`);
        note.style.setProperty("--hover-background", `linear-gradient(135deg, ${adjustColor("#fff8b3", 0.2)} 70%, ${adjustColor("#fff8b3", -0.2)} 100%)`);
        note.style.setProperty("--background-main-color-darken", adjustColor("#fff8b3", -0.1));
        note.setAttribute("data-bg-color", "#fff8b3");
        note.style.setProperty('--todo-bg', adjustColor("#fff8b3", 0.3));
        note.style.setProperty('--todo-bg-hover', adjustColor("#fff8b3", 0.5));
        note.style.setProperty('--todo-checkbox', adjustColor("#fff8b3", -0.05));
        note.style.setProperty('--todo-checkbox-checked', adjustColor("#fff8b3", -0.1));
        note.style.setProperty('--notes-text-color', "#333");

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
        width: el.style.width,
        height: el.style.height,
        bgColor: el.getAttribute("data-bg-color"),
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
        el.style.width = parsed.width || "250px";
        el.style.height = parsed.height || "200px";
        const bgColor = parsed.bgColor || "#fff8b3";
        el.style.background = `linear-gradient(135deg, ${adjustColor(bgColor, 0.2)} 60%, ${adjustColor(bgColor, -0.2)} 100%)`;
        el.style.border = `1px solid ${bgColor}`;
        el.style.setProperty("--hover-box-shadow", `0 4px 16px 0 ${adjustColor(bgColor, -0.2)}, 0 2px 12px 0 rgba(0,0,0,0.13)`);
        el.style.setProperty("--hover-background", `linear-gradient(135deg, ${adjustColor(bgColor, 0.2)} 70%, ${adjustColor(bgColor, -0.2)} 100%)`);
        el.style.setProperty("--background-main-color-darken", adjustColor(bgColor, -0.1));
        el.setAttribute("data-bg-color", bgColor);
        el.style.setProperty('--todo-bg', adjustColor(bgColor, 0.3));
        el.style.setProperty('--todo-bg-hover', adjustColor(bgColor, 0.5));
        el.style.setProperty('--todo-checkbox', adjustColor(bgColor, -0.05));
        el.style.setProperty('--todo-checkbox-checked', adjustColor(bgColor, -0.1));
        el.style.fontFamily = parsed.font;
        el.style.fontSize = parsed.fontSize;
        el.style.color = parsed.textColor;
        const todoTextColor = getContrastYIQ(bgColor);
        el.style.setProperty('--notes-text-color', todoTextColor);
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

function removeNote(id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
    }
    localStorage.removeItem(id);

    // clear all if all visible notes are removed
    const notes = document.querySelectorAll(".sticky-note");
    if (notes.length === 0) {
        const foundNotesInLocalStorage = Object.keys(localStorage).filter(key => key.startsWith("sticky-note-"));
        foundNotesInLocalStorage.forEach(foundNoteInLocalStorage => {
            localStorage.removeItem(foundNoteInLocalStorage);
        });
    }
}

document.getElementById("add-sticky-note").addEventListener("click", () => {
    createStickyNote();
});


// Load existing notes on page load
window.addEventListener("DOMContentLoaded", () => {
    const loaded = new Set();
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("sticky-note-") && !loaded.has(key)) {
            const data = JSON.parse(localStorage.getItem(key));
            createStickyNote(data, key);
            loaded.add(key);
        }
    });
    const maxId = Array.from(loaded).map(k => parseInt(k.replace("sticky-note-", ""), 10)).filter(Number.isFinite);
    if (maxId.length) {
        noteCounter = Math.max(...maxId) + 1;
    }
});
