/**
 * The settings sidebar (right side): opening/closing and collapsible sections.
 * Section open/closed state is per device, kept in localStorage as "section_<name>" (same keys as 1.0.x).
 */
const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menu-toggle");

export function toggleSettingsSidebar(forceOpen) {
    const isOpen = sidebar.classList.toggle("open", forceOpen);
    document.body.classList.toggle("settings-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
}

function sectionStorageKey(section) {
    return `section_${section.dataset.section}`;
}

function setSectionOpen(section, isOpen) {
    section.querySelector(".section-content").classList.toggle("open", isOpen);
    // The chevron in .toggle-section turns via CSS ([aria-expanded="true"]).
    section.querySelector(".toggle-section").setAttribute("aria-expanded", String(isOpen));
    localStorage.setItem(sectionStorageKey(section), String(isOpen));
}

function initSections() {
    const sections = [...sidebar.querySelectorAll("section[data-section]")];

    for (const section of sections) {
        setSectionOpen(section, localStorage.getItem(sectionStorageKey(section)) === "true");
        section.querySelector(".section-header").addEventListener("click", () => {
            const isOpen = section.querySelector(".section-content").classList.contains("open");
            setSectionOpen(section, !isOpen);
        });
    }

    const collapseAll = () => sections.forEach(section => setSectionOpen(section, false));
    for (const title of sidebar.querySelectorAll(".sidebar-group-title")) {
        title.addEventListener("click", collapseAll);
    }
}

export function initSidebar() {
    menuButton.addEventListener("click", () => toggleSettingsSidebar());
    initSections();
}
