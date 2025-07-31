const toggleTime = document.getElementById("toggle-time");
const toggleDate = document.getElementById("toggle-date");
const multipleClocksWrapper = document.getElementById("multiple-clocks");
const defaultTimeAndDateFont = "Arial";
const defaultTimeColor = "#7e4600";
const defaultDateColor = "#aaaaaa";
const defaultTimeFormat = "24";
const defaultDateFormat = "day-month-year";
const defaultTimezone = "local";

function updateTime() {
    const now = new Date();
    const settings = loadCustomSettings();
    if (!settings.timeAndDateElements) {
        settings.timeAndDateElements = 1;
        saveCustomSettings(settings);
    }

    if (!settings.clocks) {
        settings.clocks = [];
    }

    initializeTimeAndDateState(settings);

    multipleClocksWrapper.innerHTML = "";
    for (let i = 0; i < settings.timeAndDateElements; i++) {
        if (!settings.clocks[i] || Object.keys(settings.clocks[i]).length === 0) {
            settings.clocks[i] = {
                timeFont: defaultTimeAndDateFont,
                timeColor: defaultTimeColor,
                dateFont: defaultTimeAndDateFont,
                dateColor: defaultDateColor,
                timeFormat: defaultTimeFormat,
                dateFormat: defaultDateFormat,
                timezone: defaultTimezone
            };
            saveCustomSettings(settings);
        }

        // Get correct date for timezone
        let clockDate = new Date(now);
        let tz = settings.clocks[i].timezone || 'local';
        if (tz && tz !== 'local') {
            // tz is like '+3', '-5', etc.
            let offset = parseInt(tz, 10);
            // Get UTC time and add offset
            let utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            clockDate = new Date(utc + offset * 3600000);
        }
        let hours = clockDate.getHours();
        const minutes = clockDate.getMinutes().toString().padStart(2, '0');
        const day = clockDate.getDate().toString().padStart(2, '0');
        const year = clockDate.getFullYear();
        const monthIndex = clockDate.getMonth();
        const monthName = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ][monthIndex];
        const monthNum = (monthIndex + 1).toString().padStart(2, '0');

        // Time format
        let timeString;
        switch (settings.clocks[i].timeFormat) {
            case "12": {
                const ampm = hours >= 12 ? "PM" : "AM";
                let h = hours % 12 || 12;
                timeString = `${h}:${minutes} ${ampm}`;
                break;
            }
            case "arabic": {
                // Arabic numerals
                const arabicDigits = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
                const toArabic = n => n.toString().split("").map(d => arabicDigits[+d]).join("");
                timeString = `${toArabic(hours)}:${toArabic(minutes)}`;
                break;
            }
            case "hebrew": {
                // Hebrew format (standard numbers, but RTL)
                timeString = `\u202B${hours}:${minutes}\u202C`;
                break;
            }
            case "chinese": {
                // Chinese format (上午/下午)
                const isPM = hours >= 12;
                let h = hours % 12 || 12;
                timeString = `${isPM ? '下午' : '上午'}${h}:${minutes}`;
                break;
            }
            case "japanese": {
                timeString = `${hours}時${minutes}分`;
                break;
            }
            case "custom": {
                // Use browser locale and timezone
                timeString = clockDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: tz !== 'local' ? tz : undefined });
                break;
            }
            case "24":
            default:
                timeString = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }

        // Date format
        let dateString = "";
        switch (settings.clocks[i].dateFormat) {
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

        const timeAndDateElement = document.createElement("div");
        timeAndDateElement.className = "time-and-date-element";
        timeAndDateElement.id = `time-and-date-element-${i}`;
        const timeElement = document.createElement("div");
        timeElement.className = "time";
        timeElement.id = `time-${i}`;
        timeElement.innerText = timeString;
        // Apply font and color settings for time
        timeElement.style.fontFamily = settings.clocks[i].timeFont || defaultTimeAndDateFont;
        timeElement.style.color = settings.clocks[i].timeColor || defaultTimeColor;
        timeElement.style.display = settings.showTime ? "block" : "none";
        timeAndDateElement.appendChild(timeElement);
        const dateElement = document.createElement("div");
        dateElement.className = "date";
        dateElement.id = `date-${i}`;
        dateElement.innerText = dateString;
        dateElement.setAttribute("data-tooltip", `${day}-${monthNum}-${year}`);
        // Apply font and color settings for date
        dateElement.style.fontFamily = settings.clocks[i].dateFont || defaultTimeAndDateFont;
        dateElement.style.color = settings.clocks[i].dateColor || defaultDateColor;
        dateElement.style.display = settings.showDate ? "block" : "none";
        timeAndDateElement.appendChild(dateElement);
        multipleClocksWrapper.appendChild(timeAndDateElement);
    }
}

function initializeTimeAndDateState(settings) {
    if (settings.showTime === undefined || settings.showTime === null) {
        settings.showTime = true;
        saveCustomSettings(settings);
    }
    toggleTime.checked = settings.showTime;
    const timeElements = multipleClocksWrapper.querySelectorAll('.time');
    timeElements.forEach(time => {
        time.style.display = settings.showTime ? "block" : "none";
    });

    if (settings.showDate === undefined || settings.showDate === null) {
        settings.showDate = true;
        saveCustomSettings(settings);
    }
    toggleDate.checked = settings.showDate;
    const dateElements = multipleClocksWrapper.querySelectorAll('.date');
    dateElements.forEach(date => {
        date.style.display = settings.showDate ? "block" : "none";
    });
}

updateTime();
setInterval(updateTime, 60000);

document.addEventListener("DOMContentLoaded", () => {
    const settings = loadCustomSettings();
    initializeTimeAndDateState(settings);

    toggleTime.addEventListener("change", () => {
        const settings = loadCustomSettings();
        const visible = toggleTime.checked;
        const timeElements = multipleClocksWrapper.querySelectorAll('.time');
        timeElements.forEach(time => {
            time.style.display = visible ? "block" : "none";
        });
        settings.showTime = visible;
        saveCustomSettings(settings);
    });

    toggleDate.addEventListener("change", () => {
        const settings = loadCustomSettings();
        const visible = toggleDate.checked;
        const dateElements = multipleClocksWrapper.querySelectorAll('.date');
        dateElements.forEach(date => {
           date.style.display = visible ? "block" : "none";
        });
        settings.showDate = visible;
        saveCustomSettings(settings);
    });
});


/*
* Апдейты 0.6
* 10. Добавить, возможно, тудушку +
* 11. Добавить возможность поставить несколько часов (разные часовые пояса)
* 12. Добавить возможность устанавливать текущее расширение как homepage
* Апдейты 0.7
* 13. Добавить календарь
* 14. Добавить поиск в гугле
* Апдейты 0.8
* https://github.com/zombieFox/nightTab можно добавить темплейты
* */