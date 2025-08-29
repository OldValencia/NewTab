const deleteAllNotificationsBtn = document.getElementById("delete-all-notifications");
const toggleNotificationsEditorBtn = document.getElementById("toggle-notifications-editor");

function loadNotifications() {
    browser.storage.local.get("isNotificationsEnabled").then(result => {
        const isNotificationsEnabled = result.isNotificationsEnabled || false;
        toggleNotificationsEditorBtn.checked = isNotificationsEnabled;
        addCustomNotificationButton.style.display = isNotificationsEnabled ? "block" : "none";

        browser.storage.local.set({isNotificationsEnabled: isNotificationsEnabled});
    });
}

deleteAllNotificationsBtn.addEventListener("click", () => {
    browser.storage.local.remove("customNotifications");
    location.reload();
})

toggleNotificationsEditorBtn.addEventListener("change", async (e) => {
    await browser.storage.local.set({isNotificationsEnabled: e.target.checked});
    setTimeout(() => location.reload(), 100);
});
