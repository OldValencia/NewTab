/*
* No customization needed
* */

function enableSolarSystem() {
    cleanupBeforeEnableBackground();

    const solarSystem = document.createElement("div");
    solarSystem.className = "solar-syst";
    solarSystem.style.position = "relative";
    solarSystem.style.width = "100%";
    solarSystem.style.height = "100%";
    solarSystem.style.margin = "0 auto";

    const planets = [
        { name: "sun", size: 40, color: "radial-gradient(ellipse at center, #ffd000 1%,#f9b700 39%,#f9b700 39%,#e06317 100%)", glow: true },
        { name: "mercury", orbit: 70, size: 4, color: "#9f5e26", days: 87.5 },
        { name: "venus", orbit: 100, size: 8, color: "#BEB768", days: 224.7 },
        { name: "earth", orbit: 145, size: 6, color: "#11abe9", days: 365.2563, moon: true },
        { name: "mars", orbit: 190, size: 6, color: "#cf3921", days: 687 },
        { name: "jupiter", orbit: 340, size: 18, color: "#c76e2a", days: 4331 },
        { name: "saturn", orbit: 440, size: 12, color: "#e7c194", days: 10747, rings: true },
        { name: "uranus", orbit: 520, size: 10, color: "#b5e3e3", days: 30589 },
        { name: "neptune", orbit: 630, size: 10, color: "#175e9e", days: 59802 },
        { name: "pluto", orbit: 780, size: 3, color: "#fff", days: 90580 },
        { name: "asteroids-belt", orbit: 300, size: 210, color: "transparent", days: 2191, belt: true }
    ];

    planets.forEach(p => {
        const planet = document.createElement("div");
        planet.className = p.name;
        planet.style.position = "absolute";
        planet.style.top = "50%";
        planet.style.left = "50%";
        planet.style.borderRadius = "1000px";
        planet.style.zIndex = "999";

        if (p.name === "sun") {
            planet.style.width = `${p.size}px`;
            planet.style.height = `${p.size}px`;
            planet.style.marginTop = `${-p.size / 2}px`;
            planet.style.marginLeft = `${-p.size / 2}px`;
            planet.style.background = p.color;
            planet.style.boxShadow = "0 0 10px 2px rgba(255, 107, 0, 0.4), 0 0 22px 11px rgba(255, 203, 0, 0.13)";
        } else {
            planet.style.width = `${p.orbit}px`;
            planet.style.height = `${p.orbit}px`;
            planet.style.marginTop = `${-p.orbit / 2}px`;
            planet.style.marginLeft = `${-p.orbit / 2}px`;
            planet.style.border = "1px solid rgba(102, 166, 229, 0.12)";
            planet.style.animation = `orb ${revolution(p.days)} linear infinite`;

            const body = document.createElement("div");
            body.style.position = "absolute";
            body.style.left = "50%";
            body.style.borderRadius = "100px";
            body.style.height = `${p.size}px`;
            body.style.width = `${p.size}px`;
            body.style.marginTop = `${-p.size / 2}px`;
            body.style.marginLeft = `${-p.size / 2}px`;
            body.style.background = p.color;
            if (p.belt) {
                // Удаляем boxShadow у body
                body.style.background = "transparent";
                body.style.boxShadow = "none";

                // Создаём отдельный элемент для астероидов
                const beltCore = document.createElement("div");
                beltCore.style.position = "absolute";
                beltCore.style.top = "50%";
                beltCore.style.left = "50%";
                beltCore.style.width = "2px";
                beltCore.style.height = "2px";
                beltCore.style.marginLeft = "-1px";
                beltCore.style.marginTop = "-1px";
                beltCore.style.borderRadius = "100px";
                beltCore.style.background = "white";
                beltCore.style.boxShadow = generateAsteroidBelt();
                planet.appendChild(beltCore);
            } else {
                // Обычные планеты
                body.style.boxShadow = "inset 0 6px 0 -2px rgba(0, 0, 0, 0.25)";
            }
            planet.appendChild(body);

            if (p.moon) {
                const moon = document.createElement("div");
                moon.style.position = "absolute";
                moon.style.height = "18px";
                moon.style.width = "18px";
                moon.style.left = "50%";
                moon.style.top = "0px";
                moon.style.marginLeft = "-9px";
                moon.style.marginTop = "-9px";
                moon.style.borderRadius = "100px";
                moon.style.boxShadow = "0 -10px 0 -8px grey";
                moon.style.animation = `orb ${revolution(27.3216)} linear infinite`;
                planet.appendChild(moon);
            }

            if (p.rings) {
                const ring = document.createElement("div");
                ring.style.position = "absolute";
                ring.style.height = "2.34%";
                ring.style.width = "4.676%";
                ring.style.left = "50%";
                ring.style.top = "0px";
                ring.style.marginLeft = "-2.3%";
                ring.style.marginTop = "-1.2%";
                ring.style.borderRadius = "50%";
                ring.style.transform = "rotateZ(-52deg)";
                ring.style.boxShadow = "0 1px 0 1px #987641, 3px 1px 0 #987641, -3px 1px 0 #987641";
                ring.style.animation = `orb ${revolution(p.days)} linear infinite reverse`;
                ring.style.transformOrigin = "52% 60%";
                planet.appendChild(ring);
            }
        }

        solarSystem.appendChild(planet);
        solarSystem.style.background = "radial-gradient(ellipse at center bottom, #1C2837 0%, #1A2634 30%, #11161C 60%, #050608 100%)";
    });

    backgroundLayer.appendChild(solarSystem);
}

function revolution(days) {
    const yearInSeconds = 30;
    return `${(days * yearInSeconds / 365.2563).toFixed(2)}s`;
}

function generateAsteroidBelt(count = 120, minRadius = 100, maxRadius = 400, starSize = 0.8) {
    const stars = [];

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const x = (radius * Math.cos(angle)).toFixed(2);
        const y = (radius * Math.sin(angle)).toFixed(2);
        const alpha = Math.random().toFixed(2);
        stars.push(`${x}px ${y}px 0 ${starSize}px rgba(255,255,255,${alpha})`);
    }

    return stars.join(", ");
}
