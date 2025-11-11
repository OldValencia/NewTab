const timeAndDateControlsContainer = document.getElementById("time-and-date-controls");
const addClockButton = document.getElementById("add-clock");
const defaultTimeFormat = "24";
const defaultDateFormat = "day-month-year";
const defaultTimezone = "local";
const timezoneLabels = {
    en: [
        "UTC-12 (Baker Island)",
        "UTC-11 (Pago Pago, Niue)",
        "UTC-10 (Honolulu, Papeete)",
        "UTC-9 (Anchorage, Gambier Islands)",
        "UTC-8 (Los Angeles, Vancouver)",
        "UTC-7 (Denver, Phoenix)",
        "UTC-6 (Mexico City, Chicago, Guatemala)",
        "UTC-5 (New York, Lima, Toronto)",
        "UTC-4 (Santiago, Caracas, La Paz)",
        "UTC-3 (Buenos Aires, São Paulo, Montevideo)",
        "UTC-2 (South Georgia)",
        "UTC-1 (Azores, Cape Verde)",
        "UTC±0 (London, Lisbon, Accra)",
        "UTC+1 (Berlin, Lagos, Rome)",
        "UTC+2 (Cairo, Johannesburg, Athens)",
        "UTC+3 (Moscow, Nairobi, Baghdad)",
        "UTC+4 (Dubai, Baku, Samara)",
        "UTC+5 (Tashkent, Karachi, Yekaterinburg)",
        "UTC+6 (Dhaka, Omsk, Almaty)",
        "UTC+7 (Bangkok, Krasnoyarsk, Jakarta)",
        "UTC+8 (Beijing, Perth, Irkutsk)",
        "UTC+9 (Tokyo, Seoul, Yakutsk)",
        "UTC+10 (Sydney, Vladivostok, Guam)",
        "UTC+11 (Magadan, Solomon Islands, Nouméa)",
        "UTC+12 (Auckland, Fiji, Kamchatka)",
        "UTC+13 (Samoa, Tonga)",
        "UTC+14 (Kiritimati)"
    ],
    ru: [
        "UTC-12 (Остров Бейкер)",
        "UTC-11 (Паго-Паго, Ниуэ)",
        "UTC-10 (Гонолулу, Папеэте)",
        "UTC-9 (Анкоридж, острова Гамбье)",
        "UTC-8 (Лос-Анджелес, Ванкувер)",
        "UTC-7 (Денвер, Финикс)",
        "UTC-6 (Мехико, Чикаго, Гватемала)",
        "UTC-5 (Нью-Йорк, Лима, Торонто)",
        "UTC-4 (Сантьяго, Каракас, Ла-Пас)",
        "UTC-3 (Буэнос-Айрес, Сан-Паулу, Монтевидео)",
        "UTC-2 (Южная Георгия)",
        "UTC-1 (Азорские острова, Кабо-Верде)",
        "UTC±0 (Лондон, Лиссабон, Аккра)",
        "UTC+1 (Берлин, Лагос, Рим)",
        "UTC+2 (Каир, Йоханнесбург, Афины)",
        "UTC+3 (Москва, Найроби, Багдад)",
        "UTC+4 (Дубай, Баку, Самара)",
        "UTC+5 (Ташкент, Карачи, Екатеринбург)",
        "UTC+6 (Дакка, Омск, Алматы)",
        "UTC+7 (Бангкок, Красноярск, Джакарта)",
        "UTC+8 (Пекин, Перт, Иркутск)",
        "UTC+9 (Токио, Сеул, Якутск)",
        "UTC+10 (Сидней, Владивосток, Гуам)",
        "UTC+11 (Магадан, Соломоновы острова, Нумеа)",
        "UTC+12 (Окленд, Фиджи, Камчатка)",
        "UTC+13 (Самоа, Тонга)",
        "UTC+14 (Остров Киритимати)"
    ],
    pl: [
        "UTC-12 (Wyspa Baker)",
        "UTC-11 (Pago Pago, Niue)",
        "UTC-10 (Honolulu, Papeete)",
        "UTC-9 (Anchorage, Wyspy Gambiera)",
        "UTC-8 (Los Angeles, Vancouver)",
        "UTC-7 (Denver, Phoenix)",
        "UTC-6 (Meksyk, Chicago, Gwatemala)",
        "UTC-5 (Nowy Jork, Lima, Toronto)",
        "UTC-4 (Santiago, Caracas, La Paz)",
        "UTC-3 (Buenos Aires, São Paulo, Montevideo)",
        "UTC-2 (Georgia Południowa)",
        "UTC-1 (Azory, Zielony Przylądek)",
        "UTC±0 (Londyn, Lizbona, Akra)",
        "UTC+1 (Berlin, Lagos, Rzym)",
        "UTC+2 (Kair, Johannesburg, Ateny)",
        "UTC+3 (Moskwa, Nairobi, Bagdad)",
        "UTC+4 (Dubaj, Baku, Samara)",
        "UTC+5 (Taszkent, Karaczi, Jekaterynburg)",
        "UTC+6 (Dhaka, Omsk, Ałmaty)",
        "UTC+7 (Bangkok, Krasnojarsk, Dżakarta)",
        "UTC+8 (Pekin, Perth, Irkuck)",
        "UTC+9 (Tokio, Seul, Jakuck)",
        "UTC+10 (Sydney, Władywostok, Guam)",
        "UTC+11 (Magadan, Wyspy Salomona, Nouméa)",
        "UTC+12 (Auckland, Fidżi, Kamczatka)",
        "UTC+13 (Samoa, Tonga)",
        "UTC+14 (Kiritimati)"
    ],
    de: [
        "UTC-12 (Bakerinsel)",
        "UTC-11 (Pago Pago, Niue)",
        "UTC-10 (Honolulu, Papeete)",
        "UTC-9 (Anchorage, Gambierinseln)",
        "UTC-8 (Los Angeles, Vancouver)",
        "UTC-7 (Denver, Phoenix)",
        "UTC-6 (Mexiko-Stadt, Chicago, Guatemala)",
        "UTC-5 (New York, Lima, Toronto)",
        "UTC-4 (Santiago, Caracas, La Paz)",
        "UTC-3 (Buenos Aires, São Paulo, Montevideo)",
        "UTC-2 (Südgeorgien)",
        "UTC-1 (Azoren, Kap Verde)",
        "UTC±0 (London, Lissabon, Accra)",
        "UTC+1 (Berlin, Lagos, Rom)",
        "UTC+2 (Kairo, Johannesburg, Athen)",
        "UTC+3 (Moskau, Nairobi, Bagdad)",
        "UTC+4 (Dubai, Baku, Samara)",
        "UTC+5 (Taschkent, Karatschi, Jekaterinburg)",
        "UTC+6 (Dhaka, Omsk, Almaty)",
        "UTC+7 (Bangkok, Krasnojarsk, Jakarta)",
        "UTC+8 (Peking, Perth, Irkutsk)",
        "UTC+9 (Tokio, Seoul, Jakutsk)",
        "UTC+10 (Sydney, Wladiwostok, Guam)",
        "UTC+11 (Magadan, Salomonen, Nouméa)",
        "UTC+12 (Auckland, Fidschi, Kamtschatka)",
        "UTC+13 (Samoa, Tonga)",
        "UTC+14 (Kiritimati)"
    ],
    es: [
        "UTC-12 (Isla Baker)",
        "UTC-11 (Pago Pago, Niue)",
        "UTC-10 (Honolulu, Papeete)",
        "UTC-9 (Anchorage, Islas Gambier)",
        "UTC-8 (Los Ángeles, Vancouver)",
        "UTC-7 (Denver, Phoenix)",
        "UTC-6 (Ciudad de México, Chicago, Guatemala)",
        "UTC-5 (Nueva York, Lima, Toronto)",
        "UTC-4 (Santiago, Caracas, La Paz)",
        "UTC-3 (Buenos Aires, São Paulo, Montevideo)",
        "UTC-2 (Georgia del Sur)",
        "UTC-1 (Azores, Cabo Verde)",
        "UTC±0 (Londres, Lisboa, Acra)",
        "UTC+1 (Berlín, Lagos, Roma)",
        "UTC+2 (El Cairo, Johannesburgo, Atenas)",
        "UTC+3 (Moscú, Nairobi, Bagdad)",
        "UTC+4 (Dubái, Bakú, Samara)",
        "UTC+5 (Taskent, Karachi, Ekaterimburgo)",
        "UTC+6 (Daca, Omsk, Almaty)",
        "UTC+7 (Bangkok, Krasnoyarsk, Yakarta)",
        "UTC+8 (Pekín, Perth, Irkutsk)",
        "UTC+9 (Tokio, Seúl, Yakutsk)",
        "UTC+10 (Sídney, Vladivostok, Guam)",
        "UTC+11 (Magadán, Islas Salomón, Nouméa)",
        "UTC+12 (Auckland, Fiyi, Kamchatka)",
        "UTC+13 (Samoa, Tonga)",
        "UTC+14 (Kiritimati)"
    ],
    be: [
        "UTC-12 (востраў Бэйкер)",
        "UTC-11 (Пага-Пага, Ніуэ)",
        "UTC-10 (Ганалулу, Папээтэ)",
        "UTC-9 (Анкарыдж, астравы Гамб'е)",
        "UTC-8 (Лос-Анджэлес, Ванкувер)",
        "UTC-7 (Дэнвер, Фінікс)",
        "UTC-6 (Мехіка, Чыкага, Гватэмала)",
        "UTC-5 (Нью-Ёрк, Ліма, Таронта)",
        "UTC-4 (Сант’яга, Каракас, Ла-Пас)",
        "UTC-3 (Буэнас-Айрэс, Сан-Паўлу, Мантэвідэа)",
        "UTC-2 (Паўднёвая Георгія)",
        "UTC-1 (Азорскія астравы, Каба-Вердэ)",
        "UTC±0 (Лондан, Лісабон, Аккра)",
        "UTC+1 (Берлін, Лагас, Рым)",
        "UTC+2 (Каір, Ёханэсбург, Афіны)",
        "UTC+3 (Масква, Найробі, Багдад)",
        "UTC+4 (Дубай, Баку, Самара)",
        "UTC+5 (Ташкент, Карачы, Екацерынбург)",
        "UTC+6 (Дакка, Омск, Алматы)",
        "UTC+7 (Бангкок, Краснаярск, Джакарта)",
        "UTC+8 (Пекін, Перт, Іркуцк)",
        "UTC+9 (Токіа, Сеул, Якуцк)",
        "UTC+10 (Сіднэй, Уладзівасток, Гуам)",
        "UTC+11 (Магадан, Саламонавы астравы, Нумеа)",
        "UTC+12 (Окленд, Фіджы, Камчатка)",
        "UTC+13 (Самоа, Тонга)",
        "UTC+14 (Кірытыматы)"
    ],
    uk: [
        "UTC-12 (острів Бейкер)",
        "UTC-11 (Паго-Паго, Ніуе)",
        "UTC-10 (Гонолулу, Папеете)",
        "UTC-9 (Анкоридж, острови Гамб'є)",
        "UTC-8 (Лос-Анджелес, Ванкувер)",
        "UTC-7 (Денвер, Фінікс)",
        "UTC-6 (Мехіко, Чикаго, Гватемала)",
        "UTC-5 (Нью-Йорк, Ліма, Торонто)",
        "UTC-4 (Сантьяго, Каракас, Ла-Пас)",
        "UTC-3 (Буенос-Айрес, Сан-Паулу, Монтевідео)",
        "UTC-2 (Південна Джорджія)",
        "UTC-1 (Азорські острови, Кабо-Верде)",
        "UTC±0 (Лондон, Лісабон, Аккра)",
        "UTC+1 (Берлін, Лагос, Рим)",
        "UTC+2 (Каїр, Йоганнесбург, Афіни)",
        "UTC+3 (Москва, Найробі, Багдад)",
        "UTC+4 (Дубай, Баку, Самара)",
        "UTC+5 (Ташкент, Карачі, Єкатеринбург)",
        "UTC+6 (Дакка, Омськ, Алмати)",
        "UTC+7 (Бангкок, Красноярськ, Джакарта)",
        "UTC+8 (Пекін, Перт, Іркутськ)",
        "UTC+9 (Токіо, Сеул, Якутськ)",
        "UTC+10 (Сідней, Владивосток, Гуам)",
        "UTC+11 (Магадан, Соломонові острови, Нумеа)",
        "UTC+12 (Окленд, Фіджі, Камчатка)",
        "UTC+13 (Самоа, Тонга)",
        "UTC+14 (Кіритіматі)"
    ]
}

// Default shadow settings
const DEFAULT_SHADOW = {
    color: "#000000",
    opacity: 0,
    blur: 0,
    offsetX: 0,
    offsetY: 0
};

function getLocalizedTimezoneOptions(lang = defaultLocale) {
    const labels = timezoneLabels[lang] || timezoneLabels[defaultLocale];
    const values = [
        "-12", "-11", "-10", "-9", "-8", "-7", "-6", "-5", "-4", "-3", "-2", "-1",
        "0", "+1", "+2", "+3", "+4", "+5", "+6", "+7", "+8", "+9", "+10", "+11", "+12", "+13", "+14"
    ];

    return values.map((value, index) => ({
        value,
        label: labels[index]
    }));
}

async function loadTimeAndDate() {
    const settings = loadCustomSettings();

    // Clear container
    timeAndDateControlsContainer.innerHTML = "";

    toggleTime.checked = settings.bg[settings.bg.bgMode].customization.showTime;
    const timeElements = multipleClocksWrapper.querySelectorAll('.time');
    timeElements.forEach(time => {
        time.style.display = settings.bg[settings.bg.bgMode].customization.showTime ? "block" : "none";
    });

    toggleDate.checked = settings.bg[settings.bg.bgMode].customization.showDate;
    const dateElements = multipleClocksWrapper.querySelectorAll('.date');
    dateElements.forEach(date => {
        date.style.display = settings.bg[settings.bg.bgMode].customization.showDate ? "block" : "none";
    });
    // Render controls for each clock
    for (let i = 0; i < settings.bg[settings.bg.bgMode].customization.elements; i++) {
        const element = document.createElement("div");
        element.className = `time-and-date-wrapper`;
        element.style.position = "relative";
        if (i === 0) {
            element.style.borderTopLeftRadius = "6px";
            element.style.borderTopRightRadius = "6px";
        }
        element.innerHTML = `
            <button class="remove-element" data-index="${i}">✖</button>
            <div class="font-control">
                <label class="shadow-target-label time-label selected" data-shadow-target="time" data-value-localization-key="date_and_time_clocks_customization_time_label">Time:</label>
                <select id="time-font-${i}">
                    <option value="SF Pro Display" data-value-localization-key="option_sf_pro_display_default_label">SF Pro Display (default)</option>
                    <option value="Arial">Arial</option>
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
                <label class="shadow-target-label date-label" data-shadow-target="date" data-value-localization-key="date_and_time_clocks_customization_date_label">Date:</label>
                <select id="date-font-${i}">
                    <option value="SF Pro Display" data-value-localization-key="option_sf_pro_display_default_label">SF Pro Display (default)</option>
                    <option value="Arial">Arial</option>
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
            <div class="format-control clock-shadow-control">
                <label data-value-localization-key="date_and_time_clocks_customization_shadow_label">Shadow:</label>
                <div class="shadow-controls-row">
                    <div class="shadow-direction-grid" id="shadow-direction-grid-${i}">
                        <button type="button" class="shadow-dir-btn corner" disabled></button>
                        <button type="button" class="shadow-dir-btn" data-dir="up" title="Up">▲</button>
                        <button type="button" class="shadow-dir-btn corner" disabled></button>
                        <button type="button" class="shadow-dir-btn" data-dir="left" title="Left">◀</button>
                        <button type="button" class="shadow-dir-btn center" disabled><span id="shadow-offset-display-${i}"></span></button>
                        <button type="button" class="shadow-dir-btn" data-dir="right" title="Right">▶</button>
                        <button type="button" class="shadow-dir-btn corner" disabled></button>
                        <button type="button" class="shadow-dir-btn" data-dir="down" title="Down">▼</button>
                        <button type="button" class="shadow-dir-btn corner" disabled></button>
                    </div>
                    <div class="shadow-sliders">
                        <label class="shadow-slider-label" data-value-localization-key="date_and_time_clocks_customization_shadow_blur_label">
                            Blur:
                            <input type="range" min="0" max="20" step="1" id="shadow-blur-${i}">
                        </label>
                        <label class="shadow-slider-label" data-value-localization-key="date_and_time_clocks_customization_shadow_opacity_label">
                            Opacity:
                            <input type="range" min="0" max="1" step="0.01" id="shadow-opacity-${i}">
                        </label>
                        <label class="shadow-slider-label" data-value-localization-key="date_and_time_clocks_customization_shadow_color_label">
                            Color:
                            <input type="color" id="shadow-color-${i}">
                        </label>
                    </div>
                </div>
            </div>
            <div class="format-control">
                <label data-value-localization-key="date_and_time_clocks_customization_time_format_label">Time format:</label>
                <select id="time-format-${i}">
                    <option value="24" data-value-localization-key="date_and_time_clocks_customization_time_format_first_option">
                        24-hour
                    </option>
                    <option value="12" data-value-localization-key="date_and_time_clocks_customization_time_format_second_option">
                        12-hour (AM/PM)
                    </option>
                    <option value="arabic" data-value-localization-key="date_and_time_clocks_customization_time_format_third_option">
                        Arabic (١٢:٣٤)
                    </option>
                    <option value="chinese" data-value-localization-key="date_and_time_clocks_customization_time_format_fourth_option">
                        Chinese (下午1:45)
                    </option>
                    <option value="japanese" data-value-localization-key="date_and_time_clocks_customization_time_format_fifth_option">
                        Japanese (13時45分)
                    </option>
                    <option value="custom" data-value-localization-key="date_and_time_clocks_customization_time_format_sixth_option">
                        Custom (locale-based)
                    </option>
                </select>
            </div>
            <div class="format-control">
                <label data-value-localization-key="date_and_time_clocks_customization_timezone_label">Timezone:</label>
                <select id="timezone-${i}">
                    <option value="local" data-value-localization-key="date_and_time_clocks_customization_timezone_local_label_option">Local</option>
                    ${getLocalizedTimezoneOptions(settings.locale).map(tz => `<option value="${tz.value}">${tz.label}</option>`).join('')}
                </select>
            </div>
            <div class="format-control">
                <label data-value-localization-key="date_and_time_clocks_customization_date_format_label">Date format:</label>
                <select id="date-format-${i}">
                    <option value="month-day-year" data-value-localization-key="date_and_time_clocks_customization_date_format_first_option">
                        July 20 2025
                    </option>
                    <option value="day-month-year" data-value-localization-key="date_and_time_clocks_customization_date_format_second_option">
                        20 July 2025
                    </option>
                    <option value="year-month-day" data-value-localization-key="date_and_time_clocks_customization_date_format_third_option">
                        2025 July 20
                    </option>
                    <option value="dd-mm-yyyy">20-07-2025</option>
                    <option value="mm-dd-yyyy">07-20-2025</option>
                </select>
            </div>`;
        timeAndDateControlsContainer.appendChild(element);
    }
    // Attach event listeners for each clock
    const wrappers = timeAndDateControlsContainer.querySelectorAll('.time-and-date-wrapper');

    function addEventListenerFor(element, inputEventType, i, jsonVariable, defaultValue) {
        element.addEventListener(inputEventType, async e => {
            const settings = loadCustomSettings();
            const clockSettings = settings.bg[settings.bg.bgMode].customization.clocks[i];
            clockSettings[jsonVariable] = e.target.value;
            await saveCustomSettings(settings);
            updateTime();
        });
        element.addEventListener("contextmenu", async e => {
            e.preventDefault();
            const settings = loadCustomSettings();
            const clockSettings = settings.bg[settings.bg.bgMode].customization.clocks[i];
            clockSettings[jsonVariable] = defaultValue;
            element.value = clockSettings[jsonVariable];
            await saveCustomSettings(settings);
            updateTime();
        });
    }

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
        const shadowBlurInput = wrapper.querySelector(`#shadow-blur-${i}`);
        const shadowColorInput = wrapper.querySelector(`#shadow-color-${i}`);
        const shadowOpacityInput = wrapper.querySelector(`#shadow-opacity-${i}`);
        const shadowDirectionGrid = wrapper.querySelector(`#shadow-direction-grid-${i}`);
        const shadowDirBtns = shadowDirectionGrid.querySelectorAll('.shadow-dir-btn');
        const shadowOffsetDisplay = wrapper.querySelector(`#shadow-offset-display-${i}`);
        // Load settings for each clock
        if (!settings.bg[settings.bg.bgMode].customization.clocks[i]) {
            settings.bg[settings.bg.bgMode].customization.clocks[i] = (await getDefaultCustomizationByKey(settings.bg.bgMode)).clocks[0];
            await saveCustomSettings(settings);
        }
        const clockSettings = settings.bg[settings.bg.bgMode].customization.clocks[i];
        timeFontSelect.value = clockSettings.timeFont;
        timeColorInput.value = clockSettings.timeColor;
        dateFontSelect.value = clockSettings.dateFont;
        dateColorInput.value = clockSettings.dateColor;
        timeFormatSelect.value = clockSettings.timeFormat;
        timezoneSelect.value = clockSettings.timezone;
        dateFormatSelect.value = clockSettings.dateFormat;
        // Shadow state: which label is selected
        let activeShadowTarget = 'time';
        const timeLabel = wrapper.querySelector('.time-label');
        const dateLabel = wrapper.querySelector('.date-label');
        // Highlight label and set activeShadowTarget
        function setActiveShadowTarget(target) {
            activeShadowTarget = target;
            if (target === 'time') {
                timeLabel.classList.add('selected');
                dateLabel.classList.remove('selected');
            } else {
                dateLabel.classList.add('selected');
                timeLabel.classList.remove('selected');
            }
            updateShadowUI();
        }
        timeLabel.addEventListener('click', () => setActiveShadowTarget('time'));
        dateLabel.addEventListener('click', () => setActiveShadowTarget('date'));
        // Helper: get/set shadow for active target
        function getShadowSettings() {
            const clockSettings = settings.bg[settings.bg.bgMode].customization.clocks[i];
            if (activeShadowTarget === 'time') {
                if (!clockSettings.timeShadow) clockSettings.timeShadow = { ...DEFAULT_SHADOW };
                return clockSettings.timeShadow;
            } else {
                if (!clockSettings.dateShadow) clockSettings.dateShadow = { ...DEFAULT_SHADOW };
                return clockSettings.dateShadow;
            }
        }
        function setShadowSettings(newShadow) {
            const clockSettings = settings.bg[settings.bg.bgMode].customization.clocks[i];
            if (activeShadowTarget === 'time') {
                clockSettings.timeShadow = { ...clockSettings.timeShadow, ...newShadow };
            } else {
                clockSettings.dateShadow = { ...clockSettings.dateShadow, ...newShadow };
            }
        }
        // Update UI controls to match current shadow
        function updateShadowUI() {
            const shadow = getShadowSettings();
            shadowBlurInput.value = shadow.blur;
            shadowOpacityInput.value = shadow.opacity;
            shadowColorInput.value = shadow.color;
            shadowOffsetDisplay.textContent = `${shadow.offsetX}, ${shadow.offsetY}`;
        }
        // Joystick logic (offset change)
        shadowDirBtns.forEach(btn => {
            if (btn.disabled) return;
            btn.addEventListener("click", () => {
                const dir = btn.getAttribute('data-dir');
                const shadow = getShadowSettings();
                let newOffset = { offsetX: shadow.offsetX, offsetY: shadow.offsetY };
                if (dir === 'up') newOffset.offsetY = shadow.offsetY - 1;
                if (dir === 'down') newOffset.offsetY = shadow.offsetY + 1;
                if (dir === 'left') newOffset.offsetX = shadow.offsetX - 1;
                if (dir === 'right') newOffset.offsetX = shadow.offsetX + 1;
                setShadowSettings(newOffset);
                saveCustomSettings(settings).then(() => {
                    updateShadowUI();
                    updateTime();
                });
            });
            btn.addEventListener("contextmenu", async e => {
                e.preventDefault();
                const defaultOffset = { offsetX: DEFAULT_SHADOW.offsetX, offsetY: DEFAULT_SHADOW.offsetY };
                setShadowSettings(defaultOffset);
                saveCustomSettings(settings).then(() => {
                    updateShadowUI();
                    updateTime();
                });
            });
        });
        shadowBlurInput.addEventListener('input', e => {
            setShadowSettings({ blur: Number(e.target.value) });
            saveCustomSettings(settings).then(() => {
                updateShadowUI();
                updateTime();
            });
        });
        shadowBlurInput.addEventListener("contextmenu", async e => {
            e.preventDefault();
            setShadowSettings({ blur: Number(DEFAULT_SHADOW.blur) });
            saveCustomSettings(settings).then(() => {
                updateShadowUI();
                updateTime();
            });
        });
        shadowOpacityInput.addEventListener('input', e => {
            setShadowSettings({ opacity: Number(e.target.value) });
            saveCustomSettings(settings).then(() => {
                updateShadowUI();
                updateTime();
            });
        });
        shadowOpacityInput.addEventListener("contextmenu", async e => {
            e.preventDefault();
            setShadowSettings({ opacity: Number(DEFAULT_SHADOW.opacity) });
            saveCustomSettings(settings).then(() => {
                updateShadowUI();
                updateTime();
            });
        });
        shadowColorInput.addEventListener('input', e => {
            setShadowSettings({ color: e.target.value });
            saveCustomSettings(settings).then(() => {
                updateShadowUI();
                updateTime();
            });
        });
        shadowColorInput.addEventListener("contextmenu", async e => {
            e.preventDefault();
            setShadowSettings({ color: Number(DEFAULT_SHADOW.color) });
            saveCustomSettings(settings).then(() => {
                updateShadowUI();
                updateTime();
            });
        });
        updateShadowUI();

        // Save changes
        addEventListenerFor(timeFontSelect, "input", i, "timeFont", defaultTimeAndDateFont);
        addEventListenerFor(timeColorInput, "input", i, "timeColor", defaultTimeColor);
        addEventListenerFor(dateFontSelect, "change", i, "dateFont", defaultTimeAndDateFont);
        addEventListenerFor(dateColorInput, "input", i, "dateColor", defaultDateColor);
        addEventListenerFor(timeFormatSelect, "change", i, "timeFormat", "24");
        addEventListenerFor(timezoneSelect, "change", i, "timezone", "local");
        addEventListenerFor(dateFormatSelect, "change", i, "dateFormat", "day-month-year");

        removeElementBtn.addEventListener("click", async () => {
            const settings = loadCustomSettings();
            if (timeAndDateControlsContainer.childNodes.length > 1) {
                settings.bg[settings.bg.bgMode].customization.clocks.splice(i, 1);
                settings.bg[settings.bg.bgMode].customization.elements--;
                await saveCustomSettings(settings);
                await loadTimeAndDate(settings);
            }
        });
    }

    updateTime();
    applyLocalization(settings.locale);
}

addClockButton.addEventListener("click", async () => {
    const settings = loadCustomSettings();
    if (!settings.bg[settings.bg.bgMode].customization.elements) settings.bg[settings.bg.bgMode].customization.elements = 1;
    if (settings.bg[settings.bg.bgMode].customization.elements < 3) {
        settings.bg[settings.bg.bgMode].customization.elements++;
        await saveCustomSettings(settings);
        await loadTimeAndDate(settings);
    }
});

document.getElementById("reset-time-date").addEventListener("click", async () => {
    const settings = loadCustomSettings();
    const tempLinksColor = settings.bg[settings.bg.bgMode].customization.linksColor;
    settings.bg[settings.bg.bgMode].customization = await getDefaultCustomizationByKey(settings.bg.bgMode);
    settings.bg[settings.bg.bgMode].customization.linksColor = tempLinksColor;
    await saveCustomSettings(settings);
    await loadTimeAndDate(settings);
});
