const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("menu-toggle");

toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    toggleBtn.classList.toggle("shifted");
});

document.addEventListener("DOMContentLoaded", async () => {
    const settings = loadCustomSettings();

    await loadBackground(settings);
    loadTimeAndDate(settings);
    loadLinks(settings);
    loadStickyNotes();
    loadWeatherWidget(settings);
    loadBookmarksWidget(settings);
    loadSearchBarWidget(settings);
    saveCustomSettings(settings);

    document.querySelectorAll(".toggle-section").forEach(toggleBtn => {
        const section = toggleBtn.closest("section");
        const content = section.querySelector(".section-content");
        const key = "section_" + section.dataset.section;

        const isOpen = localStorage.getItem(key) === "true";
        if (isOpen) {
            content.classList.add("open");
            toggleBtn.textContent = "−";
        }

        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            content.classList.toggle("open");
            const nowOpen = content.classList.contains("open");
            toggleBtn.textContent = nowOpen ? "−" : "+";
            localStorage.setItem(key, nowOpen);
        });
    });

    document.getElementById("customization-title").addEventListener("click", () => {
        document.querySelectorAll("section").forEach(section => {
            const content = section.querySelector(".section-content");
            const toggleBtn = section.querySelector(".toggle-section");
            const key = "section_" + section.dataset.section;

            if (content.classList.contains("open")) {
                content.classList.remove("open");
                toggleBtn.textContent = "+";
                localStorage.setItem(key, false);
            }
        });
    });
});
