/**
 * Shows the selected background (procedural effect, uploaded image or online photo)
 * and keeps it in sync with the settings.
 */
import { getSettings, subscribe, updateSettings } from "../core/settings.js";
import { loadCustomImage, onCustomImageChange } from "../core/image-store.js";
import { debounce, wait } from "../core/utils.js";
import { t } from "../core/i18n.js";
import { getEffect, isImageMode } from "./registry.js";
import { canLoadImage, isPhotoChangeDue, msUntilNextPhoto, pickNextPhoto } from "./online-photo.js";
import { fetchPhotoOfTheDay, localDateKey, msUntilNextDay } from "./photo-of-the-day.js";

const layer = document.getElementById("background-layer");
const vignetteLayer = document.getElementById("vignette-layer");
const photoCredit = document.getElementById("photo-credit");

const FADE_MS = 400;
const RETRY_AFTER_ERROR_MS = 5 * 60 * 1000;
// Modes whose picture has an author to credit in the bottom-left corner.
const CREDITED_MODES = new Set(["onlinePhoto", "photoOfTheDay"]);
const IMAGE_FITS = {
    cover: { size: "cover", repeat: "no-repeat", position: "center" },
    contain: { size: "contain", repeat: "no-repeat", position: "center" },
    repeat: { size: "auto", repeat: "repeat", position: "top left" },
    stretch: { size: "100% 100%", repeat: "no-repeat", position: "center" },
    center: { size: "auto", repeat: "no-repeat", position: "center" }
};

let activeMode = null;
let activePhotoQuery = null;
let stopActiveEffect = null;
let renderToken = 0;
let photoTimerId = null;
const photoStatusListeners = new Set();

/** Lets the sidebar show "loading…" / errors for the online photo mode. */
export function onPhotoStatusChange(listener) {
    photoStatusListeners.add(listener);
}

function setPhotoStatus(status) {
    for (const listener of photoStatusListeners) listener(status);
}

function stopCurrentBackground() {
    stopActiveEffect?.();
    stopActiveEffect = null;
    clearTimeout(photoTimerId);
    photoTimerId = null;
}

function resetLayer(opacity) {
    layer.replaceChildren();
    layer.removeAttribute("style");
    layer.style.background = "#000";
    layer.style.opacity = opacity;
}

function setLayerImage(url) {
    layer.style.backgroundImage = url ? `url(${JSON.stringify(url)})` : "";
}

function applyImageFilters() {
    const { mode, imageFilters } = getSettings().background;

    if (!isImageMode(mode)) {
        layer.style.filter = "";
        vignetteLayer.style.background = "";
        return;
    }

    const fit = IMAGE_FITS[imageFilters.fit] ?? IMAGE_FITS.cover;
    layer.style.backgroundSize = fit.size;
    layer.style.backgroundRepeat = fit.repeat;
    layer.style.backgroundPosition = fit.position;
    layer.style.filter = `blur(${imageFilters.blur}px) brightness(${imageFilters.brightness}%)`;

    const vignetteAlpha = (imageFilters.vignette / 100) * 0.8;
    vignetteLayer.style.background = vignetteAlpha > 0
        ? `radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,${vignetteAlpha}) 100%)`
        : "";
}

function renderPhotoCredit(photo) {
    photoCredit.replaceChildren();
    const showCredit = CREDITED_MODES.has(getSettings().background.mode) && photo?.author;
    photoCredit.hidden = !showCredit;
    if (!showCredit) return;

    const authorLink = document.createElement(photo.sourceUrl ? "a" : "span");
    authorLink.textContent = photo.author;
    if (photo.sourceUrl) authorLink.href = photo.sourceUrl;

    photoCredit.append(`${t("background_photo_credit_prefix")} `, authorLink);

    if (photo.license) {
        const license = document.createElement(photo.licenseUrl ? "a" : "span");
        license.textContent = photo.license;
        if (photo.licenseUrl) license.href = photo.licenseUrl;
        photoCredit.append(" · ", license);
    }
}

function scheduleNextPhoto({ afterError = false } = {}) {
    clearTimeout(photoTimerId);
    const interval = getSettings().background.onlinePhoto.interval;
    // After a failure (offline, rate limit) wait instead of retrying immediately; only timed intervals retry.
    const delay = afterError
        ? (Number.isFinite(Number(interval)) ? RETRY_AFTER_ERROR_MS : null)
        : msUntilNextPhoto(getSettings().background.onlinePhoto);
    if (delay !== null) {
        photoTimerId = setTimeout(() => showNextOnlinePhoto(), delay);
    }
}

async function showOnlinePhoto({ forceNew }) {
    const onlinePhoto = getSettings().background.onlinePhoto;
    const token = renderToken;

    // The saved photo may be gone (e.g. an expired Pixabay link from 1.0.x); then load a new one.
    if (!forceNew && !isPhotoChangeDue(onlinePhoto) && await canLoadImage(onlinePhoto.current.url)) {
        if (token !== renderToken) return;
        setLayerImage(onlinePhoto.current.url);
        renderPhotoCredit(onlinePhoto.current);
        scheduleNextPhoto();
        return;
    }
    if (token !== renderToken) return;

    // Show the previous photo right away while the next one loads.
    if (onlinePhoto.current) setLayerImage(onlinePhoto.current.url);
    renderPhotoCredit(onlinePhoto.current);
    await showNextOnlinePhoto();
}

/** Loads the next photo from the queue/network and shows it. */
export async function showNextOnlinePhoto() {
    const token = renderToken;
    setPhotoStatus("loading");

    try {
        const next = await pickNextPhoto(getSettings().background.onlinePhoto);
        if (token !== renderToken) return;

        await updateSettings(settings => {
            Object.assign(settings.background.onlinePhoto, next, { lastChangedAt: Date.now() });
        });
        setLayerImage(next.current.url);
        renderPhotoCredit(next.current);
        setPhotoStatus("idle");
        scheduleNextPhoto();
    } catch (error) {
        console.warn("Could not load an online photo:", error);
        if (token === renderToken) {
            setPhotoStatus("error");
            scheduleNextPhoto({ afterError: true });
        }
    } finally {
        // A newer render took over; don't leave the sidebar stuck on "loading".
        if (token !== renderToken) setPhotoStatus("idle");
    }
}

function showPhoto(photo) {
    setLayerImage(photo.url);
    renderPhotoCredit(photo);
}

/** While the page stays open, the next day's photo replaces this one after midnight. */
function scheduleNextPhotoOfTheDay(delay = msUntilNextDay()) {
    clearTimeout(photoTimerId);
    photoTimerId = setTimeout(() => showPhotoOfTheDay(), delay);
}

async function showPhotoOfTheDay() {
    const token = renderToken;
    const today = localDateKey();
    const saved = getSettings().background.photoOfTheDay;

    if (saved.photo) showPhoto(saved.photo);
    if (saved.date === today && await canLoadImage(saved.photo.url)) {
        if (token === renderToken) scheduleNextPhotoOfTheDay();
        return;
    }
    if (token !== renderToken) return;

    setPhotoStatus("loading");
    try {
        const photo = await fetchPhotoOfTheDay(today);
        if (!await canLoadImage(photo.url)) throw new Error(`Picture of the day did not load: ${photo.url}`);
        if (token !== renderToken) return;

        await updateSettings(settings => {
            settings.background.photoOfTheDay = { date: today, photo };
        });
        showPhoto(photo);
        setPhotoStatus("idle");
        scheduleNextPhotoOfTheDay();
    } catch (error) {
        console.warn("Could not load the picture of the day:", error);
        if (token !== renderToken) return;
        // Keep yesterday's photo (if any) and try again a bit later.
        setPhotoStatus("error");
        scheduleNextPhotoOfTheDay(RETRY_AFTER_ERROR_MS);
    }
}

async function render() {
    const token = ++renderToken;
    const { mode, effects, onlinePhoto } = getSettings().background;
    const isModeSwitch = activeMode !== null && activeMode !== mode;
    const isNewPhotoQuery = activeMode === "onlinePhoto" && mode === "onlinePhoto" && activePhotoQuery !== onlinePhoto.query;

    if (isModeSwitch) {
        layer.style.opacity = "0";
        await wait(FADE_MS);
        if (token !== renderToken) return;
    }

    stopCurrentBackground();
    resetLayer(isModeSwitch ? "0" : "1");
    activeMode = mode;
    activePhotoQuery = onlinePhoto.query;
    renderPhotoCredit(null);

    const effect = getEffect(mode);
    if (effect) {
        stopActiveEffect = effect.start(layer, effects[mode]);
    } else if (mode === "customImage") {
        setLayerImage(await loadCustomImage());
    }

    if (token !== renderToken) return;
    applyImageFilters();
    layer.style.opacity = "1";

    if (mode === "onlinePhoto") {
        await showOnlinePhoto({ forceNew: isNewPhotoQuery });
    } else if (mode === "photoOfTheDay") {
        await showPhotoOfTheDay();
    }
}

/** What requires re-rendering the background (filters are applied separately, without a restart). */
function selectRenderInputs(settings) {
    const { mode, effects, onlinePhoto } = settings.background;
    if (getEffect(mode)) return { mode, params: effects[mode] };
    if (mode === "onlinePhoto") return { mode, query: onlinePhoto.query };
    return { mode };
}

export async function initBackground() {
    // Subscribe first: the first render can wait for the network (online photo),
    // and changes made in the sidebar meanwhile must not be missed.
    subscribe(selectRenderInputs, () => render());
    subscribe(settings => settings.background.imageFilters, applyImageFilters);
    subscribe(settings => settings.background.onlinePhoto.interval, () => {
        if (getSettings().background.mode === "onlinePhoto") scheduleNextPhoto();
    });

    onCustomImageChange(() => {
        if (getSettings().background.mode === "customImage") render();
    });

    window.addEventListener("resize", debounce(() => {
        if (getEffect(activeMode)?.restartOnResize) render();
    }, 300));

    await render();
}
