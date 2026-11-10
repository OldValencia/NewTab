/** Languages the UI is translated into. Names are shown in their own language. */
export const SUPPORTED_LOCALES = [
    { code: "en", name: "English" },
    { code: "ru", name: "Русский" },
    { code: "pl", name: "Polski" },
    { code: "de", name: "Deutsch" },
    { code: "es", name: "Español" },
    { code: "be", name: "Беларуская" },
    { code: "uk", name: "Українська" }
];

export const SUPPORTED_LOCALE_CODES = SUPPORTED_LOCALES.map(locale => locale.code);
