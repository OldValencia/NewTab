const timeAndDateControlsContainer = document.getElementById("time-and-date-controls");
const addClockButton = document.getElementById("add-clock");

function loadTimeAndDate(settings) {
    if (!settings.timeAndDateElements) {
        settings.timeAndDateElements = 1;
        saveCustomSettings(settings);
    }
    if (!settings.clocks) {
        settings.clocks = [];
    }

    // Clear container
    timeAndDateControlsContainer.innerHTML = "";
    // Render controls for each clock
    for (let i = 0; i < settings.timeAndDateElements; i++) {
        const element = document.createElement("div");
        element.className = `time-and-date-wrapper`;
        element.style.position = "relative";
        if (i === 0) {
            element.style.borderTopLeftRadius = "6px";
            element.style.borderTopRightRadius = "6px";
        }
        // Build controls
        const timezoneOptions = [
            { value: "-12", label: "UTC-12 (Baker Island)" },
            { value: "-11", label: "UTC-11 (Pago Pago, Niue)" },
            { value: "-10", label: "UTC-10 (Honolulu, Papeete)" },
            { value: "-9", label: "UTC-9 (Anchorage, Gambier Islands)" },
            { value: "-8", label: "UTC-8 (Los Angeles, Vancouver)" },
            { value: "-7", label: "UTC-7 (Denver, Phoenix)" },
            { value: "-6", label: "UTC-6 (Mexico City, Chicago, Guatemala)" },
            { value: "-5", label: "UTC-5 (New York, Lima, Toronto)" },
            { value: "-4", label: "UTC-4 (Santiago, Caracas, La Paz)" },
            { value: "-3", label: "UTC-3 (Buenos Aires, São Paulo, Montevideo)" },
            { value: "-2", label: "UTC-2 (South Georgia)" },
            { value: "-1", label: "UTC-1 (Azores, Cape Verde)" },
            { value: "0", label: "UTC±0 (London, Lisbon, Accra)" },
            { value: "+1", label: "UTC+1 (Berlin, Lagos, Rome)" },
            { value: "+2", label: "UTC+2 (Cairo, Johannesburg, Athens)" },
            { value: "+3", label: "UTC+3 (Moscow, Nairobi, Baghdad)" },
            { value: "+4", label: "UTC+4 (Dubai, Baku, Samara)" },
            { value: "+5", label: "UTC+5 (Tashkent, Karachi, Yekaterinburg)" },
            { value: "+6", label: "UTC+6 (Dhaka, Omsk, Almaty)" },
            { value: "+7", label: "UTC+7 (Bangkok, Krasnoyarsk, Jakarta)" },
            { value: "+8", label: "UTC+8 (Beijing, Perth, Irkutsk)" },
            { value: "+9", label: "UTC+9 (Tokyo, Seoul, Yakutsk)" },
            { value: "+10", label: "UTC+10 (Sydney, Vladivostok, Guam)" },
            { value: "+11", label: "UTC+11 (Magadan, Solomon Islands, Nouméa)" },
            { value: "+12", label: "UTC+12 (Auckland, Fiji, Kamchatka)" },
            { value: "+13", label: "UTC+13 (Samoa, Tonga)" },
            { value: "+14", label: "UTC+14 (Kiritimati)" }
        ];
        element.innerHTML = `
            <button class="remove-element" data-index="${i}">✖</button>
            <div class="font-control">
                <label>Time:</label>
                <select id="time-font-${i}">
                    <option value="Arial">Arial (default)</option>
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Lucida Sans">Lucida Sans</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Fira Sans">Fira Sans</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Quicksand">Quicksand</option>
                    <option value="Monaco">Monaco</option>
                </select>
                <input type="color" id="time-color-${i}">
            </div>
            <div class="font-control">
                <label>Date:</label>
                <select id="date-font-${i}">
                    <option value="Arial">Arial (default)</option>
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Lucida Sans">Lucida Sans</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Fira Sans">Fira Sans</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Quicksand">Quicksand</option>
                    <option value="Monaco">Monaco</option>
                </select>
                <input type="color" id="date-color-${i}">
            </div>
            <div class="format-control">
                <label>Time format:</label>
                <select id="time-format-${i}">
                    <option value="24">24-hour</option>
                    <option value="12">12-hour (AM/PM)</option>
                    <option value="arabic">Arabic (١٢:٣٤)</option>
                    <option value="hebrew">Hebrew (12:34)</option>
                    <option value="chinese">Chinese (下午1:45)</option>
                    <option value="japanese">Japanese (13時45分)</option>
                    <option value="custom">Custom (locale-based)</option>
                </select>
            </div>
            <div class="format-control">
                <label>Timezone:</label>
                <select id="timezone-${i}">
                    <option value="local">Local</option>
                    ${timezoneOptions.map(tz => `<option value="${tz.value}">${tz.label}</option>`).join('')}
                </select>
            </div>
            <div class="format-control">
                <label>Date format:</label>
                <select id="date-format-${i}">
                    <option value="month-day-year">July 20 2025</option>
                    <option value="day-month-year">20 July 2025</option>
                    <option value="year-month-day">2025 July 20</option>
                    <option value="dd-mm-yyyy">20-07-2025</option>
                    <option value="mm-dd-yyyy">07-20-2025</option>
                </select>
            </div>`;
        timeAndDateControlsContainer.appendChild(element);
    }
    // Attach event listeners for each clock
    const wrappers = timeAndDateControlsContainer.querySelectorAll('.time-and-date-wrapper');
    for (let i = 0; i < wrappers.length; i++) {
        const wrapper = wrappers[i];
        const timeFontSelect = wrapper.querySelector(`#time-font-${i}`);
        const timeColorInput = wrapper.querySelector(`#time-color-${i}`);
        const dateFontSelect = wrapper.querySelector(`#date-font-${i}`);
        const dateColorInput = wrapper.querySelector(`#date-color-${i}`);
        const timeFormatSelect = wrapper.querySelector(`#time-format-${i}`);
        const dateFormatSelect = wrapper.querySelector(`#date-format-${i}`);
        const timezoneSelect = wrapper.querySelector(`#timezone-${i}`);
        const removeElementBtn = wrapper.querySelector('.remove-element');
        // Load settings for each clock
        if (!settings.clocks) {
            settings.clocks = [];
            saveCustomSettings(settings);

        }

        if (!settings.clocks[i]) {
            settings.clocks[i] = {};
            saveCustomSettings(settings);
        }
        const clockSettings = settings.clocks[i];
        timeFontSelect.value = clockSettings.timeFont || defaultTimeAndDateFont;
        timeColorInput.value = clockSettings.timeColor || defaultTimeColor;
        dateFontSelect.value = clockSettings.dateFont || defaultTimeAndDateFont;
        dateColorInput.value = clockSettings.dateColor || defaultDateColor;
        timeFormatSelect.value = clockSettings.timeFormat || '24';
        timezoneSelect.value = clockSettings.timezone || 'local';
        dateFormatSelect.value = clockSettings.dateFormat || 'day-month-year';
        saveCustomSettings(settings);

        // Save changes
        timeFontSelect.addEventListener("change", (e) => {
            const settings = loadCustomSettings();
            const clockSettings = settings.clocks[i];
            clockSettings.timeFont = e.target.value;
            saveCustomSettings(settings);
            updateTime();
        });
        timeColorInput.addEventListener("input", (e) => {
            const settings = loadCustomSettings();
            const clockSettings = settings.clocks[i];
            clockSettings.timeColor = e.target.value;
            saveCustomSettings(settings);
            updateTime();
        });
        dateFontSelect.addEventListener("change", (e) => {
            const settings = loadCustomSettings();
            const clockSettings = settings.clocks[i];
            clockSettings.dateFont = e.target.value;
            saveCustomSettings(settings);
            updateTime();
        });
        dateColorInput.addEventListener("input", (e) => {
            const settings = loadCustomSettings();
            const clockSettings = settings.clocks[i];
            clockSettings.dateColor = e.target.value;
            saveCustomSettings(settings);
            updateTime();
        });
        timeFormatSelect.addEventListener("change", (e) => {
            const settings = loadCustomSettings();
            const clockSettings = settings.clocks[i];
            clockSettings.timeFormat = e.target.value;
            saveCustomSettings(settings);
            updateTime();
        });
        timezoneSelect.addEventListener("change", (e) => {
            const settings = loadCustomSettings();
            const clockSettings = settings.clocks[i];
            clockSettings.timezone = e.target.value;
            saveCustomSettings(settings);
            updateTime();
        });
        dateFormatSelect.addEventListener("change", (e) => {
            const settings = loadCustomSettings();
            const clockSettings = settings.clocks[i];
            clockSettings.dateFormat = e.target.value;
            saveCustomSettings(settings);
            updateTime();
        });
        removeElementBtn.addEventListener("click", () => {
            const settings = loadCustomSettings();
            if (timeAndDateControlsContainer.childNodes.length > 1) {
                settings.clocks.splice(i, 1);
                settings.timeAndDateElements--;
                saveCustomSettings(settings);
                loadTimeAndDate(settings);
                updateTime();
            }
        });
    }
}

addClockButton.addEventListener("click", () => {
    const settings = loadCustomSettings();
    if (!settings.timeAndDateElements) settings.timeAndDateElements = 1;
    if (settings.timeAndDateElements < 3) {
        settings.timeAndDateElements++;
        saveCustomSettings(settings);
        loadTimeAndDate(settings);
        updateTime();
    }
});

document.getElementById("reset-time-date").addEventListener("click", () => {
    const settings = loadCustomSettings();
    settings.timeAndDateElements = 1;
    settings.clocks = [{
        timeFont: defaultTimeAndDateFont,
        timeColor: defaultTimeColor,
        dateFont: defaultTimeAndDateFont,
        dateColor: defaultDateColor,
        timeFormat: '24',
        dateFormat: 'day-month-year'
    }];
    saveCustomSettings(settings);
    loadTimeAndDate(settings);
    updateTime();
});