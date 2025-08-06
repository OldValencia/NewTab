const versionInfoElement = document.getElementById("version-info");

async function loadVersionInfo() {
    const githubLink = document.createElement("a");
    githubLink.href = "https://github.com/OldValencia/NewTab";
    githubLink.textContent = " | GitHub repository";
    githubLink.style.color = "inherit";
    githubLink.style.fontSize = "inherit";
    githubLink.style.textDecoration = "none";

    const kofiLink = document.createElement("a");
    kofiLink.href = "https://ko-fi.com/oldvalencia";
    kofiLink.textContent = " | Ko-fi";
    kofiLink.style.color = "inherit";
    kofiLink.style.fontSize = "inherit";
    kofiLink.style.textDecoration = "none";

    const bmacLink = document.createElement("a");
    bmacLink.href = "https://buymeacoffee.com/oldvalencia";
    bmacLink.textContent = " | BuyMeACoffee";
    bmacLink.style.color = "inherit";
    bmacLink.style.fontSize = "inherit";
    bmacLink.style.textDecoration = "none";
    try {
        const res = await fetch("manifest.json");
        const manifest = await res.json();
        const version = manifest.version || "unknown";
        versionInfoElement.textContent = `Version ${version}`;
        versionInfoElement.appendChild(githubLink);
        versionInfoElement.appendChild(bmacLink);
        versionInfoElement.appendChild(kofiLink);
    } catch (err) {
        console.warn("Could not load manifest.json:", err);
        versionInfoElement.textContent = "";
        versionInfoElement.appendChild(githubLink);
        versionInfoElement.appendChild(bmacLink);
        versionInfoElement.appendChild(kofiLink);
    }
}

document.addEventListener("DOMContentLoaded", loadVersionInfo);
