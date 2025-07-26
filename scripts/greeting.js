const greetings = [
    "Hello, {name}! Ready to conquer the day?",
    "Good vibes only, {name}!",
    "Rise and shine, {name}!",
    "Keep going, {name} — you're doing great!",
    "Hey {name}, make today count!",
    "Smile, {name}! It suits you.",
    "You got this, {name}!",
    "Another chance to shine, {name}!",
    "Let’s make magic today, {name}!",
    "Stay curious, {name}.",
    "Adventure awaits, {name}!",
    "Breathe in confidence, {name}.",
    "Make it epic, {name}!",
    "You're unstoppable, {name}!",
    "Let your light shine, {name}.",
    "Time to thrive, {name}!",
    "Dream big, {name}!",
    "Hello world — and hello {name}!",
    "Be bold today, {name}.",
    "You’re the main character, {name}!",
    "Today is yours, {name}.",
    "Shine brighter, {name}.",
    "Let’s do this, {name}!",
    "You’re a legend, {name}.",
    "The world needs your spark, {name}.",
    "You’re pure brilliance, {name}.",
    "Lead with kindness, {name}.",
    "You’re a masterpiece, {name}.",
    "You’re the vibe, {name}.",
    "Let your energy flow, {name}.",
    "You’re the reason someone smiles, {name}.",
    "You’re magic, {name}.",
    "You’re the sunshine, {name}.",
    "You’re the moment, {name}.",
    "You’re the spark, {name}.",
    "You’re the dreamer, {name}.",
    "You’re the doer, {name}.",
    "You’re the light, {name}.",
    "You’re the fire, {name}.",
    "You’re the calm, {name}.",
    "You’re the storm, {name}.",
    "You’re the balance, {name}.",
    "You’re the joy, {name}.",
    "You’re the peace, {name}.",
    "You’re the strength, {name}.",
    "You’re the wisdom, {name}.",
    "You’re the voice, {name}.",
    "You’re the rhythm, {name}.",
    "You’re the melody, {name}.",
    "You’re the harmony, {name}.",
    "You’re the beat, {name}.",
    "You’re the pulse, {name}.",
    "You’re the soul, {name}.",
    "You’re the heart, {name}.",
    "You’re the mind, {name}.",
    "You’re the spirit, {name}.",
    "You’re the essence, {name}.",
    "You’re the truth, {name}.",
    "You’re the vision, {name}.",
    "You’re the dream, {name}.",
    "You’re the reality, {name}.",
    "You’re the hope, {name}.",
    "You’re the future, {name}.",
    "You’re the now, {name}.",
    "You’re the change, {name}.",
    "You’re the growth, {name}.",
    "You’re the evolution, {name}.",
    "You’re the revolution, {name}.",
    "You’re the inspiration, {name}.",
    "You’re the motivation, {name}.",
    "You’re the celebration, {name}.",
    "You’re the transformation, {name}.",
    "You’re the elevation, {name}.",
    "You’re the illumination, {name}.",
    "You’re the innovation, {name}.",
    "You’re the creation, {name}.",
    "You’re the foundation, {name}.",
    "You’re the destination, {name}.",
    "You’re the journey, {name}.",
    "You’re the path, {name}.",
    "You’re the guide, {name}.",
    "You’re the leader, {name}.",
    "You’re the pioneer, {name}.",
    "You’re the explorer, {name}.",
    "You’re the adventurer, {name}.",
    "You’re the builder, {name}.",
    "You’re the architect, {name}.",
    "You’re the artist, {name}.",
    "You’re the poet, {name}.",
    "You’re the storyteller, {name}.",
    "You’re the thinker, {name}.",
    "You’re the creator, {name}.",
    "You’re the believer, {name}.",
    "You’re the achiever, {name}.",
    "You’re the winner, {name}.",
    "You’re the champion, {name}.",
    "You’re the hero, {name}.",
    "You’re the legend, {name}."
];

const greetingFontSelect = document.getElementById("greeting-font");
const greetingColorInput = document.getElementById("greeting-color");
const greetingSizeInput = document.getElementById("greeting-size");
const greetingToggleCheckbox = document.getElementById("toggle-greeting");
const greetingResetButton = document.getElementById("reset-greeting-widget");
const greetingElement = document.getElementById("greeting");
const greetingUsernameInput = document.getElementById("greeting-username");
const defaultGreetingFont = "Arial";
const defaultGreetingColor = "#ffffff";
const defaultGreetingTextSize = 18;
const defaultGreetingEnabledState = false;
const defaultGreetingUsername = "Friend";

function loadGreetingSettings() {
    const settings = loadCustomSettings();

    if (!settings.greetingFont) {
        settings.greetingFont = defaultGreetingFont;
    }
    greetingFontSelect.value = settings.greetingFont;

    if (!settings.greetingColor) {
        settings.greetingColor = defaultGreetingColor;
    }
    greetingColorInput.value = settings.greetingColor;

    if (!settings.greetingSize) {
        settings.greetingSize = defaultGreetingTextSize;
    }
    greetingSizeInput.value = parseInt(settings.greetingSize);

    if (settings.greetingEnabled === undefined || settings.greetingEnabled === null) {
        settings.greetingEnabled = defaultGreetingEnabledState;
    }
    greetingToggleCheckbox.checked = settings.greetingEnabled;

    saveCustomSettings(settings);
}

function saveGreetingSettings() {
    const settings = loadCustomSettings();
    settings.greetingFont = greetingFontSelect.value;
    settings.greetingColor = greetingColorInput.value;
    settings.greetingSize = greetingSizeInput.value + "px";
    settings.greetingEnabled = greetingToggleCheckbox.checked;
    settings.userName = greetingUsernameInput.value;
    saveCustomSettings(settings);
    updateGreeting();
}

function updateGreeting() {
    loadGreetingSettings();
    const settings = loadCustomSettings();
    if (!settings.userName) {
        settings.userName = defaultGreetingUsername;
        saveCustomSettings(settings);
    }

    if (!settings.greetingEnabled) {
        greetingElement.textContent = "";
        return;
    }

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    greetingElement.textContent = randomGreeting.replace("{name}", settings.userName);
    greetingElement.style.fontFamily = settings.greetingFont;
    greetingElement.style.fontSize = settings.greetingSize;
    greetingElement.style.color = settings.greetingColor;
}

// Reset button
greetingResetButton.addEventListener("click", () => {
    greetingFontSelect.value = defaultGreetingFont;
    greetingColorInput.value = defaultGreetingColor;
    greetingSizeInput.value = defaultGreetingTextSize;
    greetingUsernameInput.value = defaultGreetingUsername;

    saveGreetingSettings();
});

// Event listeners
[greetingFontSelect, greetingColorInput, greetingSizeInput, greetingToggleCheckbox, greetingUsernameInput].forEach(el => {
    el.addEventListener("input", saveGreetingSettings);
});

document.addEventListener("DOMContentLoaded", () => {
    loadGreetingSettings();
    updateGreeting();
});
