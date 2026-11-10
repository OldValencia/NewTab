/**
 * "Links" section: the editable list of links and how the links grid looks.
 */
import { getActiveTheme, getSettings, onExternalChange, subscribe, updateSettings } from "../core/settings.js";
import { MAX_LINKS, getDefaultTheme } from "../core/defaults.js";
import { messageDialog } from "../core/dialog.js";
import { t } from "../core/i18n.js";
import { createElement, getDraggedIndex, isListReorderDrag, isValidHttpUrl, setDraggedIndex } from "../core/utils.js";
import { bindControl } from "./controls.js";

const editor = document.getElementById("links-editor");
const columnsValue = document.getElementById("cols-value");
const columnsMinus = document.getElementById("cols-minus");
const columnsPlus = document.getElementById("cols-plus");
const addLinkButton = document.getElementById("add-link");

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 10;

/** Edits are saved on every keystroke, so a later re-render never drops typed text. */
function updateLink(index, mutateLink) {
    return updateSettings(settings => mutateLink(settings.links.items[index]));
}

/** Structural changes (add / remove / reorder) re-render the list; typing never does. */
async function changeLinkList(mutateItems) {
    await updateSettings(settings => mutateItems(settings.links.items));
    renderEditor();
}

function moveLink(fromIndex, toIndex) {
    return changeLinkList(items => {
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
    });
}

function showUrlValidity(input) {
    const value = input.value.trim();
    input.classList.toggle("invalid", value !== "" && !isValidHttpUrl(value));
}

function createLinkRow(link, index) {
    const row = createElement("div", { className: "link-edit", attrs: { draggable: "true" } });

    const deleteButton = createElement("button", {
        className: "delete-link",
        text: "✕",
        attrs: { type: "button", title: t("links_section_delete_link_title") }
    });
    deleteButton.addEventListener("click", () => changeLinkList(items => items.splice(index, 1)));

    const labelInput = createElement("input", { attrs: { type: "text", placeholder: t("links_section_label_placeholder") } });
    labelInput.value = link.label;
    labelInput.addEventListener("input", () => updateLink(index, item => {
        item.label = labelInput.value;
    }));

    const urlInput = createElement("input", { attrs: { type: "url", placeholder: "https://…" } });
    urlInput.value = link.url;
    showUrlValidity(urlInput);
    urlInput.addEventListener("input", () => {
        showUrlValidity(urlInput);
        updateLink(index, item => {
            item.url = urlInput.value.trim();
            // A changed URL makes the old cached icon wrong.
            delete item.icon;
        });
    });

    row.addEventListener("dragstart", event => {
        // Dragging from inside a text field selects text instead of moving the row.
        if (event.target !== row) return;
        setDraggedIndex(event, index);
        row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    row.addEventListener("dragover", event => {
        if (!isListReorderDrag(event)) return;
        event.preventDefault();
        row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", event => {
        row.classList.remove("drag-over");
        const fromIndex = getDraggedIndex(event);
        if (fromIndex === null) return;
        event.preventDefault();
        if (fromIndex !== index) moveLink(fromIndex, index);
    });

    row.append(deleteButton, labelInput, urlInput);
    return row;
}

function renderEditor() {
    editor.replaceChildren(...getSettings().links.items.map(createLinkRow));
}

function renderColumns() {
    const columns = getSettings().links.columns;
    columnsValue.textContent = String(columns);
    columnsMinus.disabled = columns <= MIN_COLUMNS;
    columnsPlus.disabled = columns >= MAX_COLUMNS;
}

function changeColumns(delta) {
    return updateSettings(settings => {
        const columns = settings.links.columns + delta;
        if (columns >= MIN_COLUMNS && columns <= MAX_COLUMNS) settings.links.columns = columns;
    });
}

async function addLink() {
    if (getSettings().links.items.length >= MAX_LINKS) {
        await messageDialog(t("links_alert_message_maximum_links"));
        return;
    }
    await changeLinkList(items => items.push({ url: "", label: "" }));
    editor.lastElementChild?.querySelector("input")?.focus();
}

export function initLinksSection() {
    renderEditor();
    renderColumns();

    columnsMinus.addEventListener("click", () => changeColumns(-1));
    columnsPlus.addEventListener("click", () => changeColumns(1));
    addLinkButton.addEventListener("click", addLink);

    bindControl(document.getElementById("toggle-links"), {
        get: settings => settings.links.visible,
        set: (settings, value) => { settings.links.visible = value; }
    });
    bindControl(document.getElementById("toggle-open-in-new-tab"), {
        get: settings => settings.links.openInNewTab,
        set: (settings, value) => { settings.links.openInNewTab = value; }
    });
    bindControl(document.getElementById("toggle-links-underline"), {
        get: settings => settings.links.underlineOnHover,
        set: (settings, value) => { settings.links.underlineOnHover = value; }
    });
    bindControl(document.getElementById("toggle-google-icons"), {
        get: settings => settings.links.useGoogleIcons,
        set: (settings, value) => { settings.links.useGoogleIcons = value; }
    });
    bindControl(document.getElementById("links-color"), {
        get: settings => getActiveTheme(settings).linksColor,
        set: (settings, value) => { getActiveTheme(settings).linksColor = value; },
        defaultValue: () => getDefaultTheme(getSettings().background.mode).linksColor,
        debounceMs: 100
    });

    subscribe(settings => settings.links.columns, renderColumns);
    onExternalChange(() => {
        renderEditor();
        renderColumns();
    });
}
