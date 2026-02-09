const versionInfoElement = document.getElementById("version-info");

const links = [
    { href: "https://github.com/OldValencia/NewTab", text: " | GitHub repository" },
    { href: "https://buymeacoffee.com/oldvalencia", text: " | BuyMeACoffee" },
    { href: "https://ko-fi.com/oldvalencia", text: " | Ko-fi" }
];

function createLink(href, text) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    link.style.cssText = "color: inherit; font-size: inherit; text-decoration: none;";
    return link;
}

async function loadVersionInfo() {
    const fragment = document.createDocumentFragment();

    try {
        const res = await fetch("manifest.json");
        const manifest = await res.json();
        const version = manifest.version || "unknown";
        const settings = loadCustomSettings();

        const versionText = await getLocalizationByKey("version_text_content", settings.locale);
        versionInfoElement.textContent = `${versionText} ${version}`;
    } catch (err) {
        console.warn("Could not load manifest.json:", err);
        versionInfoElement.textContent = "";
    }

    links.forEach(linkData => {
        fragment.appendChild(createLink(linkData.href, linkData.text));
    });

    versionInfoElement.appendChild(fragment);
}

document.addEventListener("DOMContentLoaded", loadVersionInfo);
