/**
 * Entry point of the new tab page. Startup order:
 *   1. settings (migrates 1.0.x data on first run) and translations
 *   2. page widgets and background
 *   3. settings sidebar
 */
import { getSettings, initSettings, subscribe } from "./core/settings.js";
import { applyTranslations, initI18n } from "./core/i18n.js";
import { applyIcons } from "./core/icons.js";
import { initBackground } from "./backgrounds/manager.js";
import { initBackgroundSchedule } from "./backgrounds/schedule.js";
import { initClocks } from "./widgets/clocks.js";
import { initLinks } from "./widgets/links.js";
import { initWeather } from "./widgets/weather.js";
import { initBookmarks } from "./widgets/bookmarks.js";
import { initHotkeys } from "./hotkeys.js";
import { initSidebar } from "./sidebar/sidebar.js";
import { syncBoundControls } from "./sidebar/controls.js";
import { initLanguageSection } from "./sidebar/language-section.js";
import { initBackupSection } from "./sidebar/backup-section.js";
import { initClocksSection } from "./sidebar/clocks-section.js";
import { initLinksSection } from "./sidebar/links-section.js";
import { initBackgroundSection } from "./sidebar/background-section.js";
import { initWeatherSection } from "./sidebar/weather-section.js";
import { initBookmarksSection } from "./sidebar/bookmarks-section.js";
import { initVersionInfo } from "./sidebar/version-info.js";

async function start() {
    await initSettings();
    await initI18n(getSettings().locale);
    applyTranslations();
    applyIcons();

    initClocks();
    initLinks();
    initWeather();
    initBackgroundSchedule(); // may switch the mode, so it runs before the first background render
    const backgroundReady = initBackground();
    const bookmarksReady = initBookmarks();

    initSidebar();
    initLanguageSection();
    initBackupSection();
    initClocksSection();
    initLinksSection();
    initBackgroundSection();
    initWeatherSection();
    initBookmarksSection();
    initVersionInfo();
    initHotkeys();

    // Theme-dependent inputs (clock toggles, links color) follow the selected background.
    subscribe(settings => settings.background.mode, syncBoundControls);

    await Promise.all([backgroundReady, bookmarksReady]);
    document.body.classList.add("ready");
}

start().catch(error => console.error("New tab failed to start:", error));
