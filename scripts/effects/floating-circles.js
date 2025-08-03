/*
* Background color
* Circles color
* */

function enableFloatingCirclesBackground() {
    cleanupBeforeEnableBackground();

    const area = document.createElement("div");
    area.className = "area";

    const ul = document.createElement("ul");
    ul.className = "circles";

    const circleConfigs = [
        { left: "25%", size: 80, delay: "0s" },
        { left: "10%", size: 20, delay: "2s", duration: "12s" },
        { left: "70%", size: 20, delay: "4s" },
        { left: "40%", size: 60, delay: "0s", duration: "18s" },
        { left: "65%", size: 20, delay: "0s" },
        { left: "75%", size: 110, delay: "3s" },
        { left: "35%", size: 150, delay: "7s" },
        { left: "50%", size: 25, delay: "15s", duration: "45s" },
        { left: "20%", size: 15, delay: "2s", duration: "35s" },
        { left: "85%", size: 150, delay: "0s", duration: "11s" }
    ];

    circleConfigs.forEach(config => {
        const li = document.createElement("li");
        li.style.width = `${config.size}px`;
        li.style.height = `${config.size}px`;
        li.style.left = config.left;
        li.style.animation = `animate ${config.duration || "25s"} ease infinite`;
        li.style.animationDelay = config.delay;
        ul.appendChild(li);
    });

    area.appendChild(ul);
    backgroundLayer.appendChild(area);
}
