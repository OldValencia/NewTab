const versionInfoElement = document.getElementById("version-info");

async function loadVersionInfo() {
    try {
        const res = await fetch("manifest.json");
        const manifest = await res.json();
        const version = manifest.version || "unknown";
        versionInfoElement.textContent = `Version ${version}`;
    } catch (err) {
        console.warn("Could not load manifest.json:", err);
        versionInfoElement.textContent = "";
    }
}

document.addEventListener("DOMContentLoaded", loadVersionInfo);
