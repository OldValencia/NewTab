/**
 * Keyboard shortcuts (listed in the "Hotkeys" sidebar section):
 *   ←    toggle the bookmarks sidebar (when bookmarks are enabled)
 *   →    toggle the settings sidebar
 *   1–9  open the corresponding link
 */
import { getSettings } from "./core/settings.js";
import { isDialogOpen } from "./core/dialog.js";
import { getOpenableLinks } from "./widgets/links.js";
import { isBookmarksEnabled, toggleBookmarksSidebar } from "./widgets/bookmarks.js";
import { toggleSettingsSidebar } from "./sidebar/sidebar.js";

const TEXT_ENTRY_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function shouldIgnore(event) {
    if (event.defaultPrevented || event.repeat || isDialogOpen()) return true;
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return true;
    const target = event.target;
    return TEXT_ENTRY_TAGS.has(target.tagName) || target.isContentEditable;
}

/** Works even when the links grid is hidden, as in 1.0.x. */
function openLink(position) {
    const settings = getSettings();
    const link = getOpenableLinks(settings)[position - 1];
    if (!link) return;

    if (settings.links.openInNewTab) {
        window.open(link.url, "_blank", "noopener");
    } else {
        window.location.href = link.url;
    }
}

export function initHotkeys() {
    document.addEventListener("keydown", event => {
        if (shouldIgnore(event)) return;

        if (event.key === "ArrowLeft") {
            if (!isBookmarksEnabled()) return;
            event.preventDefault();
            toggleBookmarksSidebar();
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            toggleSettingsSidebar();
        } else if (/^Digit[1-9]$/.test(event.code)) {
            event.preventDefault();
            openLink(Number(event.code.slice("Digit".length)));
        }
    });
}
