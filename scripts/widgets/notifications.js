const addCustomNotificationButton = document.getElementById("add-custom-notification");
const notificationEditorId = "notif-editor";

function saveNotification(notification) {
    browser.storage.local.get("customNotifications").then(result => {
        const notifications = result.customNotifications || [];
        notifications.push(notification);
        browser.storage.local.set({customNotifications: notifications}).then(async () => {
            const settings = loadCustomSettings();
            alert(await getLocalizationByKey("notification_saved_alert_message", settings.locale));
            resetChecker();
        });
    });
}

async function showNotificationList(editorContainer) {
    const listContainer = document.createElement("div");
    listContainer.id = notificationEditorId;
    listContainer.classList.add("notification-list-mode");

    listContainer.style.top = editorContainer.style.top || "100px";
    listContainer.style.left = editorContainer.style.left || "100px";

    listContainer.innerHTML = `
        <div class="notif-editor-header">
            <h2 id="drag-handle" data-value-localization-key="saved_notifications_header_h2_text">📋 Saved Notifications</h2>
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
    const settings = loadCustomSettings();

    const notifEmptyText = await getLocalizationByKey("saved_notifications_no_notifications_text", settings.locale);
    const notifTitleNoText = await getLocalizationByKey("saved_notifications_no_title_text", settings.locale);
    const notifBodyNoText = await getLocalizationByKey("saved_notifications_no_text_text", settings.locale);
    const notifMetaTypeText = await getLocalizationByKey("saved_notifications_meta_type_text", settings.locale);
    const notifMetaActiveText = await getLocalizationByKey("saved_notifications_meta_active_text", settings.locale);
    const notifMetaRepeatableText = await getLocalizationByKey("saved_notifications_meta_repeatable_text", settings.locale);
    const notifMetaYes = await getLocalizationByKey("modal_confirm_yes_button_html_default", settings.locale);
    const notifMetaNo = await getLocalizationByKey("modal_confirm_no_button_html_default", settings.locale);
    const notificationButtonDeactivateText = await getLocalizationByKey("saved_notifications_deactivate_button_text", settings.locale);
    const notificationButtonActivateText = await getLocalizationByKey("saved_notifications_activate_button_text", settings.locale);

    browser.storage.local.get("customNotifications").then(result => {
        const notifications = result.customNotifications || [];

        if (notifications.length === 0) {
            listDiv.innerHTML = `<p class="notif-empty">${notifEmptyText}</p>`;
            return;
        }

        notifications.forEach((notif, index) => {
            const item = document.createElement("div");
            item.className = "notif-list-item";

            const titleEl = document.createElement("strong");
            titleEl.className = "notif-title";
            titleEl.textContent = notif.title || notifTitleNoText;

            const bodyEl = document.createElement("p");
            bodyEl.className = "notif-body";
            bodyEl.textContent = notif.body || notifBodyNoText;

            const metaEl = document.createElement("div");
            metaEl.className = "notif-meta";
            metaEl.textContent = `${notifMetaTypeText} ${notif.type}, ${notifMetaActiveText} ${notif.active ? notifMetaYes : notifMetaNo}, ${notifMetaRepeatableText} ${notif.repeatable ? notifMetaYes : notifMetaNo}`;

            const activateBtn = document.createElement("button");
            activateBtn.className = "make-active-notif-btn";
            activateBtn.textContent = notifications[index].active ? notificationButtonDeactivateText : notificationButtonActivateText;
            activateBtn.style.background = notifications[index].active ? "linear-gradient(135deg, #d9534f, #ff6b6b)" : "linear-gradient(135deg, #28a745, #5cd67a)";
            activateBtn.addEventListener("click", () => {
                notifications[index].active = !notifications[index].active;
                browser.storage.local.set({customNotifications: notifications}).then(() => {
                    listContainer.remove();
                    showNotificationList(editorContainer);
                });
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-notif-btn";
            deleteBtn.textContent = "🗑️ Delete";
            deleteBtn.setAttribute("data-value-localization-key", "saved_notifications_delete_button_text");
            deleteBtn.addEventListener("click", () => {
                notifications.splice(index, 1);
                browser.storage.local.set({customNotifications: notifications}).then(() => {
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

    applyLocalization(settings.locale);
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

async function addNotificationTempTriggerType() {
    const notificationEditor = document.getElementById(notificationEditorId);
    if (!notificationEditor) return;
    const triggerTypeSelect = notificationEditor.querySelector("#trigger-type");
    const settings = loadCustomSettings();

    const hasTemperature = Array.from(triggerTypeSelect.options).some(opt => opt.value === "temperature");

    if (settings.weatherWidget.showWeather && !hasTemperature) {
        const option = document.createElement("option");
        option.value = "temperature";
        option.textContent = "🌡️ Temperature";
        option.setAttribute("data-value-localization-key", "notifications_trigger_type_temperature_option");
        triggerTypeSelect.add(option);
    }
}

async function createNotificationEditor() {
    const container = document.createElement("div");
    const settings = loadCustomSettings();
    container.id = notificationEditorId;

    const repeatableTooltip = await getLocalizationByKey("notifications_editor_repeatable_label_tooltip", settings.locale);
    const triggerTypeTooltip = await getLocalizationByKey("notifications_trigger_type_label_tooltip", settings.locale);
    const titleLabelTooltip = await getLocalizationByKey("notifications_editor_title_label_tooltip", settings.locale);
    const bodyLabelTooltip = await getLocalizationByKey("notifications_editor_body_label_tooltip", settings.locale);
    const linkLabelTooltip = await getLocalizationByKey("notifications_editor_link_label_tooltip", settings.locale);
    container.innerHTML = `
        <div class="notif-editor-header">
            <h2 id="drag-handle" data-value-localization-key="notifications_editor_header_title_h2_text">🔔 Notification Editor</h2>
            <button id="notifications-list-btn" class="notification-header-button">▤</button>
            <button id="close-editor-btn" class="notification-header-button">✖</button>
        </div>
        
        <div class="trigger-row">
            <div class="repeatable-toggle">
                <label for="notif-repeatable" class="has-tooltip" data-value-localization-key="notifications_editor_repeatable_label_text"
                data-tooltip="${repeatableTooltip}">Repeatable notification:</label>
                <label class="switch">
                    <input type="checkbox" id="notif-repeatable">
                    <span class="slider"></span>
                </label>
            </div>
        
            <div class="trigger-type-select">
                <label for="trigger-type" class="has-tooltip" data-value-localization-key="notifications_trigger_type_label_text"
                data-tooltip="${triggerTypeTooltip}">Trigger Type:</label>
                <select id="trigger-type">
                    <option value="time" data-value-localization-key="notifications_trigger_type_time_option">
                        ⏰ Time
                    </option>
                    <option value="url" data-value-localization-key="notifications_trigger_type_url_visit_option">
                        🌐 URL Visit
                    </option>
                    <option value="timer" data-value-localization-key="notifications_trigger_type_timer_option">
                        ⏳ Timer
                    </option>
                </select>
            </div>
        </div>

        <div id="trigger-config"></div>

        <label for="notif-titley" class="has-tooltip" data-value-localization-key="notifications_editor_title_label_text"
        data-tooltip="${titleLabelTooltip}">Notification title:</label>
        <input type="text" id="notif-title">

        <label for="notif-body" class="has-tooltip" data-value-localization-key="notifications_editor_body_label_text"
        data-tooltip="${bodyLabelTooltip}">Notification content:</label>
        <textarea id="notif-body"></textarea>

        <label for="notif-link" class="has-tooltip" data-value-localization-key="notifications_editor_link_label_text"
        data-tooltip="${linkLabelTooltip}">Link (optional):</label>
        <input type="text" id="notif-link">

        <button id="preview-button" data-value-localization-key="notifications_editor_preview_button_text">👁️ Preview</button>
        <button id="save-button" data-value-localization-key="notifications_editor_save_button_text">💾 Save</button>
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
    await addNotificationTempTriggerType();

    const triggerConfigDiv = container.querySelector("#trigger-config");

    triggerTypeSelect.addEventListener("change", async () => {
        const type = triggerTypeSelect.value;
        const settings = loadCustomSettings();
        triggerConfigDiv.innerHTML = "";

        if (type === "time") {
            const tooltipText = await getLocalizationByKey("timer_trigger_label_set_time_tooltip", settings.locale);
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip" data-value-localization-key="timer_trigger_label_set_time_text"
                data-tooltip="${tooltipText}">Set Time:</label>
                <input type="time" step="60" id="trigger-time">
            `;
        } else if (type === "temperature") {
            const tooltipText = await getLocalizationByKey("timer_trigger_label_temperature_tooltip", settings.locale);
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip" data-value-localization-key="timer_trigger_label_temperature_text"
                data-tooltip="${tooltipText}">Temperature (°C):</label>
                <input type="number" step="1" min="-100" max="100" id="trigger-temp">
            `;
        } else if (type === "url") {
            const tooltipText = await getLocalizationByKey("timer_trigger_label_url_contains_tooltip", settings.locale);
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip" data-value-localization-key="timer_trigger_label_url_contains_text"
                data-tooltip="${tooltipText}">URL Contains:</label>
                <input type="text" id="trigger-url">
            `;
        } else if (type === "timer") {
            const tooltipText = await getLocalizationByKey("timer_trigger_label_notify_after_tooltip", settings.locale);
            triggerConfigDiv.innerHTML = `
                <label class="has-tooltip" data-value-localization-key="timer_trigger_label_notify_after_text"
                data-tooltip="${tooltipText}">Notify After:</label>
                <div class="timer-picker">
                    <input type="number" id="trigger-timer" min="1" max="999" value="10">
                    <div class="timer-units">
                        <button data-unit="seconds" class="unit-button active" data-value-localization-key="timer_trigger_type_option_sec">sec</button>
                        <button data-unit="minutes" class="unit-button" data-value-localization-key="timer_trigger_type_option_min">min</button>
                        <button data-unit="hours" class="unit-button" data-value-localization-key="timer_trigger_type_option_hour">hr</button>
                    </div>
                </div>
            `;
        }

        applyLocalization(settings.locale);
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
            input.dispatchEvent(new Event("input"));
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
            const settings = loadCustomSettings();
            alert(await getLocalizationByKey("warning_alert_choose_different_trigger_type", settings.locale));
            return;
        }

        const title = container.querySelector("#notif-title").value;
        const body = container.querySelector("#notif-body").value;
        const link = container.querySelector("#notif-link").value;
        const repeatable = container.querySelector("#notif-repeatable").checked;

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
            triggerData,
            repeatable
        };

        await saveNotification(notification);
    });

    makeContainerDraggable(container);
    applyLocalization(settings.locale);
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

addCustomNotificationButton?.addEventListener("click", async () => {
    const editorContainer = document.getElementById(notificationEditorId);
    if (!editorContainer) {
        await createNotificationEditor();
    } else {
        editorContainer.classList.remove("hidden");
    }
});

async function checkTemperatureNotifications(currentTemperature) {
    const result = await browser.storage.local.get("customNotifications");
    const notifications = result.customNotifications || [];
    const now = Date.now();

    const isNotificationsEnabled = async () => {
        const result = await browser.storage.local.get("isNotificationsEnabled");
        return result.isNotificationsEnabled || false;
    }
    if (!await isNotificationsEnabled()) return;

    for (const notif of notifications) {
        const {type, title, body, link, triggerData} = notif;

        if (type === "temperature" &&
            typeof triggerData.temp === "number" &&
            currentTemperature >= triggerData.temp &&
            notif.active !== false &&
            (!notif.lastTriggeredAt || now - notif.lastTriggeredAt > 5000)) {

            showNotification(title, body, link);
            if (notif.repeatable !== true) {
                notif.active = false;
            }
            notif.lastTriggeredAt = now;
        }
    }

    await browser.storage.local.set({customNotifications: notifications});
}
