const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("menu-toggle");

function openMainSidebar() {
    sidebar.classList.toggle("open");
    toggleBtn.classList.toggle("shifted");
    weatherWidgetElement.classList.toggle("sidebar-shifted");
    addCustomNotificationButton.classList.toggle("sidebar-shifted");
}

toggleBtn.addEventListener("click", openMainSidebar);

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
        loadDefaultCustomizationSettings(),
        loadCloudSettings(),
        loadLocalization()
    ]);

    await Promise.all([
        loadBackground(),
        loadTimeAndDate(),
        loadLinks(),
        loadWeatherWidget(),
        loadBookmarksWidget()
    ]);

    loadNotifications();

    const sectionStates = new Map();
    document.querySelectorAll(".toggle-section").forEach(toggleBtn => {
        const section = toggleBtn.closest("section");
        const content = section.querySelector(".section-content");
        const key = "section_" + section.dataset.section;

        const isOpen = localStorage.getItem(key) === "true";
        if (isOpen) {
            content.classList.add("open");
            toggleBtn.textContent = "−";
        }
        sectionStates.set(section, { content, toggleBtn, key });

        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            content.classList.toggle("open");
            const nowOpen = content.classList.contains("open");
            toggleBtn.textContent = nowOpen ? "−" : "+";
            localStorage.setItem(key, nowOpen);
        });
    });

    const collapseAll = () => {
        sectionStates.forEach(({ content, toggleBtn, key }) => {
            if (content.classList.contains("open")) {
                content.classList.remove("open");
                toggleBtn.textContent = "+";
                localStorage.setItem(key, false);
            }
        });
    };

    document.getElementById("customization-title")?.addEventListener("click", collapseAll);
    document.getElementById("settings-title")?.addEventListener("click", collapseAll);
});
