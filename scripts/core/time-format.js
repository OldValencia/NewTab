/**
 * Pure time/date formatting for clocks. No DOM access, so it can be tested in Node.
 *
 * Time zones are IANA names ("Europe/Berlin"), "local", or fixed offsets written as
 * "Etc/GMT-3" (which means UTC+3 — the Etc/ sign is inverted by the IANA standard).
 */

export const TIME_FORMATS = ["24", "12", "arabic", "chinese", "japanese", "custom"];
// "weekday" is written by Intl in the UI language ("вторник, 10 ноября"), the others use MONTH_NAMES as in 1.0.x.
export const DATE_FORMATS = ["month-day-year", "day-month-year", "year-month-day", "dd-mm-yyyy", "mm-dd-yyyy", "weekday"];

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
        second: "numeric",
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
        minutes: Number(parts.minute),
        seconds: Number(parts.second)
    };
}

const pad2 = number => String(number).padStart(2, "0");
const toArabicDigits = number => String(number).split("").map(digit => ARABIC_DIGITS[Number(digit)]).join("");

export function formatClockTime(date, { format, timeZone, showSeconds = false }) {
    const { hours, minutes, seconds } = getZonedParts(date, timeZone);
    const hours12 = hours % 12 || 12;
    const secondsPart = showSeconds ? `:${pad2(seconds)}` : "";

    switch (format) {
        case "12":
            return `${hours12}:${pad2(minutes)}${secondsPart} ${hours >= 12 ? "PM" : "AM"}`;
        case "arabic":
            return [hours, pad2(minutes), ...(showSeconds ? [pad2(seconds)] : [])].map(toArabicDigits).join(":");
        case "chinese":
            return `${hours >= 12 ? "下午" : "上午"}${hours12}:${pad2(minutes)}${secondsPart}`;
        case "japanese":
            return `${hours}時${pad2(minutes)}分${showSeconds ? `${pad2(seconds)}秒` : ""}`;
        case "custom":
            return date.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: showSeconds ? "2-digit" : undefined,
                timeZone: toIntlTimeZone(timeZone)
            });
        default:
            return `${pad2(hours)}:${pad2(minutes)}${secondsPart}`;
    }
}

/** Angles of the analog clock hands in degrees (0 = 12 o'clock); hands move smoothly between marks. */
export function getHandAngles(date, timeZone) {
    const { hours, minutes, seconds } = getZonedParts(date, timeZone);
    return {
        hour: (hours % 12) * 30 + minutes * 0.5,
        minute: minutes * 6 + seconds * 0.1,
        second: seconds * 6
    };
}

function capitalize(text, locale) {
    return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

function formatWeekdayDate(date, timeZone, locale) {
    const text = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: toIntlTimeZone(timeZone)
    }).format(date);
    // Slavic languages write weekdays in lowercase; at the start of a line they need a capital.
    return capitalize(text, locale);
}

export function formatClockDate(date, { format, timeZone, locale }) {
    if (format === "weekday") return formatWeekdayDate(date, timeZone, locale);

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

/**
 * Minutes between UTC and the zone's wall clock at `date`.
 * The zoned parts have no seconds, so `date` is compared at the start of its minute too —
 * otherwise "UTC+09:00" became "UTC+08:59" in the second half of every minute.
 */
function offsetMinutes(timeZone, date) {
    const zoned = getZonedParts(date, timeZone);
    const asUtc = Date.UTC(zoned.year, zoned.monthIndex, zoned.day, zoned.hours, zoned.minutes);
    return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

/** "UTC+05:30" for the given zone at the given moment. */
export function formatUtcOffset(timeZone, date = new Date()) {
    const utcMinutes = offsetMinutes(timeZone, date);
    const sign = utcMinutes < 0 ? "-" : "+";
    const absolute = Math.abs(utcMinutes);
    return `UTC${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`;
}


/**
 * Default clock label: the city of the zone ("Tokyo", "New York"), "UTC+3" for fixed offsets.
 * For "local" it is the city of the computer's own zone.
 */
export function defaultClockLabel(timeZone) {
    const zone = timeZone === "local" ? new Intl.DateTimeFormat().resolvedOptions().timeZone : timeZone;
    if (!zone || ["UTC", "Etc/UTC", "Etc/GMT"].includes(zone)) return "UTC";
    if (zone.startsWith("Etc/")) {
        const minutes = offsetMinutes(zone, new Date());
        return `UTC${minutes < 0 ? "−" : "+"}${Math.abs(minutes) / 60}`;
    }
    return zone.slice(zone.lastIndexOf("/") + 1).replaceAll("_", " ");
}

/**
 * How far the zone is from the computer's own time: { sign: "+" | "−", hours, minutes }, or null when equal.
 * Shown next to the label of clocks in other zones ("Tokyo · +7 h").
 */
export function relativeOffset(timeZone, date = new Date()) {
    if (timeZone === "local") return null;
    const difference = offsetMinutes(timeZone, date) - offsetMinutes("local", date);
    if (difference === 0) return null;
    const absolute = Math.abs(difference);
    return { sign: difference > 0 ? "+" : "−", hours: Math.floor(absolute / 60), minutes: absolute % 60 };
}

function minutesOfDay(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

/**
 * Whether `now` (computer's local time) is between nightStart and dayStart ("HH:MM").
 * Night may cross midnight (20:00 → 07:00) or not (01:00 → 09:00); equal times mean no night.
 */
export function isNightTime(now, nightStart, dayStart) {
    const current = now.getHours() * 60 + now.getMinutes();
    const night = minutesOfDay(nightStart);
    const day = minutesOfDay(dayStart);
    if (night === day) return false;
    return night > day ? current >= night || current < day : current >= night && current < day;
}
