# New Tab Extension

A Firefox extension (Manifest V2) that replaces `about:newtab` and the homepage with a customizable page:
procedural backgrounds, a custom image or online photos, up to three clocks, a links grid, a bookmarks sidebar,
a weather widget (Open-Meteo), settings export/import, 7 UI languages.

Published on AMO: https://addons.mozilla.org/en-US/firefox/addon/newtabaddon/ — **it has real users**, so every
change must keep settings saved by older versions working (see "Compatibility rules").

## Tech stack

- Vanilla JavaScript **ES modules** (`<script type="module" src="scripts/app.js">`), HTML, CSS.
  No framework, no bundler, no npm dependencies.
- Browser APIs: the `browser.*` namespace (Promise-based), not `chrome.*`.
- Permissions: only `storage` and `bookmarks`. Network calls go to Open-Meteo, OpenStreetMap Nominatim (name of the
  geolocated place, once per click), Picsum, Openverse,
  the linked sites' `/favicon.ico` and (opt-in) Google's favicon service — all allow CORS, so no host permissions.

## Project layout

```
manifest.json
index.html                      Static markup of the page and the settings sidebar
scripts/app.js                  Entry point: startup order of everything below
scripts/background.js           Event page: toolbar button opens a new tab
scripts/hotkeys.js              ← bookmarks, → settings, 1–9 open links
scripts/core/
  settings.js                   Settings store (storage.local, in-memory cache, subscribe, cross-tab sync)
  defaults.js                   Default settings and per-background themes (clock/link styling)
  normalize.js                  Repairs any stored/imported object into the current schema
  migration.js                  1.0.x localStorage format → current schema
  image-store.js                The uploaded background image (stored separately, can be MBs)
  i18n.js, locales.js           Translations from settings/localization.json
  dialog.js                     In-page confirm/message dialogs (instead of alert/confirm)
  icons.js                      Line SVG icons for the panels (<span data-icon="name">, createIcon())
  time-format.js                Pure clock/date formatting with Intl time zones
  color.js, utils.js            Small helpers
scripts/backgrounds/
  registry.js                   List of procedural effects (order = sidebar order)
  effects/*.js                  One effect per file: { id, labelKey, defaults, controls, restartOnResize, start() }
  manager.js                    Shows the selected background, fades between modes, filters, photo credit
  online-photo.js               Picsum (random) / Openverse (keyword) photo queue
  canvas.js, controls-presets.js
scripts/widgets/                What renders on the page: clocks, links, weather (+ api, conditions, icons, effects), bookmarks,
                                favicon.js (site icons for links and bookmarks)
scripts/sidebar/                Settings UI, one file per section; controls.js binds inputs to settings
settings/localization.json      All UI strings: { key: { en, ru, pl, de, es, be, uk } }
styles/                         CSS per area; panels.css = shared look of both side panels (colors, controls);
                                styles/background/ for effect CSS; styles/fonts.css bundled fonts
fonts/                          Bundled font files + licenses (fonts/README.md)
tests/                          node:test tests + fixtures captured from a real 1.0.2 profile
release.py                      Builds "New Tab Extension.zip" for AMO (fonts, icons, scripts, settings, styles)
```

## Data model

- `browser.storage.local["settings"]` — the whole settings object (schema in `scripts/core/defaults.js`,
  `schemaVersion: 2`). Top level: `locale`, `background` (`mode`, `effects`, `imageFilters`, `onlinePhoto`),
  `themes` (per background mode: `linksColor`, `showTime`, `showDate`, `clocks[]`), `links`, `weather`, `bookmarks`.
- `browser.storage.local["customImage"]` — uploaded picture as a data: URL.
- `localStorage["section_<name>"]` — open/closed sidebar sections (per device).
- `localStorage["bookmarks_open_folders"]` — ids of open bookmark folders (per device).
- Left untouched for safety: `localStorage["custom_settings"]` (1.0.x settings, migrated on first run) and
  `storage.local` keys `custom_settings`, `customNotifications`, `isNotificationsEnabled` from 1.0.x.

## Compatibility rules (most important)

1. **Users must never have to reconfigure after an update.** Never rename/remove a stored key or change its type
   without handling the old shape. Prefer: add the field to `createDefaultSettings()` (normalize fills it in for
   everyone) and, if old data must be transformed, do it in `migration.js` / `normalize.js` with a test.
2. Choose defaults for new settings that keep the current behavior for existing users.
3. Do not add `permissions` / host permissions without the user's agreement — Firefox disables the updated add-on
   until each user accepts the prompt. Removing unused permissions is fine.
4. Do not change the add-on `id` in `browser_specific_settings`.
5. Visual defaults (fonts, colors, layout) are part of the experience — change them only on purpose.

## Coding guidelines

The goal is simple, working code that a human can read without effort.

- Small, single-purpose functions with descriptive names; early returns over nesting; `const` by default.
- **Settings:** read with `getSettings()` (never mutate it), change with
  `updateSettings(settings => { settings.links.visible = true; })`. React to changes with
  `subscribe(settings => <small selection>, callback)` instead of calling other modules' render functions.
- Sidebar inputs: use `bindControl(input, { get, set, defaultValue })` — it saves, syncs and adds right-click reset.
- Attach event listeners once (in `init*` functions). Code that re-renders must only touch elements it recreates.
- Build DOM with `createElement()` / `textContent`. No `innerHTML` (AMO lint flags it); translated strings with
  markup go through `data-i18n-html`.
- Every user-facing string goes through `t("key")` or a `data-i18n*` attribute and must exist in **all 7 locales**.
- Code, comments, identifiers and console messages are in English. Comment the *why*, not the *what*.
- Network calls: `try/catch`, check `response.ok`, show a localized message in the UI (not `alert`).
- Keep the style of the surrounding code: 4-space indent, double quotes, semicolons.
- Don't add dependencies, a build step or frameworks without asking.

## Common tasks

### Run and check
1. Firefox → `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → `manifest.json`; open a new tab.
2. After edits press **Reload** on the add-on card. Page errors: F12 on the new tab.
3. `node --test "tests/*.test.mjs"` — migration, normalization, time formatting and weather tests.
4. `npx web-ext lint --source-dir . --ignore-files "tests/**" "Screenshots/**" review.md "*.zip"` — must stay at
   0 errors / 0 warnings (AMO runs the same linter).

### Add a background effect
1. Create `scripts/backgrounds/effects/<name>.js` exporting `{ id, labelKey, defaults, controls, restartOnResize, start }`.
   `start(layer, params)` draws into the layer and returns a stop function (cancel timers/animation frames there).
2. Add it to `EFFECTS` in `scripts/backgrounds/registry.js` (the sidebar and settings pick it up automatically).
3. Add its theme to `THEME_DEFAULTS` in `scripts/core/defaults.js`, effect CSS (if any) in `styles/background/`,
   and translation keys for the label and controls.

### Add a setting
1. Add it with a behavior-preserving default to `createDefaultSettings()`; add validation in `normalize.js` if it
   is not a plain boolean/number/string/color.
2. Add the control to `index.html` (with `data-i18n`) and bind it in the matching `scripts/sidebar/*-section.js`.
3. Use it via `getSettings()` + `subscribe()` in the widget. Add/adjust tests if migration is involved.

### Add a translated string
Add `"<key>": { "en", "ru", "pl", "de", "es", "be", "uk" }` to `settings/localization.json`, then use
`t("<key>")` or `data-i18n="<key>"`. Placeholders: `t("key", { name: value })` replaces `{name}`.

### Release
1. Bump `version` in `manifest.json`.
2. Run the tests, the linter and the manual checklist below on a profile that has data from the previous version.
3. `python release.py` → upload `New Tab Extension.zip` to AMO (the zip is git-ignored).

## Manual verification checklist

- New tab opens with DevTools console clean.
- Every background mode can be selected and back; clocks and links stay visible.
- Changed settings survive a reload; with two new tabs open, a change in one shows up in the other.
- A non-English language shows translated text in the new UI.
- Upgrade path: put a 1.0.x `custom_settings` (see `tests/fixtures/`) into localStorage, clear `storage.local`,
  reload — everything looks as before.
