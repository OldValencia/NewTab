const openBookmarksSidebarBtn = document.getElementById("bookmark-toggle");
const bookmarkSidebar = document.getElementById("bookmark-sidebar");
const toggleEmptyFoldersCheckbox = document.getElementById("toggle-empty-folders");
const openBookmarksInNewTabCheckbox = document.getElementById("open-bookmark-in-new-tab");
const bookmarkTree = document.getElementById("bookmark-tree");
const pinnedSection = document.getElementById("pinned-section");
const bookmarksSearchInput = document.getElementById("bookmark-search");

let allBookmarks = [];

document.addEventListener("DOMContentLoaded", () => {
    loadBookmarks();
    renderPinned();

    openBookmarksSidebarBtn.addEventListener("click", openBookmarksSidebar);

    setupCheckbox(toggleEmptyFoldersCheckbox, "showEmptyFolders", true, () => {
        renderBookmarkTree(allBookmarks, bookmarkTree);
    });

    setupCheckbox(openBookmarksInNewTabCheckbox, "openBookmarksInNewTab", false, () => {
        renderBookmarkTree(allBookmarks, bookmarkTree);
        renderPinned();
    });

    bookmarksSearchInput.addEventListener("input", e => {
        const query = e.target.value.toLowerCase();
        filterBookmarks(query);
    });
});

function openBookmarksSidebar() {
    bookmarkSidebar.classList.toggle("hidden");
    openBookmarksSidebarBtn.classList.toggle("shifted");
    if (!bookmarkSidebar.classList.contains("hidden")) {
        bookmarksSearchInput.focus();
    }
}

function getBookmarkSetting(key, defaultValue) {
    const settings = loadCustomSettings();
    return settings.bookmarks?.[key] ?? defaultValue;
}

function setBookmarkSetting(key, value) {
    const settings = loadCustomSettings();
    settings.bookmarks = settings.bookmarks || {};
    settings.bookmarks[key] = value;
    saveCustomSettings(settings);
}


function setupCheckbox(checkbox, key, defaultValue, onChange) {
    checkbox.checked = getBookmarkSetting(key, defaultValue);
    checkbox.addEventListener("change", () => {
        setBookmarkSetting(key, checkbox.checked);
        onChange();
    });
}

function loadBookmarks() {
    browser.bookmarks.getTree().then(tree => {
        allBookmarks = tree[0].children || [];
        renderBookmarkTree(allBookmarks, bookmarkTree);
    });
}

function renderBookmarkTree(nodes, container, depth = 0) {
    container.innerHTML = "";
    const showEmpty = getBookmarkSetting("showEmptyFolders", true);

    nodes.forEach(node => {
        if (node.children) {
            if (!showEmpty && !hasVisibleContent(node)) return;

            const folder = document.createElement("details");
            folder.className = "bookmark-folder";
            folder.style.marginLeft = `${depth * 12}px`;
            folder.style.marginTop = "5px";

            const summary = document.createElement("summary");
            summary.textContent = node.title?.trim() || "📁 Без названия";
            folder.appendChild(summary);

            const innerContainer = document.createElement("div");
            renderBookmarkTree(node.children, innerContainer, depth + 1);
            folder.appendChild(innerContainer);

            container.appendChild(folder);
        } else if (node.url) {
            const item = createBookmarkItem(node, {draggable: false});
            item.style.marginLeft = `${depth * 12}px`;
            container.appendChild(item);
        }
    });
}

function createBookmarkItem(bookmark, {draggable = false} = {}) {
    const item = document.createElement("div");
    item.className = "bookmark-item";
    item.draggable = draggable;

    const link = document.createElement("a");
    link.href = bookmark.url;
    link.textContent = bookmark.title || bookmark.url;
    if (getBookmarkSetting("openBookmarksInNewTab", false)) {
        link.target = "_blank";
    }

    const isPinned = getPinned().some(b => b.id === bookmark.id);
    const pin = isPinned
        ? createButton("✅", null)
        : createButton("⭐", () => pinBookmark(bookmark));

    item.append(link, pin);
    return item;
}

function createButton(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = "pin-button";
    if (onClick) {
        btn.onclick = function (e) {
            e.stopPropagation();
            onClick(e);
        };
    }
    return btn;
}

function flattenBookmarks(nodes, result = []) {
    nodes.forEach(node => {
        if (node.url) {
            result.push(node);
        } else if (node.children) {
            flattenBookmarks(node.children, result);
        }
    });
    return result;
}

function filterBookmarks(query) {
    if (!query.trim()) {
        renderBookmarkTree(allBookmarks, bookmarkTree);
        return;
    }

    const flat = flattenBookmarks(allBookmarks);
    const filtered = flat.filter(b =>
        (b.title || "").toLowerCase().includes(query) ||
        (b.url || "").toLowerCase().includes(query)
    );

    bookmarkTree.innerHTML = "";
    filtered.forEach(b => bookmarkTree.appendChild(createBookmarkItem(b)));
}

function getPinned() {
    return getBookmarkSetting("pinnedBookmarks", []);
}

function pinBookmark(bookmark) {
    const pinned = getPinned();
    if (pinned.find(b => b.id === bookmark.id)) return;
    pinned.push(bookmark);
    setBookmarkSetting("pinnedBookmarks", pinned);
    const openFolders = getOpenFolderPaths(bookmarkTree);
    renderBookmarkTree(allBookmarks, bookmarkTree);
    restoreOpenFolders(bookmarkTree, openFolders);
    renderPinned();
}

function renderPinned() {
    pinnedSection.innerHTML = "";
    const pinnedBookmarks = getPinned();
    if (pinnedBookmarks.length === 0) {
        pinnedSection.style.display = "none";
        return;
    }

    pinnedSection.style.display = "flex";
    pinnedBookmarks.forEach((bookmark, index) => {
        const item = document.createElement("div"); // заменено с label на div
        item.className = "bookmark-item";
        item.draggable = true;
        item.dataset.index = index;

        const link = document.createElement("a");
        link.href = bookmark.url;
        link.textContent = bookmark.title || bookmark.url;
        if (getBookmarkSetting("openBookmarksInNewTab", false)) {
            link.target = "_blank";
        }

        const remove = createButton("🗑️", () => {
            const updated = getPinned().filter(b => b.id !== bookmark.id);
            setBookmarkSetting("pinnedBookmarks", updated);
            const openFolders = getOpenFolderPaths(bookmarkTree);
            renderBookmarkTree(allBookmarks, bookmarkTree);
            restoreOpenFolders(bookmarkTree, openFolders);
            renderPinned();
        });

        item.append(link, remove);
        pinnedSection.appendChild(item);
    });

    enableDragAndDrop(pinnedSection);
}

function getOpenFolderPaths(container) {
    const openFolders = [];
    container.querySelectorAll("details").forEach(folder => {
        if (folder.open) {
            const path = folder.querySelector("summary")?.textContent;
            if (path) openFolders.push(path);
        }
    });
    return openFolders;
}

function restoreOpenFolders(container, openFolders) {
    container.querySelectorAll("details").forEach(folder => {
        const path = folder.querySelector("summary")?.textContent;
        if (openFolders.includes(path)) {
            folder.open = true;
        }
    });
}

function enableDragAndDrop(container) {
    let dragged;

    container.querySelectorAll(".bookmark-item").forEach(item => {
        item.addEventListener("dragstart", (e) => {
            if (e.target.closest("button")) {
                e.preventDefault();
                return;
            }
            dragged = item;
        });

        item.addEventListener("dragover", e => e.preventDefault());

        item.addEventListener("drop", () => {
            if (dragged === item) return;

            const items = Array.from(container.children);
            const draggedIndex = items.indexOf(dragged);
            const targetIndex = items.indexOf(item);

            if (draggedIndex === -1 || targetIndex === -1) return;

            const pinned = getPinned();
            const moved = pinned.splice(draggedIndex, 1)[0];
            pinned.splice(targetIndex, 0, moved);

            setBookmarkSetting("pinnedBookmarks", pinned);
            renderPinned();
        });
    });
}

function hasVisibleContent(node) {
    if (node.url) return true;
    if (!node.children || node.children.length === 0) return false;
    return node.children.some(hasVisibleContent);
}
