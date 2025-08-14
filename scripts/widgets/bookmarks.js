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

function setupCheckbox(checkbox, key, defaultValue, onChange) {
    checkbox.checked = getBookmarkSetting(key, defaultValue);
    checkbox.addEventListener("change", () => {
        setBookmarkSetting(key, checkbox.checked);
        onChange();
    });
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

function getPinned() {
    return getBookmarkSetting("pinnedBookmarks", []);
}

function loadBookmarks() {
    return browser.bookmarks.getTree().then(tree => {
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
            summary.textContent = node.title?.trim() || "📁 No Name";
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

    const pin = getPinned().includes(bookmark.id)
        ? createButton("📌", () => unpinBookmark(bookmark.id))
        : createButton("⭐", () => pinBookmark(bookmark.id));

    const removeBtn = createButton("🗑️", async () => {
        const settings = loadCustomSettings();
        const localizedMessage = await getLocalizationByKey("delete_bookmark_confirmation_window_text", settings.locale);
        showConfirmation(localizedMessage, () => {
            const openFolders = getOpenFolderPaths(bookmarkTree);
            browser.bookmarks.remove(bookmark.id).then(() => {
                loadBookmarks().then(() => reRenderAndRestoreOpenFolders(openFolders));
            });
        });
    });

    const renameBtn = createButton("✏️", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = bookmark.title || bookmark.url;
        input.className = "rename-input";

        const saveBtn = createButton("💾", async () => {
            const newTitle = input.value.trim();
            if (newTitle) {
                const settings = loadCustomSettings();
                const firstConfirmationMessagePart = await getLocalizationByKey("rename_bookmark_confirmation_window_text_first_part", settings.locale);
                const secondConfirmationMessagePart = await getLocalizationByKey("rename_bookmark_confirmation_window_text_second_part", settings.locale);
                showConfirmation(`${firstConfirmationMessagePart} ${bookmark.title}\n${secondConfirmationMessagePart} ${newTitle}`,
                    () => {
                        const openFolders = getOpenFolderPaths(bookmarkTree);
                        browser.bookmarks.update(bookmark.id, { title: newTitle }).then(() => {
                            loadBookmarks().then(() => reRenderAndRestoreOpenFolders(openFolders));
                        });
                    },
                    () => {
                        item.innerHTML = "";
                        item.append(link, pin, renameBtn, removeBtn);
                    }
                );
            }
        });

        item.innerHTML = "";
        item.append(input, saveBtn);
    });

    item.append(link, pin, renameBtn, removeBtn);

    return item;
}

function createButton(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = "bookmark-button";
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

function unpinBookmark(bookmarkId) {
    const updated = getPinned().filter(id => id !== bookmarkId);
    setBookmarkSetting("pinnedBookmarks", updated);
    const openFolders = getOpenFolderPaths(bookmarkTree);
    reRenderAndRestoreOpenFolders(openFolders);
}

function pinBookmark(bookmarkId) {
    const pinned = getPinned();
    if (pinned.find(id => id === bookmarkId)) return;
    pinned.push(bookmarkId);
    setBookmarkSetting("pinnedBookmarks", pinned);
    const openFolders = getOpenFolderPaths(bookmarkTree);
    reRenderAndRestoreOpenFolders(openFolders);
}

async function renderPinned() {
    pinnedSection.innerHTML = "";
    const pinnedBookmarkIds = getPinned();
    if (pinnedBookmarkIds.length === 0) {
        pinnedSection.style.display = "none";
        return;
    }

    pinnedSection.style.display = "flex";
    for (const bookmarkId of pinnedBookmarkIds) {
        const index = pinnedBookmarkIds.indexOf(bookmarkId);
        const bookmark = await browser.bookmarks.get(bookmarkId);

        const item = document.createElement("div");
        item.className = "bookmark-item";
        item.draggable = true;
        item.dataset.index = index;

        const link = document.createElement("a");
        link.href = bookmark[0].url;

        link.textContent = bookmark[0].title || bookmark[0].url;
        if (getBookmarkSetting("openBookmarksInNewTab", false)) {
            link.target = "_blank";
        }

        const remove = createButton("📌", () => unpinBookmark(bookmarkId));

        item.append(link, remove);
        pinnedSection.appendChild(item);
    }

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

function reRenderAndRestoreOpenFolders(openFolders) {
    renderBookmarkTree(allBookmarks, bookmarkTree);
    restoreOpenFolders(bookmarkTree, openFolders);
    renderPinned();
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
