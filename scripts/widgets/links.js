import { getActiveTheme, getSettings, subscribe } from "../core/settings.js";
import { adjustColor } from "../core/color.js";
import { createElement, isValidHttpUrl } from "../core/utils.js";

const linksContainer = document.getElementById("links-container");

/** Links that can actually be opened, in display order (also used by the 1–9 hotkeys). */
export function getOpenableLinks(settings = getSettings()) {
    return settings.links.items.filter(link => isValidHttpUrl(link.url));
}

function createFallbackIcon(link) {
    const letter = (link.label.trim() || new URL(link.url).hostname.replace(/^www\./, ""))[0] ?? "?";
    return createElement("span", { className: "favicon favicon-fallback", text: letter.toUpperCase() });
}

function iconUrl(link, useGoogleIcons) {
    if (link.icon) return link.icon;
    if (useGoogleIcons) {
        return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=${encodeURIComponent(link.url)}`;
    }
    return new URL("/favicon.ico", link.url).href;
}

/**
 * By default the icon comes from the site itself (nothing is sent to third parties).
 * Some sites block that (e.g. Instagram), so a letter is shown instead; the optional
 * Google icon service covers more sites but receives the link addresses.
 */
function createIcon(link, useGoogleIcons) {
    const icon = createElement("img", {
        className: "favicon",
        attrs: { alt: "", src: iconUrl(link, useGoogleIcons), referrerpolicy: "no-referrer" }
    });
    icon.addEventListener("error", () => icon.replaceWith(createFallbackIcon(link)), { once: true });
    return icon;
}

function createLinkElement(link, settings) {
    const anchor = createElement("a", {
        className: "link",
        attrs: { href: link.url, target: settings.links.openInNewTab ? "_blank" : undefined }
    });
    anchor.classList.toggle("underline", settings.links.underlineOnHover);
    anchor.append(createIcon(link, settings.links.useGoogleIcons), createElement("span", { text: link.label }));
    return anchor;
}

export function renderLinks() {
    const settings = getSettings();
    const { links } = settings;
    const linksColor = getActiveTheme(settings).linksColor;

    linksContainer.hidden = !links.visible;
    linksContainer.style.gridTemplateColumns = `repeat(${links.columns}, 1fr)`;
    linksContainer.style.setProperty("--link-color", adjustColor(linksColor, -0.2));
    linksContainer.style.setProperty("--link-hover-color", adjustColor(linksColor, 0.3));
    linksContainer.replaceChildren(...getOpenableLinks(settings).map(link => createLinkElement(link, settings)));
}

export function initLinks() {
    renderLinks();
    subscribe(settings => [settings.links, getActiveTheme(settings).linksColor], renderLinks);
}
