const greetings = [
    "Hey {name}, the world’s got plans for you today.",
    "Good morning, {name}! Let's stir some magic.",
    "Rise and sparkle — the day awaits you, {name}.",
    "Nothing can dim your glow today, {name}.",
    "What’s stopping you, {name}? Go get it.",
    "Look at you, {name} — a walking spark of brilliance.",
    "Make today unforgettable, {name}.",
    "This moment? It’s yours, {name}.",
    "The sky called — it’s not your limit, {name}.",
    "Kindness looks powerful on you, {name}.",
    "Let your courage do the talking, {name}.",
    "Big dreams? You wear them well, {name}.",
    "Ready to move mountains, {name}?",
    "Today’s stage belongs to you, {name}.",
    "Let your thoughts take flight, {name}.",
    "Fuel up on confidence — you’ve got this, {name}.",
    "Be fierce, be kind, be {name}.",
    "A new chapter starts now — page one, {name}.",
    "Even the stars admire your shine, {name}.",
    "Own this day like only you can, {name}.",
    "Lead with fire in your heart, {name}.",
    "Walk tall — you carry greatness, {name}.",
    "Eyes on the horizon, {name}. Let’s go.",
    "Your energy? Unstoppable, {name}.",
    "The world bends slightly when you walk in, {name}.",
    "Got a minute? Make it count, {name}.",
    "You don't just inspire — you ignite, {name}.",
    "Every step you take reshapes the path, {name}.",
    "Let curiosity be your compass today, {name}.",
    "Storms pass when you arrive, {name}.",
    "No need to wait for permission — go shine, {name}.",
    "Every heartbeat writes a story — yours, {name}.",
    "Move like you're made of stardust, {name}.",
    "Look in the mirror — there's your superpower, {name}.",
    "Let the day feel your presence, {name}.",
    "Big energy, big heart, that’s you, {name}.",
    "A spark? No — you’re the whole fire, {name}.",
    "Show the world how it’s done, {name}.",
    "Give the day something to remember, {name}.",
    "Speak your truth louder today, {name}.",
    "Keep growing, keep glowing, {name}.",
    "The day is better just because you’re in it, {name}.",
    "Breathe deep — greatness is in the air, {name}.",
    "Your footsteps echo with purpose, {name}.",
    "Start where you are. Blaze your trail, {name}.",
    "You redefine awesome, {name}.",
    "Your vibe? Pure electricity, {name}.",
    "Confidence fits you like armor, {name}.",
    "Let your mind wander — that’s where wonder lives, {name}.",
    "Today is your canvas, {name}. Paint it bold.",
    "You're not late — you’re right on time, {name}.",
    "Every idea you touch turns vivid, {name}.",
    "Go ahead, rewrite the rules, {name}.",
    "Life’s better when you show up as yourself, {name}."
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
