const quoteContainer = document.getElementById("quote-container");
const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");
const quoteFontElement = document.getElementById("quote-font");
const quoteColorElement = document.getElementById("quote-color");
const quoteSizeElement = document.getElementById("quote-size");
const quoteToggleElement = document.getElementById("toggle-quote");
const quoteDefaultFont = "Arial";
const quoteDefaultColor = "#6c6c6c";
const quoteDefaultTextSize = "10";
const quoteDefaultShowState = false;

function loadQuoteOfTheDay() {
    const quoteKey = "quotableQuote";
    const fetchDateKey = "quotableQuoteDate";
    const today = new Date().toISOString().split("T")[0];

    const savedQuote = localStorage.getItem(quoteKey);
    const savedDate = localStorage.getItem(fetchDateKey);

    if (savedQuote && savedDate === today) {
        const quoteData = JSON.parse(savedQuote);
        displayQuote(quoteData.content, quoteData.author);
    } else {
        fetch("https://api.quotable.io/random")
            .then(res => res.json())
            .then(data => {
                const quote = data.content;
                const author = data.author;

                localStorage.setItem(quoteKey, JSON.stringify({content: quote, author}));
                localStorage.setItem(fetchDateKey, today);

                displayQuote(quote, author);
            })
            .catch(() => {
                quoteText.textContent = "Could not load quote.";
                quoteAuthor.textContent = "";
            });
    }
}

function displayQuote(quote, author) {
    quoteText.textContent = `“${quote}”`;
    quoteAuthor.textContent = `— ${author}`;
}

function applyQuoteSettings() {
    const settings = loadCustomSettings();
    if (!settings.quoteFont) {
        settings.quoteFont = quoteDefaultFont;
    }

    if (!settings.quoteColor) {
        settings.quoteColor = quoteDefaultColor;
    }

    if (!settings.quoteSize) {
        settings.quoteSize = quoteDefaultTextSize;
    }

    if (settings.quoteShowState === undefined || settings.quoteShowState === null) {
        settings.quoteShowState = quoteDefaultShowState;
    }
    saveCustomSettings(settings);

    quoteText.style.fontFamily = settings.quoteFont;
    quoteAuthor.style.fontFamily = settings.quoteFont;
    quoteText.style.color = settings.quoteColor;
    quoteAuthor.style.color = settings.quoteColor;
    quoteText.style.fontSize = `${settings.quoteSize}px`;
    quoteAuthor.style.fontSize = `${Math.max(settings.quoteSize - 2, 10)}px`;

    quoteContainer.style.display = settings.quoteShowState ? "block" : "none";

    // Sync UI controls
    quoteFontElement.value = settings.quoteFont;
    quoteColorElement.value = settings.quoteColor;
    quoteSizeElement.value = settings.quoteSize;
    quoteToggleElement.checked = settings.quoteShowState;
}

function setupQuoteWidgetControlListener(element, inputEventType, jsonVariable, defaultValue) {
    element.addEventListener(inputEventType, e => {
        const settings = loadCustomSettings();
        settings[jsonVariable] = e.target.value;
        saveCustomSettings(settings);
        applyQuoteSettings();
    });

    element.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const settings = loadCustomSettings();
        settings[jsonVariable] = defaultValue;
        element.value = defaultValue;
        saveCustomSettings(settings);
        applyQuoteSettings();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadQuoteOfTheDay();
    applyQuoteSettings();

    setupQuoteWidgetControlListener(quoteFontElement, "change", "quoteFont", quoteDefaultFont);
    setupQuoteWidgetControlListener(quoteColorElement, "input", "quoteColor", quoteDefaultColor);
    setupQuoteWidgetControlListener(quoteSizeElement, "input", "quoteSize", quoteDefaultTextSize);

    quoteToggleElement.addEventListener("change", e => {
        const settings = loadCustomSettings();
        settings.quoteShowState = e.target.checked;
        saveCustomSettings(settings);
        applyQuoteSettings();
    });

    document.getElementById("reset-quote-widget").addEventListener("click", () => {
        const settings = loadCustomSettings();
        delete settings.quoteFont;
        delete settings.quoteColor;
        delete settings.quoteSize;
        delete settings.quoteShowState;
        saveCustomSettings(settings);
        applyQuoteSettings();
    });
});
