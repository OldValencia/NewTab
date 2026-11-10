/**
 * Bookmarks sidebar (left side): pinned bookmarks, the full tree and search.
 * Which folders are open is remembered per device in localStorage (like the settings sections).
 */
import { getSettings, subscribe, updateSettings } from "../core/settings.js";
import { confirmDialog } from "../core/dialog.js";
import { t } from "../core/i18n.js";
import { createIcon } from "../core/icons.js";
import { createElement, debounce, getDraggedIndex, isListReorderDrag, setDraggedIndex } from "../core/utils.js";
import { bindControl } from "../sidebar/controls.js";
import { createFavicon } from "./favicon.js";

const toggleButton = document.getElementById("bookmark-toggle");
const sidebar = document.getElementById("bookmark-sidebar");
const searchInput = document.getElementById("bookmark-search");
const collapseAllButton = document.getElementById("bookmarks-collapse-all");
const showEmptyFoldersCheckbox = document.getElementById("toggle-empty-folders");
const openInNewTabCheckbox = document.getElementById("open-bookmark-in-new-tab");
const treeContainer = document.getElementById("bookmark-tree");
const pinnedGroup = document.getElementById("pinned-group");
const pinnedContainer = document.getElementById("pinned-section");

const OPEN_FOLDERS_KEY = "bookmarks_open_folders";
const MAX_SEARCH_RESULTS = 200;

let rootNodes = [];
let bookmarksById = new Map();
// Bookmark id → names of the folders it is in, shown under search results.
let folderPathById = new Map();
// Folder id → number of bookmarks inside it (all levels), counted once per tree load.
let bookmarkCountById = new Map();
const openFolderIds = loadOpenFolders();

function loadOpenFolders() {
    try {
        const ids = JSON.parse(localStorage.getItem(OPEN_FOLDERS_KEY));
        return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === "string") : []);
    } catch {
        return new Set(); // private window or blocked storage: start with everything closed
    }
}

function saveOpenFolders() {
    try {
        localStorage.setItem(OPEN_FOLDERS_KEY, JSON.stringify([...openFolderIds]));
    } catch {
        // Not being able to remember open folders is not worth bothering the user.
    }
}

function folderName(folder) {
    return folder.title?.trim() || t("bookmark_folder_no_name");
}

/** Indexes bookmarks and folder sizes; returns how many bookmarks `nodes` hold. */
function indexBookmarks(nodes, path = []) {
    let count = 0;
    for (const node of nodes) {
        if (node.url) {
            bookmarksById.set(node.id, node);
            folderPathById.set(node.id, path);
            count++;
        }
        if (node.children) {
            const inside = indexBookmarks(node.children, [...path, folderName(node)]);
            bookmarkCountById.set(node.id, inside);
            count += inside;
        }
    }
    return count;
}

async function loadBookmarkTree() {
    const [root] = await browser.bookmarks.getTree();
    rootNodes = root.children ?? [];
    bookmarksById = new Map();
    folderPathById = new Map();
    bookmarkCountById = new Map();
    indexBookmarks(rootNodes);
}

function countBookmarks(folder) {
    return bookmarkCountById.get(folder.id) ?? 0;
}

function createActionButton(iconName, titleKey, onClick, { filled = false } = {}) {
    const button = createElement("button", {
        className: "icon-button bookmark-button",
        attrs: { type: "button", title: t(titleKey) },
        children: [createIcon(iconName, { filled })]
    });
    button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
    });
    return button;
}

/** `text` with every case-insensitive occurrence of `query` wrapped in <mark>. */
function highlighted(text, query) {
    if (!query) return [document.createTextNode(text)];
    const parts = [];
    const lower = text.toLowerCase();
    let position = 0;
    for (let index = lower.indexOf(query); index !== -1; index = lower.indexOf(query, position)) {
        if (index > position) parts.push(document.createTextNode(text.slice(position, index)));
        parts.push(createElement("mark", { text: text.slice(index, index + query.length) }));
        position = index + query.length;
    }
    if (position < text.length) parts.push(document.createTextNode(text.slice(position)));
    return parts;
}

/** @param {{ query?: string, subtitle?: string }} [options] search results get a highlighted title and a second line */
function createBookmarkLink(bookmark, { query = "", subtitle = "" } = {}) {
    const settings = getSettings();
    const title = bookmark.title || bookmark.url;
    const text = createElement("span", {
        className: "bookmark-text",
        children: [
            createElement("span", { className: "bookmark-title", children: highlighted(title, query) }),
            subtitle && createElement("span", { className: "bookmark-subtitle", children: highlighted(subtitle, query) })
        ]
    });
    return createElement("a", {
        className: "bookmark-link",
        attrs: {
            href: bookmark.url,
            title: bookmark.url,
            target: settings.bookmarks.openInNewTab ? "_blank" : undefined
        },
        children: [
            createFavicon({ url: bookmark.url, label: title, useGoogleIcons: settings.links.useGoogleIcons, lazy: true }),
            text
        ]
    });
}

async function togglePin(bookmarkId) {
    await updateSettings(settings => {
        const pinned = settings.bookmarks.pinned;
        const index = pinned.indexOf(bookmarkId);
        if (index === -1) pinned.push(bookmarkId);
        else pinned.splice(index, 1);
    });
}

async function deleteBookmark(bookmark) {
    if (!await confirmDialog(t("delete_bookmark_confirmation_window_text"))) return;
    await browser.bookmarks.remove(bookmark.id);
}

function startRename(item, bookmark) {
    const input = createElement("input", { className: "rename-input", attrs: { type: "text" } });
    input.value = bookmark.title || bookmark.url;

    const save = async () => {
        const newTitle = input.value.trim();
        if (!newTitle || newTitle === bookmark.title) {
            renderAll();
            return;
        }
        const message = t("rename_bookmark_confirmation", { oldName: bookmark.title, newName: newTitle });
        if (await confirmDialog(message)) {
            await browser.bookmarks.update(bookmark.id, { title: newTitle });
        } else {
            renderAll();
        }
    };

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") save();
        if (event.key === "Escape") renderAll();
    });

    item.classList.add("renaming");
    item.replaceChildren(input, createActionButton("check", "bookmark_button_save_title", save));
    input.focus();
    input.select();
}

function createBookmarkItem(bookmark, linkOptions) {
    const item = createElement("div", { className: "bookmark-item" });
    const isPinned = getSettings().bookmarks.pinned.includes(bookmark.id);
    item.append(
        createBookmarkLink(bookmark, linkOptions),
        createElement("span", {
            className: "bookmark-actions",
            children: [
                createActionButton("star", isPinned ? "bookmark_button_unpin_title" : "bookmark_button_pin_title",
                    () => togglePin(bookmark.id), { filled: isPinned }),
                createActionButton("pencil", "bookmark_button_rename_title", () => startRename(item, bookmark)),
                createActionButton("trash", "bookmark_button_delete_title", () => deleteBookmark(bookmark))
            ]
        })
    );
    return item;
}

/**
 * Folder contents are built the first time the folder is opened: with thousands of bookmarks
 * in closed folders the panel then creates only what is visible.
 */
function createFolder(folder) {
    const details = createElement("details", { className: "bookmark-folder" });
    const content = createElement("div", { className: "bookmark-folder-children" });
    const fillContent = () => {
        if (content.childElementCount === 0) content.append(...createTreeNodes(folder.children));
    };

    details.open = openFolderIds.has(folder.id);
    if (details.open) fillContent();
    details.addEventListener("toggle", () => {
        if (details.open) {
            fillContent();
            openFolderIds.add(folder.id);
        } else {
            openFolderIds.delete(folder.id);
        }
        saveOpenFolders();
    });

    const count = countBookmarks(folder);
    const summary = createElement("summary", {
        children: [
            createIcon("chevron", { className: "folder-chevron" }),
            createIcon("folder", { className: "folder-icon" }),
            createElement("span", { className: "folder-name", text: folderName(folder) }),
            count > 0 && createElement("span", { className: "folder-count", text: String(count) })
        ]
    });
    details.append(summary, content);
    return details;
}

function createTreeNodes(nodes) {
    const showEmptyFolders = getSettings().bookmarks.showEmptyFolders;
    return nodes.flatMap(node => {
        if (node.children) {
            return showEmptyFolders || countBookmarks(node) > 0 ? [createFolder(node)] : [];
        }
        return node.url ? [createBookmarkItem(node)] : [];
    });
}

function createSearchResult(bookmark, query) {
    const title = (bookmark.title || bookmark.url).toLowerCase();
    // Say where the bookmark lives; when only its address matched, show the address instead.
    const subtitle = title.includes(query) ? folderPathById.get(bookmark.id).join(" › ") : bookmark.url;
    return createBookmarkItem(bookmark, { query, subtitle });
}

function renderTree() {
    const query = searchInput.value.trim().toLowerCase();
    treeContainer.classList.toggle("search-results", query !== "");
    if (!query) {
        treeContainer.replaceChildren(...createTreeNodes(rootNodes));
        return;
    }

    const matches = [...bookmarksById.values()]
        .filter(bookmark => (bookmark.title ?? "").toLowerCase().includes(query) || bookmark.url.toLowerCase().includes(query))
        .slice(0, MAX_SEARCH_RESULTS);
    treeContainer.replaceChildren(...(matches.length > 0
        ? matches.map(bookmark => createSearchResult(bookmark, query))
        : [createElement("p", { className: "bookmark-empty", text: t("bookmarks_search_no_results") })]));
}

function createPinnedItem(bookmark, index) {
    const item = createElement("div", { className: "bookmark-item pinned-item", attrs: { draggable: "true" } });
    item.append(
        createBookmarkLink(bookmark),
        createElement("span", {
            className: "bookmark-actions",
            children: [createActionButton("star", "bookmark_button_unpin_title", () => togglePin(bookmark.id), { filled: true })]
        })
    );

    item.addEventListener("dragstart", event => {
        setDraggedIndex(event, index);
        item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", event => {
        if (!isListReorderDrag(event)) return;
        event.preventDefault();
        item.classList.add("drag-over");
    });
    item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
    item.addEventListener("drop", async event => {
        item.classList.remove("drag-over");
        const fromIndex = getDraggedIndex(event);
        if (fromIndex === null) return;
        event.preventDefault();
        if (fromIndex === index) return;
        await updateSettings(settings => {
            const pinned = settings.bookmarks.pinned;
            const [moved] = pinned.splice(fromIndex, 1);
            pinned.splice(index, 0, moved);
        });
    });
    return item;
}

function renderPinned() {
    const pinnedBookmarks = getSettings().bookmarks.pinned
        .map(id => bookmarksById.get(id))
        .filter(Boolean);

    pinnedGroup.hidden = pinnedBookmarks.length === 0;
    pinnedContainer.replaceChildren(...pinnedBookmarks.map(createPinnedItem));
}

function renderAll() {
    renderPinned();
    renderTree();
}

function collapseAllFolders() {
    openFolderIds.clear();
    saveOpenFolders();
    for (const folder of treeContainer.querySelectorAll("details.bookmark-folder")) folder.open = false;
}

/** Drops pinned ids of bookmarks that were deleted (in this page or elsewhere in Firefox). */
async function forgetDeletedPins() {
    const pinned = getSettings().bookmarks.pinned;
    if (pinned.some(id => !bookmarksById.has(id))) {
        await updateSettings(settings => {
            settings.bookmarks.pinned = settings.bookmarks.pinned.filter(id => bookmarksById.has(id));
        });
    }
}

async function reloadBookmarks() {
    await loadBookmarkTree();
    await forgetDeletedPins();
    renderAll();
}

export function toggleBookmarksSidebar(forceOpen) {
    const isOpen = sidebar.classList.toggle("open", forceOpen);
    document.body.classList.toggle("bookmarks-open", isOpen);
    if (isOpen) searchInput.focus();
}

function applyEnabledState() {
    const { enabled, openByDefault } = getSettings().bookmarks;
    toggleButton.hidden = !enabled;
    toggleBookmarksSidebar(enabled && openByDefault);
}

export async function initBookmarks() {
    applyEnabledState();

    bindControl(showEmptyFoldersCheckbox, {
        get: settings => settings.bookmarks.showEmptyFolders,
        set: (settings, value) => { settings.bookmarks.showEmptyFolders = value; }
    });
    bindControl(openInNewTabCheckbox, {
        get: settings => settings.bookmarks.openInNewTab,
        set: (settings, value) => { settings.bookmarks.openInNewTab = value; }
    });
    toggleButton.addEventListener("click", () => toggleBookmarksSidebar());
    collapseAllButton.addEventListener("click", collapseAllFolders);
    searchInput.addEventListener("input", debounce(renderTree, 200));
    searchInput.addEventListener("keydown", event => {
        if (event.key === "Escape" && searchInput.value) {
            event.stopPropagation();
            searchInput.value = "";
            renderTree();
        }
    });

    subscribe(settings => [settings.bookmarks.enabled, settings.bookmarks.openByDefault], applyEnabledState);
    subscribe(settings => [
        settings.bookmarks.pinned,
        settings.bookmarks.showEmptyFolders,
        settings.bookmarks.openInNewTab,
        settings.links.useGoogleIcons
    ], renderAll);

    const reloadSoon = debounce(reloadBookmarks, 100);
    for (const event of [browser.bookmarks.onCreated, browser.bookmarks.onRemoved, browser.bookmarks.onChanged, browser.bookmarks.onMoved]) {
        event.addListener(reloadSoon);
    }

    await reloadBookmarks();
}

export function isBookmarksEnabled() {
    return getSettings().bookmarks.enabled;
}
