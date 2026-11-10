const STAR_COUNT = 800;
const MINI_STAR_COUNT = 50;
const SHOOTING_STAR_CHANCE = 0.2;
const SHOOTING_STAR_CHECK_INTERVAL_MS = 10000;
const SHOOTING_STAR_LIFETIME_MS = 2500;

function createStar({ mini }) {
    const star = document.createElement("div");
    star.className = mini ? "mini-star" : "star";

    const size = mini ? Math.random() + 0.2 : Math.random() * 2 + 0.5;
    const isBright = !mini && Math.random() < 0.35;
    const brightness = isBright
        ? 200 + Math.floor(Math.random() * 55)
        : 90 + Math.floor(Math.random() * 50);

    star.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        top: ${Math.random() * window.innerHeight}px;
        left: ${Math.random() * window.innerWidth}px;
        animation-delay: ${Math.random() * 5}s;
        animation-duration: ${3 + Math.random() * 3}s;
        background: rgb(${brightness}, ${brightness}, ${brightness});
        opacity: 0;
    `;
    return star;
}

function launchShootingStar(layer) {
    const { innerWidth: width, innerHeight: height } = window;
    const star = document.createElement("div");
    star.className = "shooting-star";
    star.style.top = `${Math.random() * height * 0.5}px`;
    star.style.left = `${width * 0.7 + Math.random() * width * 0.3}px`;
    layer.appendChild(star);
    setTimeout(() => star.remove(), SHOOTING_STAR_LIFETIME_MS);
}

export const stars = {
    id: "stars",
    labelKey: "background_section_stars_background",
    defaults: {},
    controls: [],
    restartOnResize: true,

    start(layer) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < STAR_COUNT; i++) fragment.appendChild(createStar({ mini: false }));
        for (let i = 0; i < MINI_STAR_COUNT; i++) fragment.appendChild(createStar({ mini: true }));
        layer.appendChild(fragment);

        const intervalId = setInterval(() => {
            if (Math.random() < SHOOTING_STAR_CHANCE) launchShootingStar(layer);
        }, SHOOTING_STAR_CHECK_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }
};
