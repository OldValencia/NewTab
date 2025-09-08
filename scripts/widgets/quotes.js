const quoteContainer = document.getElementById("quote-container");
const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");
const quoteFontElement = document.getElementById("quote-font");
const quoteColorElement = document.getElementById("quote-color");
const quoteSizeElement = document.getElementById("quote-size");
const quoteToggleElement = document.getElementById("toggle-quote");
const quoteDefaultFont = "SF Pro Display";
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

async function applyQuoteSettings() {
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

    console.log("Quote widget visibility changed1:", settings.quoteShowState);
    if (settings.quoteShowState === undefined) {
        settings.quoteShowState = quoteDefaultShowState;
    }
    console.log("Quote widget visibility changed2:", settings.quoteShowState);
    await saveCustomSettings(settings);
    console.log("Quote widget visibility changed3:", settings.quoteShowState);

    quoteText.style.fontFamily = settings.quoteFont;
    quoteAuthor.style.fontFamily = settings.quoteFont;
    quoteText.style.color = settings.quoteColor;
    quoteAuthor.style.color = settings.quoteColor;
    quoteText.style.fontSize = `${settings.quoteSize}px`;
    quoteAuthor.style.fontSize = `${Math.max(settings.quoteSize - 2, 10)}px`;

    console.log("Quote widget visibility changed4:", settings.quoteShowState);
    quoteContainer.style.display = settings.quoteShowState ? "block" : "none";

    // Sync UI controls
    quoteFontElement.value = settings.quoteFont;
    quoteColorElement.value = settings.quoteColor;
    quoteSizeElement.value = settings.quoteSize;
    quoteToggleElement.checked = settings.quoteShowState;
}

function setupQuoteWidgetControlListener(element, inputEventType, jsonVariable, defaultValue) {
    element.addEventListener(inputEventType, async e => {
        const settings = loadCustomSettings();
        settings[jsonVariable] = e.target.value;
        await saveCustomSettings(settings);
        await applyQuoteSettings();
    });

    element.addEventListener("contextmenu", async (e) => {
        e.preventDefault();
        const settings = loadCustomSettings();
        settings[jsonVariable] = defaultValue;
        element.value = defaultValue;
        await saveCustomSettings(settings);
        await applyQuoteSettings();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const settings = loadCustomSettings();
    if (settings.quoteShowState) {
        loadQuoteOfTheDay();
    }
    await applyQuoteSettings();
});

setupQuoteWidgetControlListener(quoteFontElement, "change", "quoteFont", quoteDefaultFont);
setupQuoteWidgetControlListener(quoteColorElement, "input", "quoteColor", quoteDefaultColor);
setupQuoteWidgetControlListener(quoteSizeElement, "input", "quoteSize", quoteDefaultTextSize);

quoteToggleElement.addEventListener("change", async e => {
    const settings = loadCustomSettings();
    settings.quoteShowState = e.target.checked;
    await saveCustomSettings(settings);
    console.log("Quote widget visibility changed:", settings.quoteShowState);
    loadQuoteOfTheDay();
    await applyQuoteSettings();
});

document.getElementById("reset-quote-widget").addEventListener("click", async () => {
    const settings = loadCustomSettings();
    delete settings.quoteFont;
    delete settings.quoteColor;
    delete settings.quoteSize;
    delete settings.quoteShowState;
    await saveCustomSettings(settings);
    await applyQuoteSettings();
});
