const SECONDS_PER_EARTH_YEAR = 30;
const EARTH_YEAR_DAYS = 365.2563;

const PLANETS = [
    { name: "mercury", orbit: 70, size: 4, color: "#9f5e26", days: 87.5 },
    { name: "venus", orbit: 100, size: 8, color: "#BEB768", days: 224.7 },
    { name: "earth", orbit: 145, size: 6, color: "#11abe9", days: 365.2563, hasMoon: true },
    { name: "mars", orbit: 190, size: 6, color: "#cf3921", days: 687 },
    { name: "jupiter", orbit: 340, size: 18, color: "#c76e2a", days: 4331 },
    { name: "saturn", orbit: 440, size: 12, color: "#e7c194", days: 10747, hasRings: true },
    { name: "uranus", orbit: 520, size: 10, color: "#b5e3e3", days: 30589 },
    { name: "neptune", orbit: 630, size: 10, color: "#175e9e", days: 59802 },
    { name: "pluto", orbit: 780, size: 3, color: "#fff", days: 90580 },
    { name: "asteroids-belt", orbit: 300, size: 210, color: "transparent", days: 2191, isBelt: true }
];

function revolutionDuration(days) {
    return `${(days * SECONDS_PER_EARTH_YEAR / EARTH_YEAR_DAYS).toFixed(2)}s`;
}

function generateAsteroidBeltShadow(count = 120, minRadius = 100, maxRadius = 400, dotSize = 0.8) {
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const x = (radius * Math.cos(angle)).toFixed(2);
        const y = (radius * Math.sin(angle)).toFixed(2);
        shadows.push(`${x}px ${y}px 0 ${dotSize}px rgba(255,255,255,${Math.random().toFixed(2)})`);
    }
    return shadows.join(", ");
}

function createSun() {
    const sun = document.createElement("div");
    sun.className = "solar-sun";
    return sun;
}

function createOrbit(planet) {
    const orbit = document.createElement("div");
    orbit.className = `solar-orbit ${planet.name}`;
    Object.assign(orbit.style, {
        width: `${planet.orbit}px`,
        height: `${planet.orbit}px`,
        marginTop: `${-planet.orbit / 2}px`,
        marginLeft: `${-planet.orbit / 2}px`,
        animation: `orb ${revolutionDuration(planet.days)} linear infinite`
    });

    const body = document.createElement("div");
    body.className = "solar-planet";
    Object.assign(body.style, {
        width: `${planet.size}px`,
        height: `${planet.size}px`,
        marginTop: `${-planet.size / 2}px`,
        marginLeft: `${-planet.size / 2}px`,
        background: planet.color
    });

    if (planet.isBelt) {
        body.style.background = "transparent";
        body.style.boxShadow = "none";
        const beltCore = document.createElement("div");
        beltCore.className = "solar-belt-core";
        beltCore.style.boxShadow = generateAsteroidBeltShadow();
        orbit.appendChild(beltCore);
    }
    orbit.appendChild(body);

    if (planet.hasMoon) {
        const moon = document.createElement("div");
        moon.className = "solar-moon";
        moon.style.animation = `orb ${revolutionDuration(27.3216)} linear infinite`;
        orbit.appendChild(moon);
    }

    if (planet.hasRings) {
        const ring = document.createElement("div");
        ring.className = "solar-rings";
        ring.style.animation = `orb ${revolutionDuration(planet.days)} linear infinite reverse`;
        orbit.appendChild(ring);
    }

    return orbit;
}

export const solarSystem = {
    id: "solarSystem",
    labelKey: "background_section_solar_system",
    defaults: {},
    controls: [],
    restartOnResize: false,

    start(layer) {
        const system = document.createElement("div");
        system.className = "solar-syst";
        system.append(createSun(), ...PLANETS.map(createOrbit));
        layer.appendChild(system);
        return () => {};
    }
};
