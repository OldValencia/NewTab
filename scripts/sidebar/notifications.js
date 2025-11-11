const deleteAllNotificationsBtn = document.getElementById("delete-all-notifications");
const toggleNotificationsEditorBtn = document.getElementById("toggle-notifications-editor");

function loadNotifications() {
    chrome.storage.local.get("isNotificationsEnabled").then(result => {
        const isNotificationsEnabled = result.isNotificationsEnabled || false;
        toggleNotificationsEditorBtn.checked = isNotificationsEnabled;
        addCustomNotificationButton.style.display = isNotificationsEnabled ? "block" : "none";

        chrome.storage.local.set({isNotificationsEnabled: isNotificationsEnabled});
    });
}

deleteAllNotificationsBtn.addEventListener("click", () => {
    chrome.storage.local.remove("customNotifications");
    location.reload();
})

toggleNotificationsEditorBtn.addEventListener("change", async (e) => {
    await chrome.storage.local.set({isNotificationsEnabled: e.target.checked});
    setTimeout(() => location.reload(), 100);
});
