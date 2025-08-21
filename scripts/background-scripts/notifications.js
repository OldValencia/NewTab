let checkInterval = 1000;
let inactivityStart = Date.now();
let timerId = null;

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

function resetChecker() {
    if (timerId) clearInterval(timerId);
    checkInterval = 1000;
    inactivityStart = Date.now();
    startBackgroundChecker();
}

function startBackgroundChecker() {
    timerId = setInterval(async () => {
        const result = await browser.storage.local.get("customNotifications");
        const notifications = result.customNotifications || [];

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        let eventTriggered = false;

        for (const notification of notifications) {
            if (notification.active === false) continue;

            const {type, title, body, link, triggerData} = notification;

            if (type === "time" && triggerData.time === currentTime) {
                console.log(`⏰ Time match: ${currentTime}`);
                showNotification(title, body, link);
                notification.active = false;
                eventTriggered = true;
            }

            if (type === "timer" && triggerData.triggerAt <= Date.now()) {
                console.log(`⏳ Timer triggered`);
                showNotification(title, body, link);
                notification.active = false;
                eventTriggered = true;
            }
        }

        if (eventTriggered) {
            inactivityStart = Date.now();
            if (checkInterval !== 1000) resetChecker();
        } else {
            const inactiveTime = Date.now() - inactivityStart;

            if (inactiveTime > 6 * 60 * 60 * 1000) {
                console.log("🛑 Disable checker timer — 6 hours of inactivity");
                clearInterval(timerId);
                timerId = null;
            } else if (inactiveTime > 30 * 60 * 1000 && checkInterval !== 3600000) {
                console.log("⏱ Switch checker timer to 1 hour");
                checkInterval = 3600000;
                resetChecker();
            } else if (inactiveTime > 30 * 1000 && checkInterval !== 60000) {
                console.log("⏱ Switch checker timer to 1 minute");
                checkInterval = 60000;
                resetChecker();
            }
        }

        await browser.storage.local.set({customNotifications: notifications});
    }, checkInterval);
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
