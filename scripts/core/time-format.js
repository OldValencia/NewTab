/**
 * Pure time/date formatting for clocks. No DOM access, so it can be tested in Node.
 *
 * Time zones are IANA names ("Europe/Berlin"), "local", or fixed offsets written as
 * "Etc/GMT-3" (which means UTC+3 — the Etc/ sign is inverted by the IANA standard).
 */

export const TIME_FORMATS = ["24", "12", "arabic", "chinese", "japanese", "custom"];
export const DATE_FORMATS = ["month-day-year", "day-month-year", "year-month-day", "dd-mm-yyyy", "mm-dd-yyyy"];

const MONTH_NAMES = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    pl: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
    de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    be: ["Студзень", "Люты", "Сакавік", "Красавік", "Май", "Чэрвень", "Ліпень", "Жнівень", "Верасень", "Кастрычнік", "Лістапад", "Снежань"],
    uk: ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"]
};

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const LEGACY_OFFSET = /^([+-]?)(\d{1,2})$/;

export function isValidTimeZone(timeZone) {
    if (timeZone === "local") return true;
    if (typeof timeZone !== "string" || timeZone === "") return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone });
        return true;
    } catch {
        return false;
    }
}

/** Converts the offsets stored by version 1.0.x ("+3", "-5", "0") to "Etc/GMT-3"-style zones. */
export function legacyOffsetToTimeZone(value) {
    const match = typeof value === "string" ? value.trim().match(LEGACY_OFFSET) : null;
    if (!match) return null;

    const hours = Number(match[2]);
    if (hours === 0) return "Etc/GMT";
    if (hours > 14) return null;

    const isNegative = match[1] === "-";
    // Etc/GMT zones have inverted signs: UTC+3 is "Etc/GMT-3".
    return `Etc/GMT${isNegative ? "+" : "-"}${hours}`;
}

export function normalizeTimeZone(value) {
    const fromLegacy = legacyOffsetToTimeZone(value);
    if (fromLegacy) return fromLegacy;
    return isValidTimeZone(value) ? value : "local";
}

function toIntlTimeZone(timeZone) {
    return timeZone === "local" ? undefined : timeZone;
}

/** Returns calendar fields of `date` as seen in `timeZone`. */
export function getZonedParts(date, timeZone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: toIntlTimeZone(timeZone),
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hourCycle: "h23"
    });

    const parts = {};
    for (const { type, value } of formatter.formatToParts(date)) {
        parts[type] = value;
    }

    return {
        year: Number(parts.year),
        monthIndex: Number(parts.month) - 1,
        day: Number(parts.day),
        hours: Number(parts.hour),
        minutes: Number(parts.minute)
    };
}

const pad2 = number => String(number).padStart(2, "0");
const toArabicDigits = number => String(number).split("").map(digit => ARABIC_DIGITS[Number(digit)]).join("");

export function formatClockTime(date, { format, timeZone }) {
    const { hours, minutes } = getZonedParts(date, timeZone);
    const hours12 = hours % 12 || 12;

    switch (format) {
        case "12":
            return `${hours12}:${pad2(minutes)} ${hours >= 12 ? "PM" : "AM"}`;
        case "arabic":
            return `${toArabicDigits(hours)}:${toArabicDigits(pad2(minutes))}`;
        case "chinese":
            return `${hours >= 12 ? "下午" : "上午"}${hours12}:${pad2(minutes)}`;
        case "japanese":
            return `${hours}時${pad2(minutes)}分`;
        case "custom":
            return date.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: toIntlTimeZone(timeZone)
            });
        default:
            return `${pad2(hours)}:${pad2(minutes)}`;
    }
}

export function formatClockDate(date, { format, timeZone, locale }) {
    const { year, monthIndex, day } = getZonedParts(date, timeZone);
    const monthName = (MONTH_NAMES[locale] ?? MONTH_NAMES.en)[monthIndex];
    const dayText = pad2(day);
    const monthNumber = pad2(monthIndex + 1);

    switch (format) {
        case "month-day-year":
            return `${monthName} ${dayText} ${year}`;
        case "year-month-day":
            return `${year} ${monthName} ${dayText}`;
        case "dd-mm-yyyy":
            return `${dayText}-${monthNumber}-${year}`;
        case "mm-dd-yyyy":
            return `${monthNumber}-${dayText}-${year}`;
        default:
            return `${dayText} ${monthName} ${year}`;
    }
}

/** Numeric date used as the tooltip under each clock. */
export function formatNumericDate(date, timeZone) {
    const { year, monthIndex, day } = getZonedParts(date, timeZone);
    return `${pad2(day)}-${pad2(monthIndex + 1)}-${year}`;
}

/** "UTC+05:30" for the given zone at the given moment. */
export function formatUtcOffset(timeZone, date = new Date()) {
    const zoned = getZonedParts(date, timeZone);
    const asUtc = Date.UTC(zoned.year, zoned.monthIndex, zoned.day, zoned.hours, zoned.minutes);
    const utcMinutes = Math.round((asUtc - date.getTime()) / 60000);
    const sign = utcMinutes < 0 ? "-" : "+";
    const absolute = Math.abs(utcMinutes);
    return `UTC${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`;
}
