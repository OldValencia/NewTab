const MAIN_SIDEBAR_SPEED_THRESHOLD = 1.5;
const MAIN_SIDEBAR_EDGE_ZONE = 60;
const BOOKMARKS_SIDEBAR_SPEED_THRESHOLD = -1.5;
const BOOKMARKS_SIDEBAR_EDGE_ZONE = 90;

let lastX = null;
let lastTime = null;
let velocityX = 0;

const debounceMainSidebar = debounce(openMainSidebar, 500);
const debounceBookmarksSidebar = debounce(openBookmarksSidebar, 500);

document.addEventListener("mousemove", (e) => {
    const now = performance.now();

    if (lastX !== null && lastTime !== null) {
        const dx = e.clientX - lastX;
        const dt = now - lastTime;

        if (dt > 2) {
            velocityX = dx / dt;

            if (velocityX >= MAIN_SIDEBAR_SPEED_THRESHOLD &&
                window.innerWidth - e.clientX <= MAIN_SIDEBAR_EDGE_ZONE) {
                debounceMainSidebar();
            }

            const bookmarksSidebarState = getBookmarkSetting("show");
            if (bookmarksSidebarState &&
                velocityX <= BOOKMARKS_SIDEBAR_SPEED_THRESHOLD &&
                e.clientX <= BOOKMARKS_SIDEBAR_EDGE_ZONE) {
                debounceBookmarksSidebar();
            }
        }
    }

    lastX = e.clientX;
    lastTime = now;
});
