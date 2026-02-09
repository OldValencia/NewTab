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

const stars = new Set();
const miniStars = new Set();
const shootingStars = new Set();

function cleanupStars() {
    stars.forEach(star => {
        starObserver.unobserve(star);
        star.remove();
    });
    miniStars.forEach(star => {
        starObserver.unobserve(star);
        star.remove();
    });
    shootingStars.forEach(star => {
        starObserver.unobserve(star);
        star.remove();
    });
    stars.clear();
    miniStars.clear();
    shootingStars.clear();
}

function disableStarfield() {
    cleanupStars();
    clearInterval(window.starfieldInterval);
    window.starfieldInterval = null;
}

function enableStarfield() {
    disableStarfield();
    cleanupBeforeEnableBackground();

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < STARFIELD_CONFIG.numStars; i++) {
        fragment.appendChild(createStar());
    }
    for (let i = 0; i < STARFIELD_CONFIG.numMiniStars; i++) {
        fragment.appendChild(createStar({mini: true}));
    }
    backgroundLayer.appendChild(fragment);

    window.starfieldInterval = setInterval(() => {
        if (Math.random() < STARFIELD_CONFIG.shootingStarChance) {
            createShootingStar();
        }
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
    shootingStars.add(star);

    setTimeout(() => {
        star.remove();
        shootingStars.delete(star);
    }, STARFIELD_CONFIG.shootingStarLifetime);
}

function createStar({mini = false} = {}) {
    const {innerWidth: width, innerHeight: height} = window;
    const star = document.createElement('div');
    starObserver.observe(star);
    star.classList.add(mini ? 'mini-star' : 'star');

    const size = mini ? Math.random() + 0.2 : Math.random() * 2 + 0.5;
    const brightness = (mini ? 0 : Math.random() < 0.35)
        ? 200 + Math.floor(Math.random() * 55)
        : 90 + Math.floor(Math.random() * 50);

    star.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        top: ${Math.random() * height}px;
        left: ${Math.random() * width}px;
        animation-delay: ${Math.random() * 5}s;
        animation-duration: ${3 + Math.random() * 3}s;
        background: rgb(${brightness}, ${brightness}, ${brightness});
        opacity: 0;
    `;

    if (mini) {
        miniStars.add(star);
    } else {
        stars.add(star);
    }

    return star;
}

const resizeHandler = throttle(() => {
    const settings = loadCustomSettings();
    if (settings.bg.bgMode === "stars") {
        enableStarfield();
    }
}, 1500);

window.addEventListener('resize', resizeHandler);
