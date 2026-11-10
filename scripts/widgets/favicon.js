/**
 * Site icons for links and bookmarks.
 * By default the icon comes from the site itself (nothing is sent to third parties).
 * Some sites block that (e.g. Instagram), so a letter is shown instead; the optional
 * Google icon service covers more sites but receives the addresses.
 */
import { createElement } from "../core/utils.js";

function hostnameOf(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

function createFallbackIcon(url, label) {
    const letter = (label.trim() || hostnameOf(url))[0] ?? "?";
    return createElement("span", { className: "favicon favicon-fallback", text: letter.toUpperCase() });
}

function iconUrl(url, cachedIcon, useGoogleIcons) {
    if (cachedIcon) return cachedIcon;
    if (useGoogleIcons) {
        return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=${encodeURIComponent(url)}`;
    }
    return new URL("/favicon.ico", url).href;
}

/**
 * @param {{ url: string, label?: string, cachedIcon?: string, useGoogleIcons: boolean, lazy?: boolean }} options
 *   lazy: load only when shown — a bookmarks tree can hold hundreds of sites in closed folders
 */
export function createFavicon({ url, label = "", cachedIcon, useGoogleIcons, lazy = false }) {
    let src;
    try {
        src = iconUrl(url, cachedIcon, useGoogleIcons);
    } catch {
        return createFallbackIcon(url, label); // not an http(s) URL, e.g. "about:" or "javascript:"
    }
    if (!/^(https?:|data:image\/)/.test(src)) return createFallbackIcon(url, label);

    const icon = createElement("img", {
        className: "favicon",
        attrs: { alt: "", src, referrerpolicy: "no-referrer", loading: lazy ? "lazy" : undefined }
    });
    icon.addEventListener("error", () => icon.replaceWith(createFallbackIcon(url, label)), { once: true });
    return icon;
}
