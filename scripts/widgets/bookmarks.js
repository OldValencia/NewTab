/**
 * Bookmarks sidebar (left side): pinned bookmarks, the full tree and search.
 */
import { getSettings, subscribe, updateSettings } from "../core/settings.js";
import { confirmDialog } from "../core/dialog.js";
import { t } from "../core/i18n.js";
import { createElement, debounce, getDraggedIndex, isListReorderDrag, setDraggedIndex } from "../core/utils.js";
import { bindControl } from "../sidebar/controls.js";

const toggleButton = document.getElementById("bookmark-toggle");
const sidebar = document.getElementById("bookmark-sidebar");
const searchInput = document.getElementById("bookmark-search");
const showEmptyFoldersCheckbox = document.getElementById("toggle-empty-folders");
const openInNewTabCheckbox = document.getElementById("open-bookmark-in-new-tab");
const treeContainer = document.getElementById("bookmark-tree");
const pinnedContainer = document.getElementById("pinned-section");

const INDENT_PX = 12;

let rootNodes = [];
let bookmarksById = new Map();
const openFolderIds = new Set();

function indexBookmarks(nodes) {
    for (const node of nodes) {
        if (node.url) bookmarksById.set(node.id, node);
        if (node.children) indexBookmarks(node.children);
    }
}

async function loadBookmarkTree() {
    const [root] = await browser.bookmarks.getTree();
    rootNodes = root.children ?? [];
    bookmarksById = new Map();
    indexBookmarks(rootNodes);
}

function hasBookmarks(folder) {
    return folder.children?.some(child => child.url || hasBookmarks(child)) ?? false;
}

function createButton(text, titleKey, onClick) {
    const button = createElement("button", { className: "bookmark-button", text, attrs: { type: "button", title: t(titleKey) } });
    button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
    });
    return button;
}

function createBookmarkLink(bookmark) {
    return createElement("a", {
        text: bookmark.title || bookmark.url,
        attrs: {
            href: bookmark.url,
            title: bookmark.url,
            target: getSettings().bookmarks.openInNewTab ? "_blank" : undefined
        }
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

    item.replaceChildren(input, createButton("💾", "bookmark_button_save_title", save));
    input.focus();
    input.select();
}

function createBookmarkItem(bookmark, depth = 0) {
    const item = createElement("div", { className: "bookmark-item" });
    item.style.marginLeft = `${depth * INDENT_PX}px`;

    const isPinned = getSettings().bookmarks.pinned.includes(bookmark.id);
    item.append(
        createBookmarkLink(bookmark),
        createButton(isPinned ? "📌" : "⭐", isPinned ? "bookmark_button_unpin_title" : "bookmark_button_pin_title", () => togglePin(bookmark.id)),
        createButton("✏️", "bookmark_button_rename_title", () => startRename(item, bookmark)),
        createButton("🗑️", "bookmark_button_delete_title", () => deleteBookmark(bookmark))
    );
    return item;
}

function createFolder(folder, depth) {
    const details = createElement("details", { className: "bookmark-folder" });
    details.style.marginLeft = `${depth * INDENT_PX}px`;
    details.open = openFolderIds.has(folder.id);
    details.addEventListener("toggle", () => {
        if (details.open) openFolderIds.add(folder.id);
        else openFolderIds.delete(folder.id);
    });

    const content = createElement("div");
    content.append(...createTreeNodes(folder.children, depth + 1));
    details.append(createElement("summary", { text: folder.title?.trim() || t("bookmark_folder_no_name") }), content);
    return details;
}

function createTreeNodes(nodes, depth = 0) {
    const showEmptyFolders = getSettings().bookmarks.showEmptyFolders;
    return nodes.flatMap(node => {
        if (node.children) {
            return showEmptyFolders || hasBookmarks(node) ? [createFolder(node, depth)] : [];
        }
        return node.url ? [createBookmarkItem(node, depth)] : [];
    });
}

function renderTree() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        treeContainer.replaceChildren(...createTreeNodes(rootNodes));
        return;
    }

    const matches = [...bookmarksById.values()].filter(bookmark =>
        (bookmark.title ?? "").toLowerCase().includes(query) || bookmark.url.toLowerCase().includes(query));
    treeContainer.replaceChildren(...matches.map(bookmark => createBookmarkItem(bookmark)));
}

function createPinnedItem(bookmark, index) {
    const item = createElement("div", { className: "bookmark-item", attrs: { draggable: "true" } });
    item.append(createBookmarkLink(bookmark), createButton("📌", "bookmark_button_unpin_title", () => togglePin(bookmark.id)));

    item.addEventListener("dragstart", event => setDraggedIndex(event, index));
    item.addEventListener("dragover", event => {
        if (isListReorderDrag(event)) event.preventDefault();
    });
    item.addEventListener("drop", async event => {
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

    pinnedContainer.hidden = pinnedBookmarks.length === 0;
    pinnedContainer.replaceChildren(...pinnedBookmarks.map(createPinnedItem));
}

function renderAll() {
    renderPinned();
    renderTree();
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
    searchInput.addEventListener("input", debounce(renderTree, 200));

    subscribe(settings => [settings.bookmarks.enabled, settings.bookmarks.openByDefault], applyEnabledState);
    subscribe(settings => [settings.bookmarks.pinned, settings.bookmarks.showEmptyFolders, settings.bookmarks.openInNewTab], renderAll);

    const reloadSoon = debounce(reloadBookmarks, 100);
    for (const event of [browser.bookmarks.onCreated, browser.bookmarks.onRemoved, browser.bookmarks.onChanged, browser.bookmarks.onMoved]) {
        event.addListener(reloadSoon);
    }

    await reloadBookmarks();
}

export function isBookmarksEnabled() {
    return getSettings().bookmarks.enabled;
}
