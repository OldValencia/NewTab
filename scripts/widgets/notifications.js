const addCustomNotificationButton = document.getElementById("add-custom-notification");
const notificationEditorId = "notif-editor";

function saveNotification(notification) {
    browser.storage.local.get("customNotifications").then(result => {
        const notifications = result.customNotifications || [];
        notifications.push(notification);
        browser.storage.local.set({customNotifications: notifications}).then(() => {
            alert("✅ Notification saved!");
            resetChecker();
        });
    });
}

function showNotificationList(editorContainer) {
    const listContainer = document.createElement("div");
    listContainer.id = notificationEditorId;
    listContainer.classList.add("notification-list-mode");

    listContainer.style.top = editorContainer.style.top || "100px";
    listContainer.style.left = editorContainer.style.left || "100px";

    listContainer.innerHTML = `
        <div class="notif-editor-header">
            <h2 id="drag-handle">📋 Saved Notifications</h2>
            <button id="back-to-editor-btn" class="notification-header-button">←</button>
        </div>
        <div id="notifications-list"></div>
    `;

    document.body.appendChild(listContainer);
    makeContainerDraggable(listContainer);
    editorContainer.classList.add("hidden");

    const backBtn = listContainer.querySelector("#back-to-editor-btn");
    backBtn.addEventListener("click", () => {
        const left = listContainer.style.left;
        const top = listContainer.style.top;

        editorContainer.style.left = left;
        editorContainer.style.top = top;

        listContainer.remove();
        editorContainer.classList.remove("hidden");
    });

    const listDiv = listContainer.querySelector("#notifications-list");

    browser.storage.local.get("customNotifications").then(result => {
        const notifications = result.customNotifications || [];

        if (notifications.length === 0) {
            listDiv.innerHTML = `<p class="notif-empty">There are no saved notifications.</p>`;
            return;
        }

        notifications.forEach((notif, index) => {
            const item = document.createElement("div");
            item.className = "notif-list-item";

            const titleEl = document.createElement("strong");
            titleEl.className = "notif-title";
            titleEl.textContent = notif.title || "No title";

            const bodyEl = document.createElement("p");
            bodyEl.className = "notif-body";
            bodyEl.textContent = notif.body || "No text";

            const metaEl = document.createElement("div");
            metaEl.className = "notif-meta";
            metaEl.textContent = `Type: ${notif.type}, Active: ${notif.active ? "Yes" : "No"}`;

            const activateBtn = document.createElement("button");
            activateBtn.className = "make-active-notif-btn";
            activateBtn.textContent = notifications[index].active ? "🚫 Deactivate" : "⏻ Activate";
            activateBtn.style.background = notifications[index].active ? "linear-gradient(135deg, #d9534f, #ff6b6b)" : "linear-gradient(135deg, #28a745, #5cd67a)";
            activateBtn.addEventListener("click", () => {
                notifications[index].active = !notifications[index].active;
                browser.storage.local.set({ customNotifications: notifications }).then(() => {
                    listContainer.remove();
                    showNotificationList(editorContainer);
                });
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-notif-btn";
            deleteBtn.textContent = "🗑️ Delete";
            deleteBtn.addEventListener("click", () => {
                notifications.splice(index, 1);
                browser.storage.local.set({ customNotifications: notifications }).then(() => {
                    listContainer.remove();
                    showNotificationList(editorContainer);
                });
            });

            item.appendChild(titleEl);
            item.appendChild(bodyEl);
            item.appendChild(metaEl);
            item.appendChild(activateBtn);
            item.appendChild(deleteBtn);

            listDiv.appendChild(item);
        });
    });
}

function removeNotificationTempTriggerType() {
    const notificationEditor = document.getElementById(notificationEditorId);
    if (!notificationEditor) return;
    const triggerTypeSelect = notificationEditor.querySelector("#trigger-type");
    const options = triggerTypeSelect.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === "temperature") {
            triggerTypeSelect.remove(i);
            break;
        }
    }
    triggerTypeSelect.options.selectedIndex = 0;
    triggerTypeSelect.dispatchEvent(new Event("change"));
}

function addNotificationTempTriggerType() {
    const notificationEditor = document.getElementById(notificationEditorId);
    if (!notificationEditor) return;
    const triggerTypeSelect = notificationEditor.querySelector("#trigger-type");
    const settings = loadCustomSettings();

    const hasTemperature = Array.from(triggerTypeSelect.options).some(opt => opt.value === "temperature");

    if (settings.weatherWidget.showWeather && !hasTemperature) {
        const option = document.createElement("option");
        option.value = "temperature";
        option.textContent = "🌡️ Temperature";
        triggerTypeSelect.add(option);
    }
}

function createNotificationEditor() {
    const container = document.createElement("div");
    container.id = notificationEditorId;

    container.innerHTML = `
        <div class="notif-editor-header">
            <h2 id="drag-handle">🔔 Notification Editor</h2>
            <button id="notifications-list-btn" class="notification-header-button">▤</button>
            <button id="close-editor-btn" class="notification-header-button">✖</button>
        </div>
        <label for="trigger-type" class="has-tooltip"
        data-tooltip="Defines what triggers the notification.\n\nExample:
        1. Send a notification with your chosen Title and Body at 12:00.
        2. Trigger notification when visiting a specific website with your Title and Body.
        3. Trigger notification after 5 minutes, etc.">Trigger Type:</label>
        <select id="trigger-type">
            <option value="time">⏰ Time</option>
            <option value="url">🌐 URL Visit</option>
            <option value="timer">⏳ Timer</option>
        </select>

        <div id="trigger-config"></div>

        <label for="notif-titley" class="has-tooltip"
        data-tooltip="The headline of the notification.">Title:</label>
        <input type="text" id="notif-title">

        <label for="notif-body" class="has-tooltip"
        data-tooltip="The main text content of the notification.">Body:</label>
        <textarea id="notif-body"></textarea>

        <label for="notif-link" class="has-tooltip"
        data-tooltip="If you want the notification to open a website when clicked, enter the URL here.">Link:</label>
        <input type="text" id="notif-link">

        <button id="preview-button">👁️ Preview</button>
        <button id="save-button">💾 Save</button>
    `;

    document.body.appendChild(container);

    const closeEditorButton = container.querySelector("#close-editor-btn");
    closeEditorButton.addEventListener("click", () => {
        container.classList.add("hidden");
    });

    const listBtn = container.querySelector("#notifications-list-btn");
    listBtn.addEventListener("click", () => {
        showNotificationList(container);
    });

    // Trigger config logic
    const triggerTypeSelect = container.querySelector("#trigger-type");
    addNotificationTempTriggerType();

    const triggerConfigDiv = container.querySelector("#trigger-config");

    triggerTypeSelect.addEventListener("change", () => {
        const type = triggerTypeSelect.value;
        triggerConfigDiv.innerHTML = "";

        if (type === "time") {
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip"
                data-tooltip="If you want to set a notification to appear at a specific time, enter the time you need.\n
                For example, at 13:30 a notification will appear with the specified Title and Body text.">Set Time:</label>
                <input type="time" step="60" id="trigger-time">
            `;
        } else if (type === "temperature") {
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip"
                data-tooltip="If you want to set a notification to appear at a specific temperature, enter the desired temperature.\n
                For example, at +13 a notification will appear with the specified Title and Body text.">Temperature (°C):</label>
                <input type="number" step="1" min="-100" max="100" id="trigger-temp">
            `;
        } else if (type === "url") {
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip"
                data-tooltip="If you want to trigger a notification when visiting a website, enter part of the URL or the full URL.\n
                For example, https://google.com — then, when you visit google.com, you will receive a notification with your Title and Body.">URL Contains:</label>
                <input type="text" id="trigger-url">
            `;
        } else if (type === "timer") {
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip"
                data-tooltip="If you want to set a notification to appear after a specific timer, select the units and the duration you need.\n
                For example, if you choose 15 minutes, then after 15 minutes a notification will appear with the specified Title and Body text.">Notify After:</label>
                <div class="timer-picker">
                    <input type="number" id="trigger-timer" min="1" max="999" value="10">
                    <div class="timer-units">
                        <button data-unit="seconds" class="unit-button active">sec</button>
                        <button data-unit="minutes" class="unit-button">min</button>
                        <button data-unit="hours" class="unit-button">hr</button>
                    </div>
                </div>
            `;
        }
    });

    triggerTypeSelect.dispatchEvent(new Event("change"));

    let selectedUnit = "seconds";
    triggerConfigDiv.addEventListener("click", (e) => {
        const btn = e.target.closest(".unit-button");
        if (!btn) return;

        selectedUnit = btn.dataset.unit;

        triggerConfigDiv.querySelectorAll(".unit-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });


    container.addEventListener("wheel", (e) => {
        const input = e.target.closest('input[type="number"]');
        if (input) {
            e.preventDefault();
            const step = parseFloat(input.step) || 1;
            const delta = e.deltaY < 0 ? step : -step;
            let newValue = parseFloat(input.value || 0) + delta;
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            if (!isNaN(min)) newValue = Math.max(newValue, min);
            if (!isNaN(max)) newValue = Math.min(newValue, max);
            input.value = newValue;
            input.dispatchEvent(new Event("input")); // если нужно отловить изменение
        }
    }, {passive: false});

    container.querySelector("#preview-button").addEventListener("click", () => {
        const title = container.querySelector("#notif-title").value;
        const body = container.querySelector("#notif-body").value;
        const link = container.querySelector("#notif-link").value;
        showNotification(title, body, link);
    });

    container.querySelector("#save-button").addEventListener("click", async () => {
        const type = triggerTypeSelect.value;
        const settings = loadCustomSettings();
        if (type === "temperature" && !settings.weatherWidget.showWeather) {
            alert("Warning!\nPlease choose a different trigger type and reload this page\nbecause the weather widget is turned off,\nor enable the weather widget to use the temperature trigger!")
            return;
        }

        const title = container.querySelector("#notif-title").value;
        const body = container.querySelector("#notif-body").value;
        const link = container.querySelector("#notif-link").value;

        let triggerData = {};
        if (type === "time") {
            triggerData.time = container.querySelector("#trigger-time").value;
        } else if (type === "temperature") {
            triggerData.temp = parseFloat(container.querySelector("#trigger-temp").value);
        } else if (type === "url") {
            triggerData.url = container.querySelector("#trigger-url").value;
        } else if (type === "timer") {
            const value = parseInt(container.querySelector("#trigger-timer").value);
            const now = Date.now();
            let delayMs = value * 1000;
            if (selectedUnit === "minutes") delayMs = value * 60 * 1000;
            if (selectedUnit === "hours") delayMs = value * 60 * 60 * 1000;
            triggerData.triggerAt = now + delayMs;
        }

        const notification = {
            type,
            title,
            body,
            link,
            triggerData
        };

        await saveNotification(notification);
    });

    makeContainerDraggable(container);
}

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

addCustomNotificationButton?.addEventListener("click", () => {
    const editorContainer = document.getElementById(notificationEditorId);
    if (!editorContainer) {
        createNotificationEditor();
    } else {
        editorContainer.classList.remove("hidden");
    }
});
