import { getActiveTheme, getSettings, subscribe } from "../core/settings.js";
import { adjustColor } from "../core/color.js";
import { createElement, isValidHttpUrl } from "../core/utils.js";
import { createFavicon } from "./favicon.js";

const linksContainer = document.getElementById("links-container");

/** Links that can actually be opened, in display order (also used by the 1–9 hotkeys). */
export function getOpenableLinks(settings = getSettings()) {
    return settings.links.items.filter(link => isValidHttpUrl(link.url));
}

function createLinkElement(link, settings) {
    const anchor = createElement("a", {
        className: "link",
        attrs: { href: link.url, target: settings.links.openInNewTab ? "_blank" : undefined }
    });
    anchor.classList.toggle("underline", settings.links.underlineOnHover);
    const icon = createFavicon({
        url: link.url,
        label: link.label,
        cachedIcon: link.icon,
        useGoogleIcons: settings.links.useGoogleIcons
    });
    anchor.append(icon, createElement("span", { text: link.label }));
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
