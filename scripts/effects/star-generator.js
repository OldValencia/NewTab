const numStars = 800;
const numMiniStars = 50;

function disableStarfield() {
    document.querySelectorAll(".star, .mini-star, .shooting-star").forEach(el => el.remove());
    clearInterval(window.starfieldInterval);
}

function enableStarfield() {
    const container = document.getElementById("background-layer");
    disableDynamicBackground(container);
    for (let i = 0; i < numStars; i++) createStar(container);
    for (let i = 0; i < numMiniStars; i++) createStar(container, {mini: true});
    window.starfieldInterval = setInterval(() => {
        if (Math.random() < 0.2) createShootingStar(container);
    }, 10000);
}

function createShootingStar(container) {
    const star = document.createElement('div');
    star.classList.add('shooting-star');
    star.style.top = Math.random() * (window.innerHeight * 0.5) + 'px';
    star.style.left = (window.innerWidth * 0.7 + Math.random() * window.innerWidth * 0.3) + 'px';
    container.appendChild(star);
    setTimeout(() => star.remove(), 2500);
}

function createStar(container, { mini = false } = {}) {
    const star = document.createElement('div');
    star.classList.add(mini ? 'mini-star' : 'star');

    const size = mini ? Math.random() + 0.2 : Math.random() * 2 + 0.5;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    star.style.top = Math.random() * window.innerHeight + 'px';
    star.style.left = Math.random() * window.innerWidth + 'px';

    star.style.animationDelay = (Math.random() * 5) + 's';
    star.style.animationDuration = (3 + Math.random() * 3) + 's';

    const isBright = Math.random() < (mini ? 0 : 0.35);
    const brightness = isBright ? 200 + Math.floor(Math.random() * 55) : 90 + Math.floor(Math.random() * 50);
    const opacity = 0;

    star.style.background = `rgb(${brightness}, ${brightness}, ${brightness})`;
    star.style.opacity = opacity;

    container.appendChild(star);
}