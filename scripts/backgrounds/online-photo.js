/**
 * "Online photo" background: random photos without an API key.
 *   - empty query → Picsum (curated Unsplash photos, random)
 *   - with query  → Openverse (openly licensed photos; anonymous limit is 200 requests/day,
 *                   so one request fetches a batch that is shown one by one)
 */
const PICSUM_LIST_URL = "https://picsum.photos/v2/list";
const PICSUM_PAGES = 30;
const PICSUM_PAGE_SIZE = 30;
const OPENVERSE_URL = "https://api.openverse.org/v1/images/";
const OPENVERSE_PAGE_SIZE = 20;
const OPENVERSE_MAX_WIDTH = 6000;
const PRELOAD_ATTEMPTS = 3;

function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function screenSize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    return {
        width: Math.min(3840, Math.round(window.screen.width * ratio)),
        height: Math.min(2160, Math.round(window.screen.height * ratio))
    };
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
}

async function fetchPicsumPhotos() {
    const page = 1 + Math.floor(Math.random() * PICSUM_PAGES);
    const items = await fetchJson(`${PICSUM_LIST_URL}?page=${page}&limit=${PICSUM_PAGE_SIZE}`);
    const { width, height } = screenSize();

    return items.map(item => ({
        url: `https://picsum.photos/id/${encodeURIComponent(item.id)}/${width}/${height}`,
        author: item.author ?? "",
        sourceUrl: item.url ?? "",
        license: "Unsplash License",
        licenseUrl: "https://unsplash.com/license"
    }));
}

function openverseLicenseName(result) {
    const code = String(result.license ?? "").toLowerCase();
    if (code === "cc0") return "CC0";
    if (code === "pdm") return "Public Domain Mark";
    return `CC ${code.toUpperCase()} ${result.license_version ?? ""}`.trim();
}

async function fetchOpenversePhotos(query) {
    const params = new URLSearchParams({
        q: query,
        page_size: String(OPENVERSE_PAGE_SIZE),
        page: String(1 + Math.floor(Math.random() * 3)),
        category: "photograph",
        aspect_ratio: "wide",
        size: "large",
        mature: "false"
    });

    let data = await fetchJson(`${OPENVERSE_URL}?${params}`);
    if (!data.results?.length && params.get("page") !== "1") {
        params.set("page", "1");
        data = await fetchJson(`${OPENVERSE_URL}?${params}`);
    }

    return (data.results ?? [])
        .filter(result => result.url && (!result.width || result.width <= OPENVERSE_MAX_WIDTH))
        .map(result => ({
            url: result.url,
            author: result.creator ?? "",
            sourceUrl: result.foreign_landing_url ?? "",
            license: openverseLicenseName(result),
            licenseUrl: result.license_url ?? ""
        }));
}

function preloadImage(url) {
    const image = new Image();
    image.src = url;
    return image.decode();
}

export async function canLoadImage(url) {
    try {
        await preloadImage(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Picks the next photo, refilling the queue from the network when needed.
 * Returns the new { current, queue, queueQuery } or throws when nothing could be loaded.
 */
export async function pickNextPhoto(onlinePhoto) {
    const query = onlinePhoto.query;
    let queue = onlinePhoto.queueQuery === query ? [...onlinePhoto.queue] : [];
    let refilled = false;

    for (let attempt = 0; attempt < PRELOAD_ATTEMPTS; attempt++) {
        if (queue.length === 0) {
            if (refilled) break;
            const candidates = query ? await fetchOpenversePhotos(query) : await fetchPicsumPhotos();
            queue = shuffle(candidates).filter(photo => photo.url !== onlinePhoto.current?.url);
            refilled = true;
            if (queue.length === 0) break;
        }

        const [next, ...rest] = queue;
        queue = rest;
        try {
            await preloadImage(next.url);
            return { current: next, queue, queueQuery: query };
        } catch {
            console.warn("Skipping a photo that failed to load:", next.url);
        }
    }

    throw new Error("No photo could be loaded");
}

/** Whether a new photo is due when the page opens. */
export function isPhotoChangeDue(onlinePhoto, now = Date.now()) {
    if (!onlinePhoto.current) return true;
    if (onlinePhoto.interval === "never") return false;
    if (onlinePhoto.interval === "onload") return true;
    return now - onlinePhoto.lastChangedAt >= Number(onlinePhoto.interval) * 60_000;
}

/** Milliseconds until the next scheduled change while the page stays open, or null. */
export function msUntilNextPhoto(onlinePhoto, now = Date.now()) {
    const minutes = Number(onlinePhoto.interval);
    if (!Number.isFinite(minutes)) return null;
    return Math.max(1000, onlinePhoto.lastChangedAt + minutes * 60_000 - now);
}
