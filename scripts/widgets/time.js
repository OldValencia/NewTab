const toggleTime = document.getElementById("toggle-time");
const toggleDate = document.getElementById("toggle-date");
const multipleClocksWrapper = document.getElementById("multiple-clocks");
const defaultTimeAndDateFont = "SF Pro Display";
const defaultTimeColor = "#7e4600";
const defaultDateColor = "#aaaaaa";

const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    pl: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    be: ['Студзень', 'Люты', 'Сакавік', 'Красавік', 'Май', 'Чэрвень', 'Ліпень', 'Жнівень', 'Верасень', 'Кастрычнік', 'Лістапад', 'Снежань'],
    uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']
};

const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toArabic = n => n.toString().split("").map(d => arabicDigits[+d]).join("");

function formatTime(hours, minutes, format, clockDate, tz) {
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');

    switch (format) {
        case "12": {
            const ampm = hours >= 12 ? "PM" : "AM";
            const h = hours % 12 || 12;
            return `${h}:${minutesStr} ${ampm}`;
        }
        case "arabic":
            return `${toArabic(hours)}:${toArabic(minutes)}`;
        case "chinese": {
            const isPM = hours >= 12;
            const h = hours % 12 || 12;
            return `${isPM ? '下午' : '上午'}${h}:${minutesStr}`;
        }
        case "japanese":
            return `${hours}時${minutesStr}分`;
        case "custom":
            return clockDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: tz !== 'local' ? tz : undefined
            });
        default:
            return `${hoursStr}:${minutesStr}`;
    }
}

function formatDate(day, monthIndex, year, monthNum, format, locale) {
    const monthName = monthNames[locale][monthIndex];
    const dayStr = day.toString().padStart(2, '0');

    switch (format) {
        case "month-day-year":
            return `${monthName} ${dayStr} ${year}`;
        case "day-month-year":
            return `${dayStr} ${monthName} ${year}`;
        case "year-month-day":
            return `${year} ${monthName} ${dayStr}`;
        case "dd-mm-yyyy":
            return `${dayStr}-${monthNum}-${year}`;
        case "mm-dd-yyyy":
            return `${monthNum}-${dayStr}-${year}`;
        default:
            return `${dayStr} ${monthName} ${year}`;
    }
}

function getShadowStyle(shadow) {
    if (!shadow) return '';
    const { offsetX = 0, offsetY = 0, blur = 0, color = '#000', opacity = 0 } = shadow;
    return `${offsetX}px ${offsetY}px ${blur}px ${hexToRgba(color, opacity)}`;
}

function updateTime() {
    const now = new Date();
    const settings = loadCustomSettings();

    if (!settings.bg[settings.bg.bgMode]?.customization) return;

    const customization = settings.bg[settings.bg.bgMode].customization;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < customization.elements; i++) {
        const clockSettings = customization.clocks[i];
        if (!clockSettings) continue;

        let clockDate = new Date(now);
        const tz = clockSettings.timezone || 'local';

        if (tz && tz !== 'local') {
            const offset = parseInt(tz, 10);
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            clockDate = new Date(utc + offset * 3600000);
        }

        const hours = clockDate.getHours();
        const minutes = clockDate.getMinutes();
        const day = clockDate.getDate();
        const year = clockDate.getFullYear();
        const monthIndex = clockDate.getMonth();
        const monthNum = (monthIndex + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');

        const timeString = formatTime(hours, minutes, clockSettings.timeFormat, clockDate, tz);
        const dateString = formatDate(day, monthIndex, year, monthNum, clockSettings.dateFormat, settings.locale);

        const timeAndDateElement = document.createElement("div");
        timeAndDateElement.className = "time-and-date-element";
        timeAndDateElement.id = `time-and-date-element-${i}`;

        const timeElement = document.createElement("div");
        timeElement.className = "time";
        timeElement.id = `time-${i}`;
        timeElement.textContent = timeString;
        timeElement.style.cssText = `
            font-family: ${clockSettings.timeFont || defaultTimeAndDateFont};
            color: ${clockSettings.timeColor || defaultTimeColor};
            display: ${customization.showTime ? "block" : "none"};
            text-shadow: ${getShadowStyle(clockSettings.timeShadow)};
        `;

        const dateElement = document.createElement("div");
        dateElement.className = "date";
        dateElement.id = `date-${i}`;
        dateElement.textContent = dateString;
        dateElement.setAttribute("data-tooltip", `${dayStr}-${monthNum}-${year}`);
        dateElement.style.cssText = `
            font-family: ${clockSettings.dateFont || defaultTimeAndDateFont};
            color: ${clockSettings.dateColor || defaultDateColor};
            display: ${customization.showDate ? "block" : "none"};
            text-shadow: ${getShadowStyle(clockSettings.dateShadow)};
        `;

        timeAndDateElement.appendChild(timeElement);
        timeAndDateElement.appendChild(dateElement);
        fragment.appendChild(timeAndDateElement);
    }

    multipleClocksWrapper.innerHTML = "";
    multipleClocksWrapper.appendChild(fragment);
}

toggleTime.addEventListener("change", async () => {
    const settings = loadCustomSettings();
    const visible = toggleTime.checked;
    settings.bg[settings.bg.bgMode].customization.showTime = visible;
    await saveCustomSettings(settings);

    const timeElements = multipleClocksWrapper.querySelectorAll('.time');
    timeElements.forEach(time => {
        time.style.display = visible ? "block" : "none";
    });
});

toggleDate.addEventListener("change", async () => {
    const settings = loadCustomSettings();
    const visible = toggleDate.checked;
    settings.bg[settings.bg.bgMode].customization.showDate = visible;
    await saveCustomSettings(settings);

    const dateElements = multipleClocksWrapper.querySelectorAll('.date');
    dateElements.forEach(date => {
        date.style.display = visible ? "block" : "none";
    });
});

setInterval(updateTime, 60000);
