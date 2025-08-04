const STARFIELD_CONFIG = {
    numStars: 800,
    numMiniStars: 50,
    shootingStarChance: 0.2,
    shootingStarInterval: 10000,
    shootingStarLifetime: 2500
};

const starObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            entry.target.remove();
        }
    });
}, {
    root: null,
    threshold: 0
});

function disableStarfield() {
    document.querySelectorAll(".star, .mini-star, .shooting-star").forEach(el => {
        starObserver.unobserve(el);
        el.remove();
    });
    clearInterval(window.starfieldInterval);
}

function enableStarfield() {
    disableStarfield();
    cleanupBeforeEnableBackground();
    for (let i = 0; i < STARFIELD_CONFIG.numStars; i++) createStar();
    for (let i = 0; i < STARFIELD_CONFIG.numMiniStars; i++) createStar({mini: true});
    window.starfieldInterval = setInterval(() => {
        if (Math.random() < STARFIELD_CONFIG.shootingStarChance) createShootingStar();
    }, STARFIELD_CONFIG.shootingStarInterval);
}

function createShootingStar() {
    const {innerWidth: width} = window;
    const star = document.createElement('div');
    starObserver.observe(star);
    star.classList.add('shooting-star');
    star.style.top = Math.random() * (width * 0.5) + 'px';
    star.style.left = (width * 0.7 + Math.random() * width * 0.3) + 'px';
    backgroundLayer.appendChild(star);
    setTimeout(() => star.remove(), STARFIELD_CONFIG.shootingStarLifetime);
}

function createStar({mini = false} = {}) {
    const {innerWidth: width, innerHeight: height} = window;
    const star = document.createElement('div');
    starObserver.observe(star);
    star.classList.add(mini ? 'mini-star' : 'star');

    const size = mini ? Math.random() + 0.2 : Math.random() * 2 + 0.5;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    star.style.top = Math.random() * height + 'px';
    star.style.left = Math.random() * width + 'px';

    star.style.animationDelay = (Math.random() * 5) + 's';
    star.style.animationDuration = (3 + Math.random() * 3) + 's';

    const isBright = Math.random() < (mini ? 0 : 0.35);
    const brightness = isBright ? 200 + Math.floor(Math.random() * 55) : 90 + Math.floor(Math.random() * 50);
    const opacity = 0;

    star.style.background = `rgb(${brightness}, ${brightness}, ${brightness})`;
    star.style.opacity = opacity;

    backgroundLayer.appendChild(star);
}

function throttle(fn, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

window.addEventListener('resize', throttle(() => {
    const settings = loadCustomSettings();
    if (settings.bg.bgMode === "stars") {
        enableStarfield();
    }
}, 1500));