function showNotification(title, body, link) {
    browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-96.png",
        title: title,
        message: body
    }).then(notificationId => {
        if (link) {
            browser.notifications.onClicked.addListener((clickedId) => {
                if (clickedId === notificationId) {
                    browser.tabs.create({url: link});
                }
            });
        }
    });
}

function startBackgroundChecker() {
    setInterval(async () => {
        const result = await browser.storage.local.get("customNotifications");
        const notifications = result.customNotifications || [];

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        for (const notification of notifications) {
            if (notification.active === false) continue;

            const {type, title, body, link, triggerData} = notification;

            if (type === "time" && triggerData.time === currentTime) {
                console.log(`⏰ Time match: ${currentTime}`);
                showNotification(title, body, link);
                notification.active = false;
            }

            if (type === "timer" && triggerData.triggerAt <= Date.now()) {
                console.log(`⏳ Timer triggered`);
                showNotification(title, body, link);
                notification.active = false;
            }
            // temperature and url handled separately
        }

        await browser.storage.local.set({customNotifications: notifications});
    }, 1000); // every minute
}

startBackgroundChecker();

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        const result = await browser.storage.local.get("customNotifications");
        const notifications = result.customNotifications || [];
        const currentURL = tab.url;

        for (const notif of notifications) {
            const {type, title, body, link, triggerData} = notif;
            const now = Date.now();

            if (type === "url" && currentURL.includes(triggerData.url) &&
                notif.active !== false && (!notif.lastTriggeredAt || now - notif.lastTriggeredAt > 5000)) {
                console.log(`🌐 URL match: ${currentURL}`);
                showNotification(title, body, link);
                notif.active = false;
                notif.lastTriggeredAt = now;

                await browser.storage.local.set({customNotifications: notifications});
            }
        }
    }
});
