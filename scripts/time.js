const toggleTime = document.getElementById("toggle-time");
const toggleDate = document.getElementById("toggle-date");
const timeElement = document.getElementById("time");
const dateElement = document.getElementById("date");
const defaultTimeAndDateFont = "Arial";
const defaultTimeColor = "#7e4600";
const defaultDateColor = "#aaa";
const defaultTimeFormat = "24";
const defaultDateFormat = "day-month-year";

function updateTime() {
    const now = new Date();
    const settings = loadCustomSettings();
    if (settings.timeFormat === undefined || settings.timeFormat === null) {
        settings.timeFormat = defaultTimeFormat;
    }
    if (settings.dateFormat === undefined || settings.dateFormat === null) {
        settings.dateFormat = defaultDateFormat;
    }
    saveCustomSettings(settings)

    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const monthName = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ][monthIndex];
    const monthNum = (monthIndex + 1).toString().padStart(2, '0');

    // Time format
    let timeString;
    if (settings.timeFormat === "12") {
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        timeString = `${hours}:${minutes} ${ampm}`;
    } else {
        timeString = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    // Date format
    let dateString = "";
    switch (settings.dateFormat) {
        case "month-day-year":
            dateString = `${monthName} ${day} ${year}`;
            break;
        case "day-month-year":
            dateString = `${day} ${monthName} ${year}`;
            break;
        case "year-month-day":
            dateString = `${year} ${monthName} ${day}`;
            break;
        case "dd-mm-yyyy":
            dateString = `${day}-${monthNum}-${year}`;
            break;
        case "mm-dd-yyyy":
            dateString = `${monthNum}-${day}-${year}`;
            break;
    }

    timeElement.textContent = timeString;
    dateElement.textContent = dateString;
    dateElement.setAttribute("data-tooltip", `${day}-${monthNum}-${year}`);
}

updateTime();
setInterval(updateTime, 60000);

document.addEventListener("DOMContentLoaded", () => {
    const settings = loadCustomSettings();

    if (settings.showTime === undefined || settings.showTime === null) {
        settings.showTime = true;
        saveCustomSettings(settings);
    }
    toggleTime.checked = settings.showTime;
    timeElement.style.display = settings.showTime ? "block" : "none";

    if (settings.showDate === undefined || settings.showDate === null) {
        settings.showDate = true;
        saveCustomSettings(settings);
    }
    toggleDate.checked = settings.showDate;
    dateElement.style.display = settings.showDate ? "block" : "none";

    toggleTime.addEventListener("change", () => {
        const settings = loadCustomSettings();
        const visible = toggleTime.checked;
        timeElement.style.display = visible ? "block" : "none";
        settings.showTime = visible;
        saveCustomSettings(settings);
    });

    toggleDate.addEventListener("change", () => {
        const settings = loadCustomSettings();
        const visible = toggleDate.checked;
        dateElement.style.display = visible ? "block" : "none";
        settings.showDate = visible;
        saveCustomSettings(settings);
    });
});
