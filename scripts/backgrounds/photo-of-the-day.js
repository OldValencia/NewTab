/**
 * "Photo of the day" background: the Picture of the Day chosen by the Wikimedia Commons community
 * (https://commons.wikimedia.org/wiki/Commons:Picture_of_the_day), via Wikimedia's featured feed.
 * Free, no API key; each photo has its author and license (shown in the bottom-left corner).
 */
const FEED_URL = "https://api.wikimedia.org/feed/v1/wikipedia/en/featured";
// Wikimedia asks API clients to identify themselves; browsers can't set User-Agent, so this header is used.
const CLIENT_ID = "NewTabExtension (https://github.com/OldValencia/NewTab)";
// Thumbnail widths the servers generate (others are refused); originals can be 50+ megapixels.
const THUMBNAIL_WIDTHS = [1280, 1920, 3840];

/** "YYYY-MM-DD" of the computer's local day: the photo changes at the user's midnight. */
export function localDateKey(date = new Date()) {
    const pad = number => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function neededWidth() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    return Math.round(window.screen.width * ratio);
}

/** The smallest generated thumbnail that covers the screen, or the original when it is smaller. */
export function pickImageUrl(image, screenWidth) {
    const original = image.image;
    const thumbnail = image.thumbnail?.source?.split("?")[0];
    const width = THUMBNAIL_WIDTHS.find(candidate => candidate >= screenWidth) ?? THUMBNAIL_WIDTHS.at(-1);

    if (original?.source && Number.isFinite(original.width) && original.width <= width) {
        return original.source.split("?")[0];
    }
    if (thumbnail && /\/\d+px-/.test(thumbnail)) return thumbnail.replace(/\/\d+px-/, `/${width}px-`);
    return original?.source?.split("?")[0] ?? "";
}

/** Converts the feed's `image` entry to the photo shape used by the background manager. */
export function photoFromFeed(image, screenWidth) {
    if (!image) return null;
    const url = pickImageUrl(image, screenWidth);
    if (!url) return null;
    return {
        url,
        author: image.artist?.text?.trim() || image.credit?.text?.trim() || "",
        sourceUrl: image.file_page ?? "",
        license: image.license?.type ?? "",
        licenseUrl: image.license?.url ?? ""
    };
}

async function fetchFeedPhoto(dateKey) {
    const url = `${FEED_URL}/${dateKey.replaceAll("-", "/")}`;
    const response = await fetch(url, { headers: { "Api-User-Agent": CLIENT_ID } });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

    const photo = photoFromFeed((await response.json()).image, neededWidth());
    if (!photo) throw new Error(`No picture of the day for ${dateKey}`);
    return photo;
}

function previousDay(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return localDateKey(new Date(year, month - 1, day - 1));
}

/**
 * @returns {Promise<object>} the photo for `dateKey` ("YYYY-MM-DD"); a day without a picture
 *   falls back to the day before. Throws when neither can be loaded.
 */
export async function fetchPhotoOfTheDay(dateKey) {
    try {
        return await fetchFeedPhoto(dateKey);
    } catch (error) {
        console.warn("No picture of the day, trying the day before:", error);
        return fetchFeedPhoto(previousDay(dateKey));
    }
}

/** Milliseconds until shortly after the next local midnight, when a new photo appears. */
export function msUntilNextDay(now = new Date()) {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 30);
    return midnight.getTime() - now.getTime();
}
