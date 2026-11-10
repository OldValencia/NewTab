export function debounce(fn, delayMs) {
    let timeoutId = null;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delayMs);
    };
}

export function throttle(fn, delayMs) {
    let lastCallAt = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCallAt >= delayMs) {
            lastCallAt = now;
            fn(...args);
        }
    };
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Small DOM builder: createElement("button", { className: "x", text: "Hi", attrs: { type: "button" } }).
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    const { className, text, attrs, dataset, style, children } = options;

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    if (attrs) {
        for (const [name, value] of Object.entries(attrs)) {
            if (value !== undefined && value !== null && value !== false) {
                element.setAttribute(name, value === true ? "" : String(value));
            }
        }
    }
    if (dataset) Object.assign(element.dataset, dataset);
    if (style) Object.assign(element.style, style);
    if (children) element.append(...children.filter(Boolean));

    return element;
}

export function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

/*
 * Drag & drop reordering inside one list. A private MIME type keeps unrelated drops
 * (files, text from other pages) from being treated as a reorder.
 */
const DRAG_INDEX_TYPE = "application/x-newtab-list-index";

export function setDraggedIndex(event, index) {
    event.dataTransfer.setData(DRAG_INDEX_TYPE, String(index));
    event.dataTransfer.effectAllowed = "move";
}

export function isListReorderDrag(event) {
    return event.dataTransfer.types.includes(DRAG_INDEX_TYPE);
}

/** @returns {number | null} the index set by setDraggedIndex(), or null for any other drop */
export function getDraggedIndex(event) {
    const value = event.dataTransfer.getData(DRAG_INDEX_TYPE);
    return value === "" ? null : Number(value);
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
