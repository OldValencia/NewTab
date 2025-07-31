const timeFormatSelect = document.getElementById("time-format");
const dateFormatSelect = document.getElementById("date-format");
const timeFontSelect = document.getElementById("time-font");
const timeColorInput = document.getElementById("time-color");
const dateFontSelect = document.getElementById("date-font");
const dateColorInput = document.getElementById("date-color");

function loadTimeAndDate(settings) {
    if (!settings.timeFont) {
        settings.timeFont = defaultTimeAndDateFont;
        saveCustomSettings(settings);
    }
    timeFontSelect.value = settings.timeFont;
    timeElement.style.fontFamily = settings.timeFont;

    if (!settings.timeColor) {
        settings.timeColor = defaultTimeColor;
        saveCustomSettings(settings);
    }
    timeColorInput.value = settings.timeColor;
    timeElement.style.color = settings.timeColor;

    if (!settings.dateFont) {
        settings.dateFont = defaultTimeAndDateFont;
        saveCustomSettings(settings);
    }
    dateFontSelect.value = settings.dateFont;
    dateElement.style.fontFamily = settings.dateFont;

    if (!settings.dateColor) {
        settings.dateColor = defaultDateColor;
        saveCustomSettings(settings);
    }
    dateColorInput.value = settings.dateColor;
    dateElement.style.color = settings.dateColor;

    timeFontSelect.addEventListener("change", (e) => {
        settings.timeFont = e.target.value;
        timeElement.style.fontFamily = settings.timeFont;
        saveCustomSettings(settings);
    });

    timeColorInput.addEventListener("input", (e) => {
        settings.timeColor = e.target.value;
        timeElement.style.color = settings.timeColor;
        saveCustomSettings(settings);
    });

    dateFontSelect.addEventListener("change", (e) => {
        settings.dateFont = e.target.value;
        dateElement.style.fontFamily = settings.dateFont;
        saveCustomSettings(settings);
    });

    dateColorInput.addEventListener("input", (e) => {
        settings.dateColor = e.target.value;
        dateElement.style.color = settings.dateColor;
        saveCustomSettings(settings);
    });

    if (!settings.timeFormat) {
        settings.timeFormat = "24";
    }
    timeFormatSelect.value = settings.timeFormat;
    if (!settings.dateFormat) {
        settings.dateFormat = "day-month-year";
    }
    dateFormatSelect.value = settings.dateFormat;

    timeFormatSelect.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.timeFormat = timeFormatSelect.value;
        saveCustomSettings(settings);
        updateTime();
    });

    dateFormatSelect.addEventListener("change", () => {
        const settings = loadCustomSettings();
        settings.dateFormat = dateFormatSelect.value;
        saveCustomSettings(settings);
        updateTime();
    });
}

document.getElementById("reset-time-date").addEventListener("click", () => {
    const settings = loadCustomSettings();
    settings.timeFont = defaultTimeAndDateFont;
    settings.timeColor = defaultTimeColor;
    settings.dateFont = defaultTimeAndDateFont;
    settings.dateColor = defaultDateColor;
    settings.showTime = true;
    settings.showDate = true;
    settings.timeFormat = defaultTimeFormat;
    settings.dateFormat = defaultDateFormat;
    saveCustomSettings(settings);

    timeFontSelect.value = settings.timeFont;
    timeColorInput.value = settings.timeColor;
    dateFontSelect.value = settings.dateFont;
    dateColorInput.value = settings.dateColor;
    toggleTime.checked = true;
    toggleDate.checked = true;
    timeElement.style.display = "block";
    dateElement.style.display = "block";
    dateElement.style.fontFamily = settings.dateFont;
    dateElement.style.color = settings.dateColor;
    timeElement.style.fontFamily = settings.timeFont;
    timeElement.style.color = settings.timeColor;
    timeFormatSelect.value = settings.timeFormat;
    dateFormatSelect.value = settings.dateFormat;

    updateTime();
});