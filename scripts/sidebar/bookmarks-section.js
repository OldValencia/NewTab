import { bindControl } from "./controls.js";

export function initBookmarksSection() {
    bindControl(document.getElementById("toggle-bookmarks-widget"), {
        get: settings => settings.bookmarks.enabled,
        set: (settings, value) => { settings.bookmarks.enabled = value; }
    });
    bindControl(document.getElementById("toggle-bookmarks-widget-always-open"), {
        get: settings => settings.bookmarks.openByDefault,
        set: (settings, value) => { settings.bookmarks.openByDefault = value; }
    });
}
